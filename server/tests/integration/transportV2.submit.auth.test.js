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

describe('Transport V2 submit auth and authorization', () => {
  it('rejects unauthenticated submit requests', async () => {
    const response = await request(app).post('/api/transport-v2/123/submit');

    expect(response.status).toBe(401);
  });

  it('prevents one user from submitting another user certification', async () => {
    const userA = await createUserFixture({ suffix: 'submit-auth-a' });
    const userB = await createUserFixture({ suffix: 'submit-auth-b' });
    const certification = await createCertificationFixture({ suffix: 'submit-auth-cert-a' });

    await grantCertificationAccess({ userId: userB.id, certificationId: certification.id });

    const response = await request(app)
      .post(`/api/transport-v2/${certification.id}/submit`)
      .set('Cookie', authCookieForUser(userA));

    expect(response.status).toBe(403);
  });

  it('does not allow route parameter tampering to bypass ownership checks on submit', async () => {
    const userA = await createUserFixture({ suffix: 'submit-tamper-a' });
    const userB = await createUserFixture({ suffix: 'submit-tamper-b' });
    const certA = await createCertificationFixture({ suffix: 'submit-tamper-cert-a' });
    const certB = await createCertificationFixture({ suffix: 'submit-tamper-cert-b' });

    await grantCertificationAccess({ userId: userA.id, certificationId: certA.id });
    await grantCertificationAccess({ userId: userB.id, certificationId: certB.id });

    const response = await request(app)
      .post(`/api/transport-v2/${certB.id}/submit`)
      .set('Cookie', authCookieForUser(userA));

    expect(response.status).toBe(403);
  });
});
