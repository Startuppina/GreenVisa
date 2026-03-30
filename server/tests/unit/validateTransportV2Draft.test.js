const { validateTransportV2Block1DraftPayload } = require('../../services/validateTransportv2');

describe('validateTransportV2Block1DraftPayload', () => {
  it('accepts an empty but valid draft container', () => {
    const result = validateTransportV2Block1DraftPayload({
      draft: {
        questionnaire_flags: {},
        vehicles: [],
      },
    });

    expect(result.valid).toBe(true);
    expect(result.normalizedData).toEqual({
      draft: {
        questionnaire_flags: {},
        vehicles: [],
      },
    });
  });

  it('accepts a partial draft payload', () => {
    const result = validateTransportV2Block1DraftPayload({
      entry_mode: 'form',
      draft: {
        questionnaire_flags: {
          uses_navigator: true,
        },
        vehicles: [],
      },
    });

    expect(result.valid).toBe(true);
    expect(result.normalizedData.entry_mode).toBe('form');
    expect(result.normalizedData.draft.questionnaire_flags).toEqual({
      uses_navigator: true,
    });
  });

  it('rejects a payload without draft', () => {
    const result = validateTransportV2Block1DraftPayload({
      entry_mode: 'form',
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'draft', code: 'required' }),
      ]),
    );
  });

  it('rejects an invalid entry_mode', () => {
    const result = validateTransportV2Block1DraftPayload({
      entry_mode: 'voicebot',
      draft: {
        questionnaire_flags: {},
        vehicles: [],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'entry_mode', code: 'invalid_enum' }),
      ]),
    );
  });

  it('rejects non-object questionnaire_flags', () => {
    const result = validateTransportV2Block1DraftPayload({
      draft: {
        questionnaire_flags: [],
        vehicles: [],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'draft.questionnaire_flags', code: 'invalid_type' }),
      ]),
    );
  });

  it('rejects non-array vehicles', () => {
    const result = validateTransportV2Block1DraftPayload({
      draft: {
        questionnaire_flags: {},
        vehicles: {},
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'draft.vehicles', code: 'invalid_type' }),
      ]),
    );
  });

  it('rejects backend-owned fields in client payloads', () => {
    const result = validateTransportV2Block1DraftPayload({
      meta: {
        status: 'submitted',
      },
      derived: {
        something: true,
      },
      results: {
        score: 100,
      },
      draft: {
        questionnaire_flags: {},
        vehicles: [],
      },
    });

    expect(result.valid).toBe(false);
    expect(result.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'meta', code: 'forbidden' }),
        expect.objectContaining({ field: 'derived', code: 'forbidden' }),
        expect.objectContaining({ field: 'results', code: 'forbidden' }),
      ]),
    );
  });
});
