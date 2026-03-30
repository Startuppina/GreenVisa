import { describe, expect, it } from 'vitest';
import { applyUserFieldEdit } from '../../../src/transportV2/transportV2FieldSources.js';

function baseVehicle(overrides = {}) {
  return {
    vehicle_id: 'v-1',
    transport_mode: 'passenger',
    fields: {
      annual_km: 1000,
      fuel_type: 'diesel',
    },
    field_sources: {},
    field_warnings: {},
    ...overrides,
  };
}

describe('applyUserFieldEdit', () => {
  it('sets source to user when no previous source exists', () => {
    const next = applyUserFieldEdit(baseVehicle(), 'annual_km', 2000);
    expect(next.field_sources.annual_km).toEqual({ source: 'user' });
    expect(next.fields.annual_km).toBe(2000);
  });

  it('keeps user source when editing again', () => {
    const vehicle = baseVehicle({
      field_sources: { annual_km: { source: 'user' } },
    });
    const next = applyUserFieldEdit(vehicle, 'annual_km', 3000);
    expect(next.field_sources.annual_km).toEqual({ source: 'user' });
  });

  it('preserves ocr when value unchanged', () => {
    const ocrSource = {
      source: 'ocr',
      document_id: 42,
      confidence: 0.9,
    };
    const vehicle = baseVehicle({
      fields: { annual_km: 5000 },
      field_sources: { annual_km: { ...ocrSource } },
    });
    const next = applyUserFieldEdit(vehicle, 'annual_km', 5000);
    expect(next.field_sources.annual_km).toEqual(ocrSource);
  });

  it('becomes mixed when ocr value changes, preserving document_id and confidence', () => {
    const vehicle = baseVehicle({
      fields: { annual_km: 5000 },
      field_sources: {
        annual_km: { source: 'ocr', document_id: 42, confidence: 0.9 },
      },
    });
    const next = applyUserFieldEdit(vehicle, 'annual_km', 6000);
    expect(next.field_sources.annual_km).toEqual({
      source: 'mixed',
      document_id: 42,
      confidence: 0.9,
    });
  });

  it('preserves ocr_derived when value unchanged', () => {
    const src = {
      source: 'ocr_derived',
      document_id: 7,
      confidence: 0.88,
    };
    const vehicle = baseVehicle({
      fields: { wltp_co2_g_km: 120 },
      field_sources: { wltp_co2_g_km: { ...src } },
    });
    const next = applyUserFieldEdit(vehicle, 'wltp_co2_g_km', 120);
    expect(next.field_sources.wltp_co2_g_km).toEqual(src);
  });

  it('becomes mixed when ocr_derived value changes, preserving metadata', () => {
    const vehicle = baseVehicle({
      fields: { wltp_co2_g_km: 120 },
      field_sources: {
        wltp_co2_g_km: { source: 'ocr_derived', document_id: 7, confidence: 0.88 },
      },
    });
    const next = applyUserFieldEdit(vehicle, 'wltp_co2_g_km', 130);
    expect(next.field_sources.wltp_co2_g_km).toEqual({
      source: 'mixed',
      document_id: 7,
      confidence: 0.88,
    });
  });

  it('keeps mixed on further edits', () => {
    const vehicle = baseVehicle({
      field_sources: { annual_km: { source: 'mixed', document_id: 1 } },
    });
    const next = applyUserFieldEdit(vehicle, 'annual_km', 999);
    expect(next.field_sources.annual_km).toEqual({ source: 'mixed', document_id: 1 });
  });

  it('clears warning for edited field only when value actually changes', () => {
    const vehicle = baseVehicle({
      fields: { annual_km: 1000, fuel_type: 'diesel' },
      field_warnings: {
        annual_km: [{ code: 'low_confidence', message: 'check' }],
        fuel_type: [{ code: 'x', message: 'y' }],
      },
    });
    const same = applyUserFieldEdit(vehicle, 'annual_km', 1000);
    expect(same.field_warnings.annual_km).toBeDefined();

    const changed = applyUserFieldEdit(vehicle, 'annual_km', 2000);
    expect(changed.field_warnings.annual_km).toBeUndefined();
    expect(changed.field_warnings.fuel_type).toEqual([{ code: 'x', message: 'y' }]);
  });

  it('does not touch warnings on unrelated fields', () => {
    const vehicle = baseVehicle({
      fields: { annual_km: 1, fuel_type: 'diesel' },
      field_warnings: {
        fuel_type: [{ code: 'warn', message: 'keep' }],
      },
    });
    const next = applyUserFieldEdit(vehicle, 'annual_km', 2);
    expect(next.field_warnings.fuel_type).toEqual([{ code: 'warn', message: 'keep' }]);
  });

  it('does not remove unrelated field_sources entries', () => {
    const vehicle = baseVehicle({
      field_sources: {
        annual_km: { source: 'user' },
        fuel_type: { source: 'ocr', document_id: 9 },
      },
    });
    const next = applyUserFieldEdit(vehicle, 'annual_km', 5);
    expect(next.field_sources.fuel_type).toEqual({ source: 'ocr', document_id: 9 });
    expect(next.field_sources.annual_km).toEqual({ source: 'user' });
  });
});
