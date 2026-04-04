const request = require('supertest');
const { getApp } = require('../helpers/app');
const repository = require('../../repositories/surveyResponsesRepository');
const {
  authCookieForUser,
  createCertificationFixture,
  createUserFixture,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

afterEach(() => {
  vi.restoreAllMocks();
});

describe('Transport V2 failure paths', () => {
  it('returns a clean 500 when DB access fails during GET create-if-missing', async () => {
    const user = await createUserFixture({ suffix: 'fail-get-user' });
    const certification = await createCertificationFixture({ suffix: 'fail-get-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    vi.spyOn(repository, 'withLockedSurveyResponse').mockRejectedValueOnce(new Error('db down'));

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(user));

    expect(response.status).toBe(500);
    expect(response.body.msg).toBe('Errore durante il caricamento del draft transport V2.');
  });

  it('returns a clean 500 when DB access fails during PUT save', async () => {
    const user = await createUserFixture({ suffix: 'fail-put-user' });
    const certification = await createCertificationFixture({ suffix: 'fail-put-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    vi.spyOn(repository, 'withLockedSurveyResponse').mockRejectedValueOnce(new Error('db down'));

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .send({
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      });

    expect(response.status).toBe(500);
    expect(response.body.msg).toBe('Errore durante il salvataggio del draft transport V2.');
  });

  it('returns 500 for syntactically invalid JSON (body-parser; global error handler)', async () => {
    // Invalid JSON never reaches the Transport V2 validator: express/body-parser throws first,
    // and server.js maps unknown errors to 500 with { error: "..." } (not Block 1 field errors).
    const user = await createUserFixture({ suffix: 'fail-json-syntax-user' });
    const certification = await createCertificationFixture({ suffix: 'fail-json-syntax-cert' });
    await grantCertificationAccess({ userId: user.id, certificationId: certification.id });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(user))
      .set('Content-Type', 'application/json')
      .send('{ not valid json }');

    expect(response.status).toBe(500);
    expect(response.body.error).toBe('Qualcosa è andato storto!');
  });
});
