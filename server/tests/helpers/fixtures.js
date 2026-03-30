const jwt = require('jsonwebtoken');
const { query } = require('./testDb');

const TRANSPORT_CATEGORY = 'Certificazione trasporti';

async function createUserFixture(overrides = {}) {
  const suffix = overrides.suffix || Math.random().toString(36).slice(2, 10);
  const values = {
    username: overrides.username || `User ${suffix}`,
    company_name: overrides.company_name || `Company ${suffix}`,
    email: overrides.email || `user-${suffix}@example.com`,
    administrator: overrides.administrator || false,
    password_digest: overrides.password_digest || null,
    isVerified: overrides.isVerified ?? true,
    first_login: overrides.first_login ?? false,
  };

  const { rows } = await query(
    `INSERT INTO users (username, company_name, email, administrator, password_digest, isVerified, first_login)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [
      values.username,
      values.company_name,
      values.email,
      values.administrator,
      values.password_digest,
      values.isVerified,
      values.first_login,
    ],
  );

  return rows[0];
}

async function createCertificationFixture({ productOwnerId, category = TRANSPORT_CATEGORY, ...overrides } = {}) {
  const ownerId = productOwnerId || (await createUserFixture()).id;
  const suffix = overrides.suffix || Math.random().toString(36).slice(2, 10);

  const { rows } = await query(
    `INSERT INTO products (user_id, name, price, image, info, cod, category, tag, stripe_product_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
     RETURNING *`,
    [
      ownerId,
      overrides.name || `Certification ${suffix}`,
      overrides.price || 1,
      overrides.image || 'test.png',
      overrides.info || 'Test certification',
      overrides.cod || `cod-${suffix}`,
      category,
      overrides.tag || 'test',
      overrides.stripe_product_id || null,
    ],
  );

  return rows[0];
}

async function grantCertificationAccess({ userId, certificationId, quantity = 1, price = 1 }) {
  const { rows } = await query(
    `INSERT INTO orders (quantity, price, user_id, product_id, order_date)
     VALUES ($1, $2, $3, $4, NOW())
     RETURNING *`,
    [quantity, price, userId, certificationId],
  );

  return rows[0];
}

async function createSurveyResponseFixture({
  userId,
  certificationId,
  pageNo = null,
  surveyData = null,
  totalScore = 0,
  co2emissions = 0,
  completed = false,
} = {}) {
  const { rows } = await query(
    `INSERT INTO survey_responses
      (user_id, certification_id, page_no, survey_data, total_score, co2emissions, completed, created_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
     RETURNING *`,
    [userId, certificationId, pageNo, surveyData == null ? null : JSON.stringify(surveyData), totalScore, co2emissions, completed],
  );

  return rows[0];
}

async function getSurveyResponse({ userId, certificationId }) {
  const { rows } = await query(
    `SELECT *
     FROM survey_responses
     WHERE user_id = $1 AND certification_id = $2`,
    [userId, certificationId],
  );

  return rows[0] || null;
}

function getTransportV2FromRow(row) {
  return row?.survey_data?.transport_v2 || null;
}

function authCookieForUser(user, overrides = {}) {
  const token = jwt.sign(
    {
      user_id: user.id,
      role: overrides.role || (user.administrator ? 'administrator' : 'user'),
    },
    process.env.SECRET_KEY,
    { expiresIn: overrides.expiresIn || '1h' },
  );

  return [`accessToken=${token}`];
}

module.exports = {
  TRANSPORT_CATEGORY,
  authCookieForUser,
  createCertificationFixture,
  createSurveyResponseFixture,
  createUserFixture,
  getSurveyResponse,
  getTransportV2FromRow,
  grantCertificationAccess,
};
