const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  buildCompleteGoodsDraft,
  buildCompleteMixedDraft,
  buildCompletePassengerDraft,
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

describe('Transport V2 submit persistence', () => {
  it('persists results and derived under the correct JSON paths', async () => {
    const user = await createUserFixture({ suffix: 'submit-persist-path-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-persist-path-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: buildCompletePassengerDraft(certification.id),
      },
    });

    await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user))
      .expect(200);

    const { rows } = await query(
      `SELECT
          survey_data -> 'transport_v2' -> 'results' AS results,
          survey_data -> 'transport_v2' -> 'derived' AS derived
       FROM survey_responses
       WHERE user_id = $1 AND certification_id = $2`,
      [user.id, certification.id],
    );

    expect(rows[0].results).toBeTruthy();
    expect(rows[0].derived).toBeTruthy();
  });

  it('updates meta timestamps and legacy summary columns on successful submit', async () => {
    const user = await createUserFixture({ suffix: 'submit-persist-summary-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-persist-summary-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const draft = buildCompleteGoodsDraft(certification.id);

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        legacy_key: { preserved: true },
        transport_v2: draft,
      },
      totalScore: 99,
      co2emissions: 99,
      completed: false,
    });

    const response = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user))
      .expect(200);

    const row = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(row.survey_data.legacy_key).toEqual({ preserved: true });
    expect(row.survey_data.transport_v2.meta.status).toBe('submitted');
    expect(row.survey_data.transport_v2.meta.submitted_at).toBeTruthy();
    expect(row.survey_data.transport_v2.meta.updated_at).not.toBe(draft.meta.updated_at);
    expect(Number(row.total_score)).toBe(response.body.transport_v2.results.score.total_score);
    expect(Number(row.co2emissions)).toBe(response.body.transport_v2.results.co2.total_tons_per_year);
    expect(row.completed).toBe(true);
  });

  it('updates the existing row instead of creating duplicates', async () => {
    const user = await createUserFixture({ suffix: 'submit-persist-dupe-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-persist-dupe-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: buildCompleteMixedDraft(certification.id),
      },
    });

    await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user))
      .expect(200);

    const { rows } = await query(
      `SELECT COUNT(*)::int AS count
       FROM survey_responses
       WHERE user_id = $1 AND certification_id = $2`,
      [user.id, certification.id],
    );

    expect(rows[0].count).toBe(1);
  });
});
