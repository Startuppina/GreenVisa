import { describe, expect, it } from 'vitest';
import { buildOcrUploadPreviewLines } from '../../../src/features/transportV2/utils/ocrResultPreview.js';

describe('buildOcrUploadPreviewLines', () => {
  it('includes CO₂ emissions from transportV2VehiclePrefill.fields', () => {
    const lines = buildOcrUploadPreviewLines({
      transportV2VehiclePrefill: {
        transport_mode: 'goods',
        fields: {
          registration_year: 2018,
          euro_class: 'EURO_5',
          fuel_type: 'diesel',
          co2_emissions_g_km: 143,
        },
      },
    });

    const co2Line = lines.find(([label]) => label.includes('CO₂ emissions'));
    expect(co2Line).toEqual(['CO₂ emissions (g/km)', '143']);
  });

  it('falls back to reviewPayload.fields when prefill omits co2_emissions_g_km', () => {
    const lines = buildOcrUploadPreviewLines({
      transportV2VehiclePrefill: {
        transport_mode: 'passenger',
        fields: {
          registration_year: 2020,
          euro_class: 'EURO_6',
          fuel_type: 'benzina',
          co2_emissions_g_km: null,
        },
      },
      reviewPayload: {
        fields: [{ key: 'co2_emissions_g_km', normalizedValue: 128, value: '128 g/km' }],
      },
    });

    const co2Line = lines.find(([label]) => label.includes('CO₂ emissions'));
    expect(co2Line).toEqual(['CO₂ emissions (g/km)', '128']);
  });

  it('surfaces max_vehicle_mass_kg from normalizedOutput.fields', () => {
    const lines = buildOcrUploadPreviewLines({
      transportV2VehiclePrefill: {
        fields: {},
      },
      normalizedOutput: {
        fields: [{ key: 'max_vehicle_mass_kg', normalizedValue: 2400, value: '2400' }],
      },
    });

    expect(lines.some(([l, v]) => l === 'Max vehicle mass (kg)' && v === '2400')).toBe(true);
  });

  it('shows goods_vehicle_over_3_5_tons from prefill or review fields', () => {
    const fromPrefill = buildOcrUploadPreviewLines({
      transportV2VehiclePrefill: {
        fields: { goods_vehicle_over_3_5_tons: true },
      },
    });
    expect(fromPrefill.find(([l]) => l === 'Goods vehicle over 3.5 t')).toEqual([
      'Goods vehicle over 3.5 t',
      'Yes',
    ]);

    const fromReview = buildOcrUploadPreviewLines({
      transportV2VehiclePrefill: { fields: {} },
      reviewPayload: {
        fields: [{ key: 'goods_vehicle_over_3_5_tons', normalizedValue: false, value: 'No' }],
      },
    });
    expect(fromReview.find(([l]) => l === 'Goods vehicle over 3.5 t')).toEqual([
      'Goods vehicle over 3.5 t',
      'No',
    ]);
  });
});
