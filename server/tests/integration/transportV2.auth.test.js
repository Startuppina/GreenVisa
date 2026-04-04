const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  createCertificationFixture,
  createUserFixture,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

describe('Transport V2 auth and authorization', () => {
  it('rejects unauthenticated GET requests', async () => {
    const response = await request(app).get('/api/transport-v2/123');

    expect(response.status).toBe(401);
  });

  it('rejects unauthenticated PUT requests', async () => {
    const response = await request(app)
      .put('/api/transport-v2/123/draft')
      .send({
        draft: {
          questionnaire_flags: {},
          vehicles: [],
        },
      });

    expect(response.status).toBe(401);
  });

  it('prevents one user from reading another user certification draft', async () => {
    const userA = await createUserFixture({ suffix: 'auth-a' });
    const userB = await createUserFixture({ suffix: 'auth-b' });
    const certification = await createCertificationFixture({});

    await grantCertificationAccess({ userId: userB.id, certificationId: certification.id });

    const response = await request(app)
      .get(`/api/transport-v2/${certification.id}`)
      .set('Cookie', authCookieForUser(userA));

    expect(response.status).toBe(403);
  });

  it('prevents one user from saving another user certification draft', async () => {
    const userA = await createUserFixture({ suffix: 'auth-save-a' });
    const userB = await createUserFixture({ suffix: 'auth-save-b' });
    const certification = await createCertificationFixture({});

    await grantCertificationAccess({ userId: userB.id, certificationId: certification.id });

    const response = await request(app)
      .put(`/api/transport-v2/${certification.id}/draft`)
      .set('Cookie', authCookieForUser(userA))
      .send({
        draft: {
          questionnaire_flags: {
            uses_navigator: true,
          },
          vehicles: [],
        },
      });

    expect(response.status).toBe(403);
  });

  it('does not allow route parameter tampering to bypass ownership checks', async () => {
    const userA = await createUserFixture({ suffix: 'tamper-a' });
    const userB = await createUserFixture({ suffix: 'tamper-b' });
    const certA = await createCertificationFixture({ suffix: 'tamper-cert-a' });
    const certB = await createCertificationFixture({ suffix: 'tamper-cert-b' });

    await grantCertificationAccess({ userId: userA.id, certificationId: certA.id });
    await grantCertificationAccess({ userId: userB.id, certificationId: certB.id });

    const response = await request(app)
      .get(`/api/transport-v2/${certB.id}`)
      .set('Cookie', authCookieForUser(userA));

    expect(response.status).toBe(403);
  });
});
