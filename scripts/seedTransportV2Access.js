#!/usr/bin/env node

/**
 * Root-level dev seed for GreenVisa Transport V2 access.
 *
 * Intended location in repo:
 *   /scripts/seedTransportV2Access.js
 *
 * What it does:
 * - loads DB config from ./server/.env
 * - finds a target user (prefer explicit email, else verified admin, else verified user)
 * - creates or reuses a transport certification product
 * - creates or reuses an order linking that user to that product
 * - creates or reuses the matching survey_responses row
 *
 * Safety:
 * - only runs when TRANSPORT_V2_DEV_SEED=1
 */

const path = require('path');
const fs = require('fs');
const { createRequire } = require('module');

// Resolve pg/dotenv from server/ (root-level scripts do not use repo-root node_modules).
const serverRoot = path.resolve(__dirname, '../server');
const serverRequire = createRequire(path.join(serverRoot, 'package.json'));
const { Pool } = serverRequire('pg');

// Load env from server/.env if dotenv is available.
try {
  const dotenv = serverRequire('dotenv');
  const envPath = path.resolve(__dirname, '../server/.env');
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath });
  }
} catch (err) {
  // dotenv is optional; env vars may already be present.
}

if (process.env.TRANSPORT_V2_DEV_SEED !== '1') {
  console.error('Refusing to run. Set TRANSPORT_V2_DEV_SEED=1 to enable this dev seed.');
  process.exit(1);
}

const TRANSPORT_CATEGORY = process.env.TRANSPORT_V2_PRODUCT_CATEGORY || 'Certificazione trasporti';
const PRODUCT_CODE = process.env.TRANSPORT_V2_PRODUCT_CODE || 'DEV-TRANSPORT-V2';
const PRODUCT_NAME = process.env.TRANSPORT_V2_PRODUCT_NAME || 'DEV - Certificazione trasporti';
const PRODUCT_PRICE = Number(process.env.TRANSPORT_V2_PRODUCT_PRICE || '0');
const PRODUCT_TAG = process.env.TRANSPORT_V2_PRODUCT_TAG || 'dev';
const PRODUCT_IMAGE = process.env.TRANSPORT_V2_PRODUCT_IMAGE || '/uploaded_img/dev-transport-v2.png';
const PRODUCT_INFO = process.env.TRANSPORT_V2_PRODUCT_INFO || 'Prodotto seed di sviluppo per accesso rapido a Transport V2';

const TARGET_EMAIL = process.env.TRANSPORT_V2_USER_EMAIL || process.env.TRANSPORT_V2_DEV_EMAIL || '';
const TARGET_USER_ID = process.env.TRANSPORT_V2_USER_ID ? Number(process.env.TRANSPORT_V2_USER_ID) : null;
const FORCE_SURVEY_ROW = process.env.TRANSPORT_V2_CREATE_SURVEY_ROW !== '0';

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 5432),
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'pass123',
  database: process.env.DB_NAME || 'green-visa',
});

async function getTargetUser(client) {
  if (TARGET_USER_ID) {
    const res = await client.query(
      `SELECT id, username, email, administrator, isverified
       FROM users
       WHERE id = $1
       LIMIT 1`,
      [TARGET_USER_ID],
    );
    if (!res.rows.length) {
      throw new Error(`No user found with id=${TARGET_USER_ID}`);
    }
    return res.rows[0];
  }

  if (TARGET_EMAIL) {
    const res = await client.query(
      `SELECT id, username, email, administrator, isverified
       FROM users
       WHERE LOWER(email) = LOWER($1)
       LIMIT 1`,
      [TARGET_EMAIL],
    );
    if (!res.rows.length) {
      throw new Error(`No user found with email=${TARGET_EMAIL}`);
    }
    return res.rows[0];
  }

  // Prefer a verified admin for convenience.
  let res = await client.query(
    `SELECT id, username, email, administrator, isverified
     FROM users
     WHERE administrator = TRUE AND isverified = TRUE
     ORDER BY id ASC
     LIMIT 1`
  );
  if (res.rows.length) return res.rows[0];

  // Fallback: any verified user.
  res = await client.query(
    `SELECT id, username, email, administrator, isverified
     FROM users
     WHERE isverified = TRUE
     ORDER BY administrator DESC, id ASC
     LIMIT 1`
  );
  if (res.rows.length) return res.rows[0];

  throw new Error(
    'No verified user found. Create or verify a user first, or pass TRANSPORT_V2_USER_EMAIL / TRANSPORT_V2_USER_ID.'
  );
}

