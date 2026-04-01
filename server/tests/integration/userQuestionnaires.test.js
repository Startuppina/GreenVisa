const request = require('supertest');
const { getApp } = require('../helpers/app');
const {
  authCookieForUser,
  createCertificationFixture,
  createSurveyResponseFixture,
  createUserFixture,
  grantCertificationAccess,
} = require('../helpers/fixtures');
const { registerIntegrationHooks } = require('../helpers/integrationHooks');

const app = getApp();

registerIntegrationHooks();

describe('GET /api/user-questionnaires', () => {
  it('returns each user’s own survey_responses for the same product, not another user’s row', async () => {
    const product = await createCertificationFixture({ suffix: 'uq-shared-product' });
    const userA = await createUserFixture({ suffix: 'uq-user-a' });
    const userB = await createUserFixture({ suffix: 'uq-user-b' });

    await grantCertificationAccess({ userId: userA.id, certificationId: product.id });
    await grantCertificationAccess({ userId: userB.id, certificationId: product.id });

    await createSurveyResponseFixture({
      userId: userA.id,
      certificationId: product.id,
      totalScore: 111,
      co2emissions: 11,
      completed: true,
    });
    await createSurveyResponseFixture({
      userId: userB.id,
      certificationId: product.id,
      totalScore: 222,
      co2emissions: 22,
      completed: false,
    });

    const resA = await request(app)
      .get('/api/user-questionnaires')
      .set('Cookie', authCookieForUser(userA));

    expect(resA.status).toBe(200);
    const rowA = resA.body.surveyInfo.find((r) => r.product_id === product.id);
    expect(rowA).toBeDefined();
    expect(Number(rowA.total_score)).toBe(111);
    expect(Number(rowA.co2emissions)).toBe(11);
    expect(rowA.completed).toBe(true);

    const resB = await request(app)
      .get('/api/user-questionnaires')
      .set('Cookie', authCookieForUser(userB));

    expect(resB.status).toBe(200);
    const rowB = resB.body.surveyInfo.find((r) => r.product_id === product.id);
    expect(rowB).toBeDefined();
    expect(Number(rowB.total_score)).toBe(222);
    expect(Number(rowB.co2emissions)).toBe(22);
    expect(rowB.completed).toBe(false);
  });

  it('does not attach another user’s survey row when the current user has an order but no survey_responses yet', async () => {
    const product = await createCertificationFixture({ suffix: 'uq-no-sr-product' });
    const userWithOrderOnly = await createUserFixture({ suffix: 'uq-order-only' });
    const userWithSurvey = await createUserFixture({ suffix: 'uq-has-survey' });

    await grantCertificationAccess({ userId: userWithOrderOnly.id, certificationId: product.id });
    await grantCertificationAccess({ userId: userWithSurvey.id, certificationId: product.id });

    await createSurveyResponseFixture({
      userId: userWithSurvey.id,
      certificationId: product.id,
      totalScore: 999,
      co2emissions: 99,
      completed: true,
    });

    const res = await request(app)
      .get('/api/user-questionnaires')
      .set('Cookie', authCookieForUser(userWithOrderOnly));

    expect(res.status).toBe(200);
    const row = res.body.surveyInfo.find((r) => r.product_id === product.id);
    expect(row).toBeDefined();
    expect(row.total_score).toBeNull();
    expect(row.co2emissions).toBeNull();
    expect(row.completed).toBeNull();
  });

  it('lists ordered products with questionnaire fields for the authenticated user (happy path)', async () => {
    const product = await createCertificationFixture({ suffix: 'uq-happy-product' });
    const user = await createUserFixture({ suffix: 'uq-happy-user' });

    await grantCertificationAccess({ userId: user.id, certificationId: product.id });
    await createSurveyResponseFixture({
      userId: user.id,
      certificationId: product.id,
      totalScore: 42,
      co2emissions: 7,
      completed: true,
    });

    const res = await request(app)
      .get('/api/user-questionnaires')
      .set('Cookie', authCookieForUser(user));

    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.surveyInfo)).toBe(true);
    const row = res.body.surveyInfo.find((r) => r.product_id === product.id);
    expect(row).toBeDefined();
    expect(row.product_category).toBe(product.category);
    expect(Number(row.total_score)).toBe(42);
    expect(Number(row.co2emissions)).toBe(7);
    expect(row.completed).toBe(true);
    expect(row.date).toBeTruthy();
  });
});
