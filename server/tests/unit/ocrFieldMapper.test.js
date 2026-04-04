const {
  normalizeProviderOutput,
  deriveTransportModeFromVehicleUseText,
} = require('../../services/ocr/fieldMapper');
const {
  applyNormalizations,
  validateNormalizedOutput,
  injectDerivedGoodsVehicleReviewField,
} = require('../../services/ocr/ocrOutputValidator');
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
      'co2_emissions_g_km',
      'vehicle_use_text',
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
    expect(result.fields.some((field) => field.key === 'goodsVehicleOver3_5Tons')).toBe(false);
  });

  it('ignores unmapped Document AI entities such as emission_regulation_text', () => {
    const { fields } = normalizeProviderOutput({
      entities: [
        {
          type: 'emission_regulation_text',
          normalizedValue: '195/2013',
          mentionText: '195/2013',
          confidence: 0.77,
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
          type: 'euro_class',
          normalizedValue: 'EURO6B',
          mentionText: 'EURO6B',
          confidence: 0.98,
          pageNumber: 1,
        },
      ],
    });

    expect(fields.some((f) => f.key === 'emission_regulation_text')).toBe(false);
    expect(fields.map((f) => f.key)).toEqual([
      'registration_year',
      'euro_class',
      'fuel_type',
      'max_vehicle_mass_kg',
      'co2_emissions_g_km',
      'vehicle_use_text',
    ]);

    const normalized = applyNormalizations(fields);
    const prefill = buildTransportV2VehiclePrefill({ documentId: 42, reviewFields: normalized });
    expect(prefill.fields.fuel_type).toBe('diesel');
    expect(prefill.fields.euro_class).toBe('EURO_6b');
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

    const normalized = injectDerivedGoodsVehicleReviewField(applyNormalizations(fields));
    const prefill = buildTransportV2VehiclePrefill({ documentId: 1, reviewFields: normalized });

    expect(normalized.some((f) => f.key === 'goods_vehicle_over_3_5_tons')).toBe(true);
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

    const normalized = injectDerivedGoodsVehicleReviewField(applyNormalizations(fields));
    const prefill = buildTransportV2VehiclePrefill({ documentId: 99, reviewFields: normalized });

    expect(normalized.some((f) => f.key === 'goods_vehicle_over_3_5_tons')).toBe(true);
    expect(prefill.fields.goods_vehicle_over_3_5_tons).toBe(true);
    expect(prefill.field_sources.goods_vehicle_over_3_5_tons).toMatchObject({
      source: 'ocr_derived',
      document_id: 99,
      confidence: 0.97,
    });
  });

  it('maps Google vehicle_use_text entity into OCR review and prefill transport_mode (Persone -> passenger)', () => {
    const { fields } = normalizeProviderOutput({
      entities: [
        {
          type: 'vehicle_use_text',
          normalizedValue: 'AUTOVETTURA PER TRASPORTO DI PERSONE USO PROPRIO',
          mentionText: 'AUTOVETTURA PER TRASPORTO DI PERSONE USO PROPRIO',
          confidence: 0.95,
          pageNumber: 1,
        },
      ],
    });

    const normalized = applyNormalizations(fields);
    const prefill = buildTransportV2VehiclePrefill({ documentId: 7, reviewFields: normalized });

    expect(fields.find((f) => f.key === 'vehicle_use_text')).toEqual(
      expect.objectContaining({
        key: 'vehicle_use_text',
        value: 'AUTOVETTURA PER TRASPORTO DI PERSONE USO PROPRIO',
        sourceMethod: 'EXTRACT',
      }),
    );
    expect(prefill.transport_mode).toBe('passenger');
    expect(prefill.fields).not.toHaveProperty('vehicle_use_text');
  });

  it('maps Google vehicle_use_text to transport_mode goods when text contains Cose', () => {
    const { fields } = normalizeProviderOutput({
      entities: [
        {
          type: 'vehicle_use_text',
          normalizedValue: '',
          mentionText: 'AUTOCARRO PER TRASPORTO DI COSE - USO PROPRIO',
          confidence: 0.93,
          pageNumber: 1,
        },
      ],
    });

    const normalized = applyNormalizations(fields);
    const prefill = buildTransportV2VehiclePrefill({ documentId: 8, reviewFields: normalized });

    expect(prefill.transport_mode).toBe('goods');
  });

  it('maps Google co2_emissions_g_km through normalization into prefill fields.co2_emissions_g_km', () => {
    const { fields } = normalizeProviderOutput({
      entities: [
        {
          type: 'co2_emissions_g_km',
          normalizedValue: '143 g/km',
          mentionText: '143 g/km',
          confidence: 0.97,
          pageNumber: 1,
        },
      ],
    });

    const normalized = applyNormalizations(fields);
    const prefill = buildTransportV2VehiclePrefill({ documentId: 55, reviewFields: normalized });

    expect(prefill.fields.co2_emissions_g_km).toBe(143);
    expect(prefill.field_sources.co2_emissions_g_km).toMatchObject({
      source: 'ocr',
      document_id: 55,
      confidence: 0.97,
    });
    expect(validateNormalizedOutput(normalized).filter((i) => i.fieldKey === 'co2_emissions_g_km')).toEqual([]);
  });

  it('maps numeric co2_emissions_g_km provider value into prefill', () => {
    const { fields } = normalizeProviderOutput({
      entities: [
        {
          type: 'co2_emissions_g_km',
          normalizedValue: 128,
          mentionText: '128',
          confidence: 0.99,
          pageNumber: 2,
        },
      ],
    });

    const normalized = applyNormalizations(fields);
    const prefill = buildTransportV2VehiclePrefill({ documentId: 3, reviewFields: normalized });

    expect(prefill.fields.co2_emissions_g_km).toBe(128);
  });

  it('deriveTransportModeFromVehicleUseText is case-insensitive and returns null when keywords are absent', () => {
    expect(deriveTransportModeFromVehicleUseText('trasporto di persone')).toBe('passenger');
    expect(deriveTransportModeFromVehicleUseText('TRASPORTO DI COSE')).toBe('goods');
    expect(deriveTransportModeFromVehicleUseText('USO PROPRIO')).toBe(null);
    expect(deriveTransportModeFromVehicleUseText(null)).toBe(null);
  });

  it('does not change euro_class, fuel_type, or mass-derived mappings when vehicle_use_text is present', () => {
    const { fields } = normalizeProviderOutput({
      entities: [
        {
          type: 'registration_year',
          normalizedValue: '2019',
          mentionText: '2019',
          confidence: 0.99,
          pageNumber: 1,
        },
        {
          type: 'euro_class',
          normalizedValue: 'Euro 5',
          mentionText: 'Euro 5',
          confidence: 0.9,
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
          type: 'max_vehicle_mass_kg',
          normalizedValue: '2000',
          mentionText: '2000',
          confidence: 0.91,
          pageNumber: 1,
        },
        {
          type: 'vehicle_use_text',
          normalizedValue: 'AUTOVETTURA PER TRASPORTO DI PERSONE USO PROPRIO',
          mentionText: 'AUTOVETTURA PER TRASPORTO DI PERSONE USO PROPRIO',
          confidence: 0.88,
          pageNumber: 1,
        },
      ],
    });

    const normalized = injectDerivedGoodsVehicleReviewField(applyNormalizations(fields));
    const prefill = buildTransportV2VehiclePrefill({ documentId: 10, reviewFields: normalized });

    expect(prefill.fields.registration_year).toBe(2019);
    expect(prefill.fields.euro_class).toBe('EURO_5');
    expect(prefill.fields.fuel_type).toBe('diesel');
    expect(prefill.fields.goods_vehicle_over_3_5_tons).toBe(false);
    expect(normalized.some((f) => f.key === 'goods_vehicle_over_3_5_tons')).toBe(true);
    expect(prefill.transport_mode).toBe('passenger');
  });
});
