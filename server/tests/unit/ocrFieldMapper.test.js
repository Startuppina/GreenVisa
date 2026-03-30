const { normalizeProviderOutput } = require('../../services/fieldMapper');

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
      'wltp_homologation',
      'vehicle_mass_kg',
    ]);
    expect(result.fields.find((field) => field.key === 'vehicle_mass_kg')).toEqual(
      expect.objectContaining({
        key: 'vehicle_mass_kg',
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

    expect(result.fields.find((field) => field.key === 'vehicle_mass_kg')).toEqual(
      expect.objectContaining({
        value: '4200',
        confidence: 0.88,
      }),
    );
  });
});
