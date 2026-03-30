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
const { query } = require('../helpers/testDb');

const app = getApp();

registerIntegrationHooks();

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

describe('Transport V2 persistence guarantees', () => {
  it('stores transport_v2 under survey_data.transport_v2', async () => {
    const user = await createUserFixture({ suffix: 'persist-path-user' });
    const certification = await createCertificationFixture({ suffix: 'persist-path-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user))
      .expect(200);

    const { rows } = await query(
      `SELECT survey_data -> 'transport_v2' AS transport_v2
       FROM survey_responses
       WHERE user_id = $1 AND certification_id = $2`,
      [user.id, certification.id],
    );

    expect(rows[0].transport_v2).toBeTruthy();
    expect(rows[0].transport_v2.meta.certification_id).toBe(certification.id);
  });

  it('does not create duplicate survey_responses rows for repeated GET and PUT calls', async () => {
    const user = await createUserFixture({ suffix: 'persist-dupe-user' });
    const certification = await createCertificationFixture({ suffix: 'persist-dupe-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user))
      .expect(200);

    await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            edit: true,
          },
          vehicles: [],
        },
      })
      .expect(200);

    const { rows } = await query(
      `SELECT COUNT(*)::int AS count
       FROM survey_responses
       WHERE user_id = $1 AND certification_id = $2`,
      [user.id, certification.id],
    );

    expect(rows[0].count).toBe(1);
  });

  it('isolates drafts by certification for the same user', async () => {
    const user = await createUserFixture({ suffix: 'persist-cert-user' });
    const certA = await createCertificationFixture({ suffix: 'persist-cert-a' });
    const certB = await createCertificationFixture({ suffix: 'persist-cert-b' });
    await grantCertificationAccess({ userId: user.id, certificationId: certA.id });
    await grantCertificationAccess({ userId: user.id, certificationId: certB.id });

    await request(app)
      .put(`/api/transport-v2/${certA.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            cert_a: true,
          },
          vehicles: [],
        },
      })
      .expect(200);

    await request(app)
      .put(`/api/transport-v2/${certB.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            cert_b: true,
          },
          vehicles: [],
        },
      })
      .expect(200);

    const rowA = await getSurveyResponse({ userId: user.id, certificationId: certA.id });
    const rowB = await getSurveyResponse({ userId: user.id, certificationId: certB.id });

    expect(rowA.survey_data.transport_v2.draft.questionnaire_flags).toEqual({ cert_a: true });
    expect(rowB.survey_data.transport_v2.draft.questionnaire_flags).toEqual({ cert_b: true });
  });

  it('isolates drafts by user', async () => {
    const userA = await createUserFixture({ suffix: 'persist-user-a' });
    const userB = await createUserFixture({ suffix: 'persist-user-b' });
    const certA = await createCertificationFixture({ suffix: 'persist-user-cert-a' });
    const certB = await createCertificationFixture({ suffix: 'persist-user-cert-b' });

    await grantCertificationAccess({ userId: userA.id, certificationId: certA.id });
    await grantCertificationAccess({ userId: userB.id, certificationId: certB.id });

    await request(app)
      .put(`/api/transport-v2/${certA.id}/draft`)
      .set('Cookie', authCookieForUser(userA))
      .send({
        draft: {
          questionnaire_flags: {
            owner: 'userA',
          },
          vehicles: [],
        },
      })
      .expect(200);

    await request(app)
      .put(`/api/transport-v2/${certB.id}/draft`)
      .set('Cookie', authCookieForUser(userB))
      .send({
        draft: {
          questionnaire_flags: {
            owner: 'userB',
          },
          vehicles: [],
        },
      })
      .expect(200);

    const rowA = await getSurveyResponse({ userId: userA.id, certificationId: certA.id });
    const rowB = await getSurveyResponse({ userId: userB.id, certificationId: certB.id });

    expect(rowA.survey_data.transport_v2.draft.questionnaire_flags.owner).toBe('userA');
    expect(rowB.survey_data.transport_v2.draft.questionnaire_flags.owner).toBe('userB');
  });

  it('keeps derived and results empty and does not touch final summary columns', async () => {
    const user = await createUserFixture({ suffix: 'persist-summary-user' });
    const certification = await createCertificationFixture({ suffix: 'persist-summary-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        legacy_key: {
          preserved: true,
        },
      },
      totalScore: 42,
      co2emissions: 12.5,
      completed: false,
    });

    await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      })
      .expect(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2.derived).toEqual({});
    expect(row.survey_data.transport_v2.results).toEqual({});
    expect(Number(row.total_score)).toBe(42);
    expect(Number(row.co2emissions)).toBe(12.5);
    expect(row.completed).toBe(false);
  });

  it('uses simple last-write-wins semantics for sequential overwrites', async () => {
    const user = await createUserFixture({ suffix: 'persist-last-user' });
    const certification = await createCertificationFixture({ suffix: 'persist-last-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            version: 'A',
          },
          vehicles: [],
        },
      })
      .expect(200);

    await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            version: 'B',
          },
          vehicles: [],
        },
      })
      .expect(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2.draft.questionnaire_flags).toEqual({ version: 'B' });
  });

  it('handles near-concurrent writes without corruption and without optimistic locking', async () => {
    const user = await createUserFixture({ suffix: 'persist-concurrent-user' });
    const certification = await createCertificationFixture({ suffix: 'persist-concurrent-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const firstRequest = request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            write: 'first',
          },
          vehicles: [
            {
              vehicle_id: 'first-row',
            },
          ],
        },
      });

    await wait(10);

    const secondRequest = request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {
            write: 'second',
          },
          vehicles: [
            {
              vehicle_id: 'second-row',
            },
          ],
        },
      });

    const [firstResponse, secondResponse] = await Promise.all([firstRequest, secondRequest]);

    expect(firstResponse.status).toBe(200);
    expect(secondResponse.status).toBe(200);
    expect(firstResponse.status).not.toBe(409);
    expect(secondResponse.status).not.toBe(409);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.transport_v2.draft.questionnaire_flags).toEqual({ write: 'second' });
    expect(row.survey_data.transport_v2.draft.vehicles[0]).toEqual({
      vehicle_id: 'second-row',
      transport_mode: null,
      ocr_document_id: null,
      fields: {},
      field_sources: {},
      field_warnings: {},
      row_notes: null,
    });
  });
});
