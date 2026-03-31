const { applyNormalizations, validateNormalizedOutput } = require('../../services/ocr/ocrOutputValidator');
const {
  buildTransportV2VehiclePrefill,
  createEmptyFields,
  mergeOcrVehiclePrefill,
} = require('../../services/transportV2OcrPrefillService');

describe('transportV2OcrPrefillService', () => {
  it('exposes empty vehicle fields aligned with Transport V2 draft emissions inputs', () => {
    expect(Object.keys(createEmptyFields()).sort()).toEqual(
      [
        'annual_km',
        'blue_sticker',
        'euro_class',
        'fuel_type',
        'goods_vehicle_over_3_5_tons',
        'last_revision_date',
        'load_profile_code',
        'occupancy_profile_code',
        'registration_year',
        'wltp_co2_g_km',
        'wltp_co2_g_km_alt_fuel',
      ].sort(),
    );
  });

  it('normalizes OCR values into Block 1/2 canonical enums and derives the 3.5 ton flag from mass', () => {
    const reviewFields = applyNormalizations([
      {
        key: 'registration_year',
        label: 'Anno immatricolazione',
        value: '2020',
        confidence: 0.99,
      },
      {
        key: 'euro_class',
        label: 'Classe Euro',
        value: 'Euro 6d-temp',
        confidence: 0.94,
      },
      {
        key: 'fuel_type',
        label: 'Tipo carburante',
        value: 'Diesel',
        confidence: 0.96,
      },
      {
        key: 'max_vehicle_mass_kg',
        label: 'Massa massima veicolo (kg)',
        value: '3.650 kg',
        confidence: 0.92,
      },
    ]);

    const validationIssues = validateNormalizedOutput(reviewFields);
    const vehiclePrefill = buildTransportV2VehiclePrefill({
      documentId: 456,
      reviewFields,
    });

    expect(validationIssues).toEqual([]);
    expect(vehiclePrefill).toEqual({
      vehicle_id: 'ocr-doc-456',
      transport_mode: null,
      ocr_document_id: 456,
      fields: {
        registration_year: 2020,
        euro_class: 'EURO_6d_temp',
        fuel_type: 'diesel',
        wltp_co2_g_km: null,
        wltp_co2_g_km_alt_fuel: null,
        goods_vehicle_over_3_5_tons: true,
        occupancy_profile_code: null,
        load_profile_code: null,
        last_revision_date: null,
        blue_sticker: null,
        annual_km: null,
      },
      field_sources: {
        registration_year: {
          source: 'ocr',
          document_id: 456,
          confidence: 0.99,
        },
        euro_class: {
          source: 'ocr',
          document_id: 456,
          confidence: 0.94,
        },
        fuel_type: {
          source: 'ocr',
          document_id: 456,
          confidence: 0.96,
        },
        goods_vehicle_over_3_5_tons: {
          source: 'ocr_derived',
          document_id: 456,
          confidence: 0.92,
        },
      },
      field_warnings: {},
      row_notes: null,
    });
  });

  it('keeps user-only fields when reapplying the same OCR-linked row', () => {
    const existingVehicle = {
      vehicle_id: 'ocr-doc-456',
      transport_mode: 'goods',
      ocr_document_id: 456,
      fields: {
        registration_year: 2018,
        euro_class: 'EURO_5',
        fuel_type: 'diesel',
        wltp_co2_g_km: 220,
        wltp_co2_g_km_alt_fuel: null,
        goods_vehicle_over_3_5_tons: false,
        occupancy_profile_code: null,
        load_profile_code: 3,
        last_revision_date: '2025-01-10',
        blue_sticker: true,
        annual_km: 18000,
      },
      field_sources: {
        annual_km: {
          source: 'user',
        },
      },
      field_warnings: {},
      row_notes: 'note',
    };

    const nextVehicle = mergeOcrVehiclePrefill(existingVehicle, {
      vehicle_id: 'ocr-doc-456',
      transport_mode: null,
      ocr_document_id: 456,
      fields: {
        registration_year: 2020,
        euro_class: 'EURO_6',
        fuel_type: 'diesel',
        wltp_co2_g_km: null,
        wltp_co2_g_km_alt_fuel: null,
        goods_vehicle_over_3_5_tons: true,
        occupancy_profile_code: null,
        load_profile_code: null,
        last_revision_date: null,
        blue_sticker: null,
        annual_km: null,
      },
      field_sources: {
        registration_year: {
          source: 'ocr',
          document_id: 456,
        },
        euro_class: {
          source: 'ocr',
          document_id: 456,
        },
        fuel_type: {
          source: 'ocr',
          document_id: 456,
        },
        goods_vehicle_over_3_5_tons: {
          source: 'ocr_derived',
          document_id: 456,
        },
      },
      field_warnings: {},
      row_notes: null,
    });

    expect(nextVehicle.transport_mode).toBe('goods');
    expect(nextVehicle.fields.registration_year).toBe(2020);
    expect(nextVehicle.fields.load_profile_code).toBe(3);
    expect(nextVehicle.fields.annual_km).toBe(18000);
    expect(nextVehicle.fields.wltp_co2_g_km).toBe(220);
    expect(nextVehicle.field_sources.annual_km).toEqual({ source: 'user' });
  });
});
