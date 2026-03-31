const {
  applyNormalizations,
  validateNormalizedOutput,
} = require('../../services/ocr/ocrOutputValidator');

describe('ocrOutputValidator', () => {
  it('normalizes euro and fuel values to Block 2 canonical enums', () => {
    const fields = applyNormalizations([
      {
        key: 'euro_class',
        label: 'Classe Euro',
        value: 'Euro 6',
        confidence: 0.99,
      },
      {
        key: 'fuel_type',
        label: 'Tipo carburante',
        value: 'Diesel',
        confidence: 0.99,
      },
      {
        key: 'fuel_type',
        label: 'Tipo carburante',
        value: 'GPL',
        confidence: 0.99,
      },
      {
        key: 'fuel_type',
        label: 'Tipo carburante',
        value: 'Metano',
        confidence: 0.99,
      },
    ]);

    expect(fields[0].normalizedValue).toBe('EURO_6');
    expect(fields[1].normalizedValue).toBe('diesel');
    expect(fields[2].normalizedValue).toBe('gpl');
    expect(fields[3].normalizedValue).toBe('metano');
  });

  it('maps Italian circulation fuel abbreviation BENZ to benzina', () => {
    const fields = applyNormalizations([
      {
        key: 'fuel_type',
        label: 'Tipo carburante',
        value: 'BENZ',
        confidence: 1,
      },
    ]);

    expect(fields[0].normalizedValue).toBe('benzina');
    expect(fields[0].warnings).toEqual([]);
    expect(validateNormalizedOutput(fields)).toEqual([]);
  });

  it('normalizes max_vehicle_mass_kg to a positive integer', () => {
    const fields = applyNormalizations([
      {
        key: 'max_vehicle_mass_kg',
        label: 'Massa massima veicolo (kg)',
        value: '1.500 kg',
        confidence: 0.99,
      },
    ]);

    expect(fields[0].normalizedValue).toBe(1500);
    expect(validateNormalizedOutput(fields)).toEqual([]);
  });

  it('normalizes wltp_co2_g_km from strings with units or decimals to a non-negative integer', () => {
    const samples = applyNormalizations([
      {
        key: 'wltp_co2_g_km',
        label: 'Emissioni CO2 WLTP (g/km)',
        value: '143 g/km',
        confidence: 0.99,
      },
      {
        key: 'wltp_co2_g_km',
        label: 'Emissioni CO2 WLTP (g/km)',
        value: '  120,4  ',
        confidence: 0.99,
      },
      {
        key: 'wltp_co2_g_km',
        label: 'Emissioni CO2 WLTP (g/km)',
        value: '0 g/km',
        confidence: 0.99,
      },
    ]);

    expect(samples[0].normalizedValue).toBe(143);
    expect(samples[1].normalizedValue).toBe(120);
    expect(samples[2].normalizedValue).toBe(0);
    expect(validateNormalizedOutput(samples)).toEqual([]);
  });

  it('does not treat missing user-only fields as OCR failure', () => {
    const fields = applyNormalizations([
      {
        key: 'registration_year',
        label: 'Anno immatricolazione',
        value: '2020',
        confidence: 0.99,
      },
      {
        key: 'fuel_type',
        label: 'Tipo carburante',
        value: 'Diesel',
        confidence: 0.98,
      },
    ]);

    expect(validateNormalizedOutput(fields)).toEqual([]);
  });

  it('adds low-confidence warnings while keeping fields prefillable', () => {
    const fields = applyNormalizations([
      {
        key: 'euro_class',
        label: 'Classe Euro',
        value: 'Euro 6',
        confidence: 0.5,
      },
    ]);

    expect(fields[0].warnings).toEqual([
      expect.objectContaining({
        code: 'low_confidence',
      }),
    ]);
    expect(validateNormalizedOutput(fields)).toEqual([
      expect.objectContaining({
        fieldKey: 'euro_class',
        type: 'low_confidence',
      }),
    ]);
  });
});
