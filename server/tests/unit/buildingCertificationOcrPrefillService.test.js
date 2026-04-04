const { buildBuildingCertificationPrefill } = require('../../services/buildingCertification/buildingCertificationOcrPrefillService');

function field(key, normalizedValue, extra = {}) {
  return {
    key,
    label: key,
    value: String(normalizedValue),
    normalizedValue,
    confidence: 0.95,
    required: false,
    sourceMethod: 'EXTRACT',
    sourcePage: 1,
    boundingPoly: null,
    ...extra,
  };
}

describe('buildingCertificationOcrPrefillService', () => {
  it('excludes suspicious LPG from review prefill (confirmPass false)', () => {
    const prefill = buildBuildingCertificationPrefill({
      documentId: 1,
      reviewFields: [field('consumption_lpg', 1200, { suspiciousLpg: true })],
      confirmPass: false,
    });
    expect(prefill.consumptions.some((c) => c.energySource === 'GPL')).toBe(false);
  });

  it('includes LPG after confirm pass even when suspiciousLpg flag remains', () => {
    const prefill = buildBuildingCertificationPrefill({
      documentId: 1,
      reviewFields: [field('consumption_lpg', 1200, { suspiciousLpg: true })],
      confirmPass: true,
    });
    const gpl = prefill.consumptions.find((c) => c.energySource === 'GPL');
    expect(gpl).toBeDefined();
    expect(gpl.plantId).toBe(null);
    expect(gpl.consumption).toBe(1200);
  });

  it('drops LPG when user clears value on confirm', () => {
    const prefill = buildBuildingCertificationPrefill({
      documentId: 1,
      reviewFields: [
        {
          key: 'consumption_lpg',
          label: 'GPL',
          value: null,
          normalizedValue: null,
          confidence: 0,
          required: false,
          sourceMethod: 'NOT_FOUND',
          sourcePage: null,
          boundingPoly: null,
        },
      ],
      confirmPass: true,
    });
    expect(prefill.consumptions.filter((c) => c.energySource === 'GPL')).toHaveLength(0);
  });

  it('maps building location and details without OCR metadata', () => {
    const prefill = buildBuildingCertificationPrefill({
      documentId: 2,
      reviewFields: [
        field('region', 'Lazio'),
        field('municipality', 'Roma'),
        field('street', 'Via Test'),
        field('street_number', '10'),
        field('climate_zone', 'D'),
        field('construction_year', 2001),
        field('use_type', 'Uffici'),
      ],
      confirmPass: true,
    });
    expect(prefill.building.location.region).toBe('Lazio');
    expect(prefill.building.location.climateZone).toBe('D');
    expect(prefill.building.details.constructionYear).toBe(2001);
    expect(prefill.building.details.useType).toBe('Uffici');
    expect(prefill).not.toHaveProperty('confidence');
  });
});
