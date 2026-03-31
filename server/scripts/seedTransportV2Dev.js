/**
 * DEVELOPMENT ONLY — manual seed for Transport V2 local E2E.
 *
 * Run from the server directory:
 *   TRANSPORT_V2_DEV_SEED=1 node scripts/seedTransportV2Dev.js
 *
 * Creates (if missing): a verified test user, a "Certificazione trasporti" product, and an
 * orders row so getTransportCertificationAccess grants has_access (see surveyResponsesRepository).
 *
 * Does not start the HTTP server and does not modify application runtime behavior.
 */

const path = require('path');
const bcrypt = require('bcryptjs');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const pool = require('../db');

const TRANSPORT_CATEGORY = 'Certificazione trasporti';

async function main() {
  if (process.env.TRANSPORT_V2_DEV_SEED !== '1') {
    console.error(
      'Refusing to run: set TRANSPORT_V2_DEV_SEED=1 to confirm (development database seed only).',
    );
    process.exit(1);
  }

  const email = process.env.TRANSPORT_V2_DEV_EMAIL || 'transport-v2-dev@example.local';
  const password = process.env.TRANSPORT_V2_DEV_PASSWORD || 'DevPassword123!';
  const clientBase =
    process.env.TRANSPORT_V2_DEV_CLIENT_ORIGIN || 'http://localhost:5173';

  const passwordDigest = await bcrypt.hash(password, 10);

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    let devUser;
    const existingUser = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      devUser = existingUser.rows[0];
      await client.query(
        `UPDATE users
         SET password_digest = $1, isverified = true, first_login = false
         WHERE id = $2`,
        [passwordDigest, devUser.id],
      );
      devUser = { ...devUser, password_digest: passwordDigest, isverified: true, first_login: false };
      console.log(`Using existing user id=${devUser.id} (${email}), password reset for dev seed.`);
    } else {
      const ins = await client.query(
        `INSERT INTO users (
           username, company_name, email, administrator, password_digest, isverified, first_login
         ) VALUES ($1, $2, $3, false, $4, true, false)
         RETURNING *`,
        ['Transport V2 Dev', 'Dev Company', email, passwordDigest],
      );
      devUser = ins.rows[0];
      console.log(`Created dev user id=${devUser.id} (${email}).`);
    }

    const adminRes = await client.query(
      'SELECT id FROM users WHERE administrator = true ORDER BY id ASC LIMIT 1',
    );
    const productOwnerId = adminRes.rows[0]?.id || devUser.id;

    let productRow = await client.query(
      `SELECT id FROM products WHERE category = $1 ORDER BY id ASC LIMIT 1`,
      [TRANSPORT_CATEGORY],
    );

    let productId;
    if (productRow.rows.length === 0) {
      const suffix = `dev-${Date.now()}`;
      const insP = await client.query(
        `INSERT INTO products (
           user_id, name, price, image, info, cod, category, tag, stripe_product_id
         ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         RETURNING id`,
        [
          productOwnerId,
          'Certificazione trasporti (dev seed)',
          1,
          'dev-transport.png',
          'Prodotto creato da seedTransportV2Dev.js',
          `cod-transport-${suffix}`,
          TRANSPORT_CATEGORY,
          'dev',
          null,
        ],
      );
      productId = insP.rows[0].id;
      console.log(`Created transport product id=${productId} (owner user_id=${productOwnerId}).`);
    } else {
      productId = productRow.rows[0].id;
      console.log(`Using existing transport product id=${productId}.`);
    }

    const orderExists = await client.query(
      'SELECT id FROM orders WHERE user_id = $1 AND product_id = $2 LIMIT 1',
      [devUser.id, productId],
    );

    let orderId;
    if (orderExists.rows.length === 0) {
      const insO = await client.query(
        `INSERT INTO orders (quantity, price, user_id, product_id, order_date)
         VALUES (1, 1, $1, $2, NOW())
         RETURNING id`,
        [devUser.id, productId],
      );
      orderId = insO.rows[0].id;
      console.log(`Created order id=${orderId} linking user ${devUser.id} to product ${productId}.`);
    } else {
      orderId = orderExists.rows[0].id;
      console.log(`Order already exists id=${orderId} for this user and product.`);
    }

    await client.query('COMMIT');

    console.log('\n--- Transport V2 dev seed summary ---');
    console.log(`Login:     ${clientBase}/Login`);
    console.log(`Email:     ${email}`);
    console.log(`Password:  ${password}`);
    console.log(`certification_id (products.id): ${productId}`);
    console.log(`Open:      ${clientBase}/transport-v2/${productId}`);
    console.log(
      'survey_responses is created on first GET /api/transport-v2/:id (lazy upsert in withLockedSurveyResponse).',
    );
    console.log('--------------------------------------\n');
  } catch (e) {
    await client.query('ROLLBACK');
    console.error(e);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

main();
