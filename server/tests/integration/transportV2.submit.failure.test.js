const request = require('supertest');
const repository = require('../../repositories/surveyResponsesRepository');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  buildCompletePassengerDraft,
  createCertificationFixture,
  createSurveyResponseFixture,
  createUserFixture,
  getSurveyResponse,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Transport V2 submit failure paths', () => {
  it('returns a clean 500 when DB access fails during submit', async () => {
    const user = await createUserFixture({ suffix: 'submit-fail-db-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-fail-db-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    vi.spyOn(repository, 'withLockedSurveyResponse').mockRejectedValueOnce(new Error('db down'));

    const response = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(500);
    expect(response.body.msg).toBe('Errore durante il submit di transport V2.');
  });

  it('leaves the row unchanged after validation failure', async () => {
    const user = await createUserFixture({ suffix: 'submit-fail-validate-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-fail-validate-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const draft = buildCompletePassengerDraft(certification.id, {
      questionnaireFlagOverrides: {
        uses_navigator: null,
      },
    });

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: draft,
      },
      totalScore: 7.7,
      co2emissions: 2.2,
      completed: false,
    });

    const before = await getSurveyResponse({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(400);

    const after = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(after.survey_data.transport_v2).toEqual(before.survey_data.transport_v2);
    expect(Number(after.total_score)).toBe(7.7);
    expect(Number(after.co2emissions)).toBe(2.2);
    expect(after.completed).toBe(false);
  });

  it('rolls back partial state if a simulated mid-submit failure occurs inside the transaction', async () => {
    const user = await createUserFixture({ suffix: 'submit-fail-rollback-user' });
    const certification = await createCertificationFixture({ suffix: 'submit-fail-rollback-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });
    const draft = buildCompletePassengerDraft(certification.id);

    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: certification.id,
      surveyData: {
        transport_v2: draft,
      },
      totalScore: 0,
      co2emissions: 0,
      completed: false,
    });

    const before = await getSurveyResponse({ userId: user.id, certificationId: certification.id });

    vi.spyOn(repository, 'saveTransportV2Submission').mockImplementationOnce(
      async (client, payload) => {
        await client.query(
          'UPDATE survey_responses SET completed = TRUE, total_score = 999 WHERE id = $1',
          [payload.surveyResponseId],
        );
        throw new Error('mid-submit-failure');
      },
    );

    const response = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(500);

    const after = await getSurveyResponse({ userId: user.id, certificationId: certification.id });
    expect(after.completed).toBe(before.completed);
    expect(Number(after.total_score)).toBe(Number(before.total_score));
    expect(after.survey_data.transport_v2).toEqual(before.survey_data.transport_v2);
  });
});
