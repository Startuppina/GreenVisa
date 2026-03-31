const {
  applyDraftWritePayload,
  createDefaultTransportV2,
  normalizeTransportV2,
} = require('../../services/transportV2Normalizer');

describe('transportV2Normalizer', () => {
  it('normalizes missing optional row containers', () => {
    const base = createDefaultTransportV2({
      certificationId: 123,
      now: '2026-03-30T10:00:00.000Z',
    });

    const result = applyDraftWritePayload(
      base,
      {
        draft: {
          questionnaire_flags: {},
          vehicles: [
            {
              vehicle_id: 'v1',
            },
          ],
        },
      },
      {
        certificationId: 123,
        now: '2026-03-30T10:05:00.000Z',
      },
    );

    expect(result.draft.vehicles[0]).toEqual({
      vehicle_id: 'v1',
      transport_mode: null,
      ocr_document_id: null,
      fields: {},
      field_sources: {},
      field_warnings: {},
      row_notes: null,
    });
  });

  it('preserves partial row data during normalization', () => {
    const base = createDefaultTransportV2({
      certificationId: 123,
      now: '2026-03-30T10:00:00.000Z',
    });

    const result = applyDraftWritePayload(
      base,
      {
        draft: {
          questionnaire_flags: {},
          vehicles: [
            {
              vehicle_id: 'v1',
              transport_mode: 'goods',
              fields: {
                registration_year: 2020,
              },
            },
          ],
        },
      },
      {
        certificationId: 123,
        now: '2026-03-30T10:05:00.000Z',
      },
    );

    expect(result.draft.vehicles[0]).toEqual({
      vehicle_id: 'v1',
      transport_mode: 'goods',
      ocr_document_id: null,
      fields: {
        registration_year: 2020,
      },
      field_sources: {},
      field_warnings: {},
      row_notes: null,
    });
  });

  it('normalizes metadata with backend-owned defaults', () => {
    const result = normalizeTransportV2(
      {
        meta: {
          started_at: '2026-03-30T10:00:00.000Z',
          updated_at: 'invalid',
          submitted_at: 'invalid',
          status: 'submitted',
        },
        draft: {},
      },
      {
        certificationId: 456,
        now: '2026-03-30T10:05:00.000Z',
      },
    );

    expect(result.meta).toEqual({
      version: 1,
      certification_id: 456,
      status: 'draft',
      started_at: '2026-03-30T10:00:00.000Z',
      updated_at: '2026-03-30T10:05:00.000Z',
      submitted_at: null,
    });
    expect(result.draft).toEqual({
      questionnaire_flags: {},
      vehicles: [],
    });
    expect(result.derived).toEqual({});
    expect(result.results).toEqual({});
  });

  it('applies draft writes without entry_mode', () => {
    const existing = normalizeTransportV2(
      {
        meta: {
          certification_id: 789,
          started_at: '2026-03-30T10:00:00.000Z',
          updated_at: '2026-03-30T10:00:00.000Z',
        },
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      },
      {
        certificationId: 789,
        now: '2026-03-30T10:00:00.000Z',
      },
    );

    const result = applyDraftWritePayload(
      existing,
      {
        draft: {
          questionnaire_flags: {
            uses_navigator: true,
          },
          vehicles: [],
        },
      },
      {
        certificationId: 789,
        now: '2026-03-30T10:10:00.000Z',
      },
    );

    expect(result.meta).not.toHaveProperty('entry_mode');
    expect(result.draft.questionnaire_flags.uses_navigator).toBe(true);
  });
});
