const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  createCertificationFixture,
  createSurveyResponseFixture,
  createUserFixture,
  getSurveyResponse,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('PUT /api/transport-v2/:certificationId/draft', () => {
  it('saves a partial draft and creates the anchor row if it does not exist', async () => {
    const user = await createUserFixture({ suffix: 'put-partial-user' });
    const certification = await createCertificationFixture({ suffix: 'put-partial-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            uses_navigator: true,
          },
          vehicles: [],
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.meta).not.toHaveProperty('entry_mode');
    expect(response.body.transport_v2.meta.status).toBe('draft');
    expect(response.body.transport_v2.draft.questionnaire_flags).toEqual({
      uses_navigator: true,
    });

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row).not.toBeNull();
    expect(row.survey_data.transport_v2.meta).not.toHaveProperty('entry_mode');
    expect(row.survey_data.transport_v2.draft.questionnaire_flags.uses_navigator).toBe(true);
  });

  it('rejects payloads without draft', async () => {
    const user = await createUserFixture({ suffix: 'put-missing-user' });
    const certification = await createCertificationFixture({ suffix: 'put-missing-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({});

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'draft', code: 'required' }),
      ]),
    );
  });

  it('rejects malformed vehicles containers', async () => {
    const user = await createUserFixture({ suffix: 'put-malformed-user' });
    const certification = await createCertificationFixture({ suffix: 'put-malformed-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {},
          vehicles: {},
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ field: 'draft.vehicles', code: 'invalid_type' }),
      ]),
    );
  });

  it('normalizes missing row containers on save', async () => {
    const user = await createUserFixture({ suffix: 'put-normalize-user' });
    const certification = await createCertificationFixture({ suffix: 'put-normalize-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {},
          vehicles: [
            {
              vehicle_id: 'v1',
            },
          ],
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.draft.vehicles[0]).toEqual({
      vehicle_id: 'v1',
      transport_mode: null,
      ocr_document_id: null,
      fields: {},
      field_sources: {},
      field_warnings: {},
      row_notes: null,
    });
  });

  it('preserves started_at and moves updated_at on later saves', async () => {
    const user = await createUserFixture({ suffix: 'put-timestamps-user' });
    const certification = await createCertificationFixture({ suffix: 'put-timestamps-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const firstResponse = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      });

    await wait(20);

    const secondResponse = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            chatbot_started: true,
          },
          vehicles: [],
        },
      });

    expect(secondResponse.status).toBe(200);
    expect(secondResponse.body.transport_v2.meta.started_at).toBe(
      firstResponse.body.transport_v2.meta.started_at,
    );
    expect(new Date(secondResponse.body.transport_v2.meta.updated_at).getTime()).toBeGreaterThan(
      new Date(firstResponse.body.transport_v2.meta.updated_at).getTime(),
    );
  });

  it('keeps meta.status forced to draft and blocks client-owned derived/results/meta writes', async () => {
    const user = await createUserFixture({ suffix: 'put-owned-user' });
    const certification = await createCertificationFixture({ suffix: 'put-owned-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const rejectedResponse = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        meta: {
          status: 'submitted',
        },
        derived: {
          score: 100,
        },
        results: {
          badge: 'gold',
        },
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      });

    expect(rejectedResponse.status).toBe(400);

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: {
          meta: {
            version: 1,
            certification_id: certification.id,
            status: 'submitted',
            started_at: '2026-03-30T10:00:00.000Z',
            updated_at: '2026-03-30T10:00:00.000Z',
            submitted_at: '2026-03-30T10:01:00.000Z',
          },
          draft: {
            questionnaire_flags: {},
            vehicles: [],
          },
          derived: {
            should_be_reset: true,
          },
          results: {
            should_be_reset: true,
          },
        },
      },
    });

    const validResponse = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            edited: true,
          },
          vehicles: [],
        },
      });

    expect(validResponse.status).toBe(200);
    expect(validResponse.body.transport_v2.meta.status).toBe('draft');
    expect(validResponse.body.transport_v2.derived).toEqual({});
    expect(validResponse.body.transport_v2.results).toEqual({});
  });

  it('preserves unrelated survey_data keys during save', async () => {
    const user = await createUserFixture({ suffix: 'put-preserve-user' });
    const certification = await createCertificationFixture({ suffix: 'put-preserve-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        legacy_key: {
          untouched: true,
        },
      },
    });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      });

    expect(response.status).toBe(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.legacy_key).toEqual({ untouched: true });
    expect(row.survey_data.transport_v2).toEqual(response.body.transport_v2);
  });

  it('rejects entry_mode on draft save', async () => {
    const user = await createUserFixture({ suffix: 'put-entry-user' });
    const certification = await createCertificationFixture({ suffix: 'put-entry-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        entry_mode: 'form',
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      });

    expect(response.status).toBe(400);
    expect(response.body.errors).toEqual(
      expect.arrayContaining([expect.objectContaining({ field: 'entry_mode', code: 'forbidden' })]),
    );
  });

  it('accepts sparse future-facing OCR and form style partial rows', async () => {
    const user = await createUserFixture({ suffix: 'put-future-user' });
    const certification = await createCertificationFixture({ suffix: 'put-future-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            chatbot_partial: true,
          },
          vehicles: [
            {
              vehicle_id: 'ocr-1',
              ocr_document_id: 456,
              fields: {
                registration_year: 2020,
                fuel_type: 'diesel',
              },
              field_sources: {
                registration_year: {
                  source: 'ocr',
                  document_id: 456,
                },
              },
            },
            {
              vehicle_id: 'manual-1',
              transport_mode: 'goods',
              fields: {
                registration_year: 2024,
              },
            },
          ],
        },
      });

    expect(response.status).toBe(200);
    expect(response.body.transport_v2.draft.questionnaire_flags.chatbot_partial).toBe(true);
    expect(response.body.transport_v2.draft.vehicles[0]).toEqual({
      vehicle_id: 'ocr-1',
      transport_mode: null,
      ocr_document_id: 456,
      fields: {
        registration_year: 2020,
        fuel_type: 'diesel',
      },
      field_sources: {
        registration_year: {
          source: 'ocr',
          document_id: 456,
        },
      },
      field_warnings: {},
      row_notes: null,
    });
    expect(response.body.transport_v2.draft.vehicles[1]).toEqual({
      vehicle_id: 'manual-1',
      transport_mode: 'goods',
      ocr_document_id: null,
      fields: {
        registration_year: 2024,
      },
      field_sources: {},
      field_warnings: {},
      row_notes: null,
    });
  });
});
