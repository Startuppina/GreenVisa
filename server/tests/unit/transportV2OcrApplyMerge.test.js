const { buildTransportV2VehiclePrefill } = require('../../services/transportV2OcrPrefillService');
const { applyOcrVehicleToTransportV2 } = require('../../services/transportV2DraftService');

function buildVehiclePrefill(documentId, overrides = {}) {
  return buildTransportV2VehiclePrefill({
    documentId,
    reviewFields: [
      {
        key: 'registration_year',
        normalizedValue: 2020,
        confidence: 0.99,
        warnings: [],
      },
      {
        key: 'fuel_type',
        normalizedValue: 'diesel',
        confidence: 0.97,
        warnings: [],
      },
      {
        key: 'euro_class',
        normalizedValue: 'EURO_6',
        confidence: 0.96,
        warnings: [],
      },
      {
        key: 'max_vehicle_mass_kg',
        normalizedValue: 3500,
        confidence: 0.92,
        warnings: [],
      },
    ],
    ...overrides,
  });
}

describe('applyOcrVehicleToTransportV2', () => {
  const certificationId = 123;
  const now = '2026-03-30T10:00:00.000Z';

  it('appends a new OCR row and preserves questionnaire flags', () => {
    const transportV2 = applyOcrVehicleToTransportV2(
      {
        meta: {
          version: 1,
          certification_id: certificationId,
          status: 'draft',
          started_at: now,
          updated_at: now,
          submitted_at: null,
        },
        draft: {
          questionnaire_flags: {
            uses_navigator: true,
          },
          vehicles: [
            {
              vehicle_id: 'manual-1',
              transport_mode: 'passenger',
              ocr_document_id: null,
              fields: {
                registration_year: 2024,
              },
              field_sources: {},
              field_warnings: {},
              row_notes: null,
            },
          ],
        },
        derived: {},
        results: {},
      },
      {
        certificationId,
        now,
        transportMode: null,
        vehiclePrefill: buildVehiclePrefill(456),
      },
    );

    expect(transportV2.draft.questionnaire_flags).toEqual({
      uses_navigator: true,
    });
    expect(transportV2.draft.vehicles).toHaveLength(2);
    expect(transportV2.draft.vehicles[0].vehicle_id).toBe('manual-1');
    expect(transportV2.draft.vehicles[1].ocr_document_id).toBe(456);
  });

  it('updates an existing OCR-linked row in place without duplicating it', () => {
    const transportV2 = applyOcrVehicleToTransportV2(
      {
        meta: {
          version: 1,
          certification_id: certificationId,
          status: 'draft',
          started_at: now,
          updated_at: now,
          submitted_at: null,
        },
        draft: {
          questionnaire_flags: {},
          vehicles: [
            {
              vehicle_id: 'ocr-doc-456',
              transport_mode: 'goods',
              ocr_document_id: 456,
              fields: {
                registration_year: 2018,
                euro_class: 'EURO_5',
                fuel_type: 'diesel',
                wltp_co2_g_km: null,
                wltp_co2_g_km_alt_fuel: null,
                goods_vehicle_over_3_5_tons: false,
                occupancy_profile_code: null,
                load_profile_code: 2,
                last_revision_date: null,
                blue_sticker: null,
                annual_km: 20000,
              },
              field_sources: {
                annual_km: {
                  source: 'user',
                },
              },
              field_warnings: {},
              row_notes: null,
            },
          ],
        },
        derived: {},
        results: {},
      },
      {
        certificationId,
        now,
        transportMode: 'goods',
        vehiclePrefill: buildVehiclePrefill(456),
      },
    );

    expect(transportV2.draft.vehicles).toHaveLength(1);
    expect(transportV2.draft.vehicles[0].fields.registration_year).toBe(2020);
    expect(transportV2.draft.vehicles[0].fields.annual_km).toBe(20000);
    expect(transportV2.draft.vehicles[0].transport_mode).toBe('goods');
  });
});
