const { normalizeProviderOutput } = require('../../services/ocr/fieldMapper');
const { applyNormalizations, validateNormalizedOutput } = require('../../services/ocr/ocrOutputValidator');
const { buildTransportV2VehiclePrefill } = require('../../services/transportV2OcrPrefillService');

describe('normalizeProviderOutput', () => {
  it('maps provider entities to Transport V2-oriented OCR review keys', () => {
    const result = normalizeProviderOutput({
      entities: [
        {
          type: 'registration_year',
          normalizedValue: '2020',
          mentionText: '2020',
          confidence: 0.99,
          pageNumber: 1,
        },
        {
          type: 'euro_class',
          normalizedValue: 'Euro 6',
          mentionText: 'Euro 6',
          confidence: 0.94,
          pageNumber: 1,
        },
        {
          type: 'fuel_type',
          normalizedValue: 'Diesel',
          mentionText: 'Diesel',
          confidence: 0.96,
          pageNumber: 1,
        },
        {
          type: 'gross_vehicle_mass_kg',
          normalizedValue: '3500',
          mentionText: '3500 kg',
          confidence: 0.91,
          pageNumber: 1,
        },
      ],
    });

    expect(result.fields.map((field) => field.key)).toEqual([
      'registration_year',
      'euro_class',
      'fuel_type',
      'max_vehicle_mass_kg',
    ]);
    expect(result.fields.find((field) => field.key === 'max_vehicle_mass_kg')).toEqual(
      expect.objectContaining({
        key: 'max_vehicle_mass_kg',
        value: '3500',
        confidence: 0.91,
        sourceMethod: 'EXTRACT',
      }),
    );
    expect(result.fields.some((field) => field.key === 'registrationYear')).toBe(false);
    expect(result.fields.some((field) => field.key === 'goodsVehicleOver2_5Tons')).toBe(false);
  });

  it('supports alternate provider aliases for vehicle mass extraction', () => {
    const result = normalizeProviderOutput({
      entities: [
        {
          type: 'vehicle_mass',
          normalizedValue: '4200',
          mentionText: '4200 kg',
          confidence: 0.88,
          pageNumber: 1,
        },
      ],
    });

    expect(result.fields.find((field) => field.key === 'max_vehicle_mass_kg')).toEqual(
      expect.objectContaining({
        value: '4200',
        confidence: 0.88,
      }),
    );
  });

  it('maps Google first_registration_date (ISO) to internal registration_year with integer year value', () => {
    const result = normalizeProviderOutput({
      entities: [
        {
          type: 'first_registration_date',
          normalizedValue: '2016-06-28',
          mentionText: '28.06.2016',
          confidence: 0.9999,
          pageNumber: 1,
        },
      ],
    });

    const reg = result.fields.find((field) => field.key === 'registration_year');
    expect(reg).toEqual(
      expect.objectContaining({
        value: 2016,
        sourceMethod: 'EXTRACT',
        confidence: 0.9999,
      }),
    );
  });

  it('maps Google first_registration_date (d.m.y mention) to registration_year', () => {
    const result = normalizeProviderOutput({
      entities: [
        {
          type: 'first_registration_date',
          normalizedValue: '',
          mentionText: '28.06.2016',
          confidence: 0.99,
          pageNumber: 2,
        },
      ],
    });

    expect(result.fields.find((field) => field.key === 'registration_year')).toEqual(
      expect.objectContaining({
        value: 2016,
        sourceMethod: 'EXTRACT',
      }),
    );
  });

  it('maps Google max_vehicle_mass_kg through normalization to goods_vehicle_over_3_5_tons false when under threshold', () => {
    const { fields } = normalizeProviderOutput({
      entities: [
        {
          type: 'max_vehicle_mass_kg',
          normalizedValue: '1500',
          mentionText: '1500',
          confidence: 0.9999,
          pageNumber: 1,
        },
        {
          type: 'euro_class',
          mentionText: 'EURO6B',
          normalizedValue: 'EURO6B',
          confidence: 0.98,
          pageNumber: 1,
        },
      ],
    });

    const normalized = applyNormalizations(fields);
    const prefill = buildTransportV2VehiclePrefill({ documentId: 1, reviewFields: normalized });

    expect(prefill.fields.goods_vehicle_over_3_5_tons).toBe(false);
    expect(prefill.field_sources.goods_vehicle_over_3_5_tons).toMatchObject({
      source: 'ocr_derived',
      document_id: 1,
    });
    expect(prefill.fields.euro_class).toBe('EURO_6b');
    expect(validateNormalizedOutput(normalized).filter((i) => i.fieldKey === 'euro_class' && i.type === 'unrecognized_value')).toEqual([]);
  });

  it('maps Google max_vehicle_mass_kg through normalization to goods_vehicle_over_3_5_tons true when at/above threshold', () => {
    const { fields } = normalizeProviderOutput({
      entities: [
        {
          type: 'max_vehicle_mass_kg',
          normalizedValue: '4200',
          mentionText: '4200',
          confidence: 0.97,
          pageNumber: 1,
        },
      ],
    });

    const normalized = applyNormalizations(fields);
    const prefill = buildTransportV2VehiclePrefill({ documentId: 99, reviewFields: normalized });

    expect(prefill.fields.goods_vehicle_over_3_5_tons).toBe(true);
    expect(prefill.field_sources.goods_vehicle_over_3_5_tons).toMatchObject({
      source: 'ocr_derived',
      document_id: 99,
      confidence: 0.97,
    });
  });
});
