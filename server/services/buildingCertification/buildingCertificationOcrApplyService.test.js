/**
 * Building certification OCR apply — `applyBuildingCertificationOcrPatch` + pure helpers.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import * as dbModule from '../../db.js';

const pool = dbModule.default ?? dbModule;

const require = createRequire(import.meta.url);
const {
  applyBuildingCertificationOcrPatch,
  BuildingCertificationOcrHttpError,
  deriveConstructionYearLabel,
  composeLegacyBuildingAddress,
} = require('./buildingCertificationOcrApplyService.js');

describe('deriveConstructionYearLabel', () => {
  it('buckets a valid year', () => {
    expect(deriveConstructionYearLabel(1985)).toBe('Tra 1976 e 1991');
  });

  it('returns null for invalid input', () => {
    expect(deriveConstructionYearLabel(null)).toBe(null);
  });
});

describe('composeLegacyBuildingAddress', () => {
  it('joins street components', () => {
    const addr = composeLegacyBuildingAddress({
      address: '',
      street: 'Via Roma',
      streetNumber: '1',
      municipality: 'Roma',
      cap: '00100',
      location: 'Lazio',
      country: 'Italia',
    });
    expect(addr).toContain('Via Roma');
    expect(addr).toContain('Roma');
  });
});

describe('applyBuildingCertificationOcrPatch', () => {
  afterEach(() => {
    delete pool.connect;
    pool.resetPoolTestDouble?.();
    vi.restoreAllMocks();
  });

  beforeEach(() => {
    pool.resetPoolTestDouble?.();
  });

  it('merges prefill into buildings and upserts consumptions (transaction path)', async () => {
    const buildingRow = {
      id: 9,
      user_id: 42,
      name: 'B',
      address: 'x',
      usage: 'Ufficio',
      location: 'Lazio',
      region: 'Lazio',
      municipality: 'Roma',
      street: 'S',
      street_number: '1',
      climate_zone: 'E',
      construction_year: 'Dopo il 2004',
      construction_year_value: 2010,
      cap: '00100',
      country: 'Italia',
      results_visible: false,
    };

    const client = {
      query: vi.fn(async (sql) => {
        const s = String(sql);
        if (s === 'BEGIN') return {};
        if (s.includes('FOR UPDATE')) return { rows: [buildingRow] };
        if (s.startsWith('UPDATE buildings')) return { rowCount: 1, rows: [] };
        if (s.startsWith('UPDATE user_consumptions')) return { rowCount: 1, rows: [] };
        if (s.startsWith('INSERT INTO user_consumptions')) return { rowCount: 1, rows: [] };
        if (s === 'COMMIT') return {};
        if (s === 'ROLLBACK') return {};
        return { rows: [] };
      }),
      release: vi.fn(),
    };

    pool.connect = vi.fn().mockResolvedValue(client);
    vi.spyOn(pool, 'query').mockImplementation(async (sql) => {
      const s = String(sql);
      if (s.includes('SELECT * FROM buildings') && s.includes('AND user_id')) {
        return { rows: [buildingRow] };
      }
      if (s.includes('SELECT * FROM user_consumptions') && s.includes('ORDER BY')) {
        return { rows: [{ id: 100, energy_source: 'Elettricità', consumption: 10 }] };
      }
      return { rows: [] };
    });

    const result = await applyBuildingCertificationOcrPatch({
      userId: 42,
      buildingId: 9,
      prefillPatch: {
        building: { location: { region: 'Toscana' }, details: {} },
        consumptions: [{ energySource: 'Elettricità', consumption: 10, plantId: null }],
      },
    });

    expect(client.query).toHaveBeenCalled();
    expect(result.buildingId).toBe(9);
    expect(Array.isArray(result.consumptions)).toBe(true);
  });

  it('throws BuildingCertificationOcrHttpError when building not found', async () => {
    const client = {
      query: vi.fn(async (sql) => {
        const s = String(sql);
        if (s === 'BEGIN') return {};
        if (s.includes('FOR UPDATE')) return { rows: [] };
        if (s === 'ROLLBACK') return {};
        return { rows: [] };
      }),
      release: vi.fn(),
    };
    pool.connect = vi.fn().mockResolvedValue(client);

    await expect(
      applyBuildingCertificationOcrPatch({
        userId: 1,
        buildingId: 999,
        prefillPatch: { building: { location: {}, details: {} }, consumptions: [] },
      }),
    ).rejects.toBeInstanceOf(BuildingCertificationOcrHttpError);
  });
});
