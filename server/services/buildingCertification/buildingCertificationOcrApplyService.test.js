/**
 * Batch 4 — merge + apply helpers for APE OCR → buildings / user_consumptions.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createRequire } from 'node:module';
import * as dbModule from '../../db.js';

const pool = dbModule.default ?? dbModule;

const require = createRequire(import.meta.url);
const {
  mergeBuildingRowFromPrefill,
  formatRegionForUi,
  mapUseTypeToUsage,
  applyBuildingCertificationOcrPrefill,
  BuildingCertificationOcrApplyError,
} = require('./buildingCertificationOcrApplyService.js');

describe('mergeBuildingRowFromPrefill', () => {
  const base = {
    address: 'Old',
    usage: 'Vecchio',
    location: 'Lazio',
    region: 'Lazio',
    municipality: 'Roma',
    street: 'Via Old',
    street_number: '1',
    climate_zone: 'E',
    construction_year: 'Tra 1991 e 2004',
    construction_year_value: 2000,
    cap: '00100',
    country: 'Italia',
    name: 'HQ',
  };

  it('overwrites only keys present in the prefill patch', () => {
    const { updates } = mergeBuildingRowFromPrefill(base, {
      building: {
        location: { region: 'TOSCANA', municipality: 'GROSSETO' },
        details: {},
      },
    });
    expect(updates.region).toBe('Toscana');
    expect(updates.municipality).toBe('GROSSETO');
    expect(updates.usage).toBeUndefined();
  });

  it('maps useType and construction year bucket', () => {
    const { updates } = mergeBuildingRowFromPrefill(base, {
      building: {
        location: {},
        details: { useType: 'non_residential', constructionYear: 1985 },
      },
    });
    expect(updates.usage).toBe('Non residenziale');
    expect(updates.construction_year_value).toBe(1985);
    expect(updates.construction_year).toBe('Tra 1976 e 1991');
  });

  it('rebuilds address when street components change', () => {
    const { updates } = mergeBuildingRowFromPrefill(base, {
      building: {
        location: { street: 'via Bonghi', streetNumber: '7', municipality: 'GROSSETO' },
        details: {},
      },
    });
    expect(updates.street).toBe('via Bonghi');
    expect(updates.address).toContain('via Bonghi');
    expect(updates.address).toContain('GROSSETO');
  });
});

describe('formatRegionForUi / mapUseTypeToUsage', () => {
  it('title-cases region', () => {
    expect(formatRegionForUi('TOSCANA')).toBe('Toscana');
  });

  it('maps canonical use types', () => {
    expect(mapUseTypeToUsage('residential')).toBe('Residenziale');
    expect(mapUseTypeToUsage('non_residential')).toBe('Non residenziale');
  });
});

describe('applyBuildingCertificationOcrPrefill (DB wiring)', () => {
  afterEach(() => {
    pool.resetPoolTestDouble?.();
  });

  beforeEach(() => {
    pool.resetPoolTestDouble?.();
  });

  it('upserts consumption by energy_source idempotently', async () => {
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

    let userConsumptionsSelectByEnergy = 0;
    pool.query.mockImplementation(async (sql) => {
      const s = String(sql);
      if (s.includes('results_visible')) return { rows: [{ id: 9, results_visible: false }] };
      if (s.includes('SELECT * FROM buildings') && s.includes('AND user_id')) {
        return { rows: [buildingRow] };
      }
      if (s.startsWith('UPDATE buildings')) return { rows: [] };
      if (s.includes('SELECT id FROM user_consumptions')) {
        userConsumptionsSelectByEnergy += 1;
        return { rows: [{ id: 100 }] };
      }
      if (s.startsWith('UPDATE user_consumptions')) return { rows: [] };
      if (s.startsWith('INSERT INTO user_consumptions')) return { rows: [] };
      if (s.includes('SELECT * FROM user_consumptions') && s.includes('ORDER BY')) {
        return { rows: [{ id: 100, energy_source: 'Elettricità', consumption: '4130.84' }] };
      }
      return { rows: [] };
    });

    await applyBuildingCertificationOcrPrefill({
      userId: 42,
      buildingId: 9,
      prefill: {
        building: { location: {}, details: {} },
        consumptions: [{ energySource: 'electricity', amount: 4130.84, plantId: null }],
      },
    });

    expect(userConsumptionsSelectByEnergy).toBeGreaterThanOrEqual(1);
  });

  it('throws when building not found', async () => {
    pool.query.mockImplementation(async (sql) => {
      const s = String(sql);
      if (s.includes('results_visible')) return { rows: [] };
      return { rows: [] };
    });
    await expect(
      applyBuildingCertificationOcrPrefill({
        userId: 1,
        buildingId: 999,
        prefill: { building: { location: {}, details: {} }, consumptions: [] },
      }),
    ).rejects.toBeInstanceOf(BuildingCertificationOcrApplyError);
  });
});
