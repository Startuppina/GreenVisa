const { resolveBuildingCertificationPrefillForApply } = require('../../services/buildingCertification/apeApplyPrefillResolve');

describe('resolveBuildingCertificationPrefillForApply', () => {
  it('prefers confirmed_output over normalized_output', () => {
    const prefill = resolveBuildingCertificationPrefillForApply('confirmed', {
      confirmed_output: { building_certification_prefill: { consumptions: [{ energySource: 'GPL', consumption: 1, plantId: null }] } },
      normalized_output: { building_certification_prefill: { consumptions: [{ energySource: 'GPL', consumption: 99, plantId: null }] } },
    });
    expect(prefill.consumptions[0].consumption).toBe(1);
  });

  it('uses normalized_output for needs_review without confirmed_output', () => {
    const prefill = resolveBuildingCertificationPrefillForApply('needs_review', {
      normalized_output: { building_certification_prefill: { consumptions: [] } },
    });
    expect(prefill).toEqual({ consumptions: [] });
  });

  it('does not fall back to normalized when confirmed_output exists (confirmed)', () => {
    const prefill = resolveBuildingCertificationPrefillForApply('confirmed', {
      confirmed_output: { building_certification_prefill: { consumptions: [] } },
      normalized_output: { building_certification_prefill: { consumptions: [{ energySource: 'GPL', consumption: 5, plantId: null }] } },
    });
    expect(prefill.consumptions).toHaveLength(0);
  });
});