async function ensureUserIsVerified(client, user) {
  if (user.isverified === true) return user;

  if (process.env.TRANSPORT_V2_FORCE_VERIFY_USER === '1') {
    const res = await client.query(
      `UPDATE users
       SET isverified = TRUE
       WHERE id = $1
       RETURNING id, username, email, administrator, isverified`,
      [user.id],
    );
    return res.rows[0];
  }

  throw new Error(
    `User ${user.email} is not verified. Set TRANSPORT_V2_FORCE_VERIFY_USER=1 to force-verify in dev, or use a verified user.`
  );
}

async function ensureTransportProduct(client, ownerUserId) {
  let res = await client.query(
    `SELECT id, user_id, name, price, cod, category, tag
     FROM products
     WHERE cod = $1
     LIMIT 1`,
    [PRODUCT_CODE],
  );

  if (res.rows.length) {
    return { product: res.rows[0], created: false };
  }

  res = await client.query(
    `INSERT INTO products (
       user_id,
       name,
       price,
       image,
       info,
       cod,
       category,
       tag,
       stripe_product_id
     )
     VALUES ($1, $2, $3, $4, $5, $6, $7::category_type, $8, NULL)
     RETURNING id, user_id, name, price, cod, category, tag`,
    [
      ownerUserId,
      PRODUCT_NAME,
      PRODUCT_PRICE,
      PRODUCT_IMAGE,
      PRODUCT_INFO,
      PRODUCT_CODE,
      TRANSPORT_CATEGORY,
      PRODUCT_TAG,
    ],
  );

  return { product: res.rows[0], created: true };
}

async function ensureOrder(client, userId, productId, price) {
  let res = await client.query(
    `SELECT id, quantity, price, user_id, product_id, order_date
     FROM orders
     WHERE user_id = $1 AND product_id = $2
     ORDER BY id ASC
     LIMIT 1`,
    [userId, productId],
  );

  if (res.rows.length) {
    return { order: res.rows[0], created: false };
  }

  res = await client.query(
    `INSERT INTO orders (
       quantity,
       price,
       user_id,
       product_id,
       code_id
     )
     VALUES (1, $1, $2, $3, NULL)
     RETURNING id, quantity, price, user_id, product_id, order_date`,
    [price, userId, productId],
  );

  return { order: res.rows[0], created: true };
}

async function ensureSurveyResponse(client, userId, certificationId) {
  let res = await client.query(
    `SELECT id, user_id, certification_id, completed, created_at
     FROM survey_responses
     WHERE user_id = $1 AND certification_id = $2
     LIMIT 1`,
    [userId, certificationId],
  );

  if (res.rows.length) {
    return { surveyResponse: res.rows[0], created: false };
  }

  res = await client.query(
    `INSERT INTO survey_responses (
       user_id,
       certification_id,
       survey_data,
       completed
     )
     VALUES ($1, $2, '{}'::jsonb, FALSE)
     RETURNING id, user_id, certification_id, completed, created_at`,
    [userId, certificationId],
  );

  return { surveyResponse: res.rows[0], created: true };
}

async function main() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    let user = await getTargetUser(client);
    user = await ensureUserIsVerified(client, user);

    const { product, created: productCreated } = await ensureTransportProduct(client, user.id);
    const { order, created: orderCreated } = await ensureOrder(client, user.id, product.id, product.price);

    let surveyInfo = null;
    if (FORCE_SURVEY_ROW) {
      surveyInfo = await ensureSurveyResponse(client, user.id, product.id);
    }

    await client.query('COMMIT');

    const result = {
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        administrator: user.administrator,
        isverified: user.isverified,
      },
      product: {
        id: product.id,
        cod: product.cod,
        name: product.name,
        category: product.category,
        created: productCreated,
      },
      order: {
        id: order.id,
        created: orderCreated,
      },
      survey_response: surveyInfo
        ? {
            id: surveyInfo.surveyResponse.id,
            created: surveyInfo.created,
          }
        : null,
      certification_id: product.id,
      transport_v2_url: `http://localhost:5173/transport-v2/${product.id}`,
      login_url: 'http://localhost:5173/Login',
    };

    console.log('\nTransport V2 dev access ready:\n');
    console.log(JSON.stringify(result, null, 2));
    console.log('\nUse the logged-in user above, then open:');
    console.log(result.transport_v2_url);
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('\nSeed failed:\n');
    console.error(err);
    process.exitCode = 1;
  } finally {
    client.release();
    await pool.end();
  }
}

main();