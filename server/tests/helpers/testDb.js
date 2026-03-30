const { Client } = require('pg');

const schemaName = process.env.TEST_DB_SCHEMA || 'gv_transport_v2_test';

let pool;

function getPool() {
  if (!pool || pool.ended || pool._ended) {
    const dbModulePath = require.resolve('../../db');
    delete require.cache[dbModulePath];
    pool = require('../../db');
  }

  return pool;
}

async function setupTestDb() {
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });

  await client.connect();

  try {
    await client.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        company_name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        administrator BOOLEAN DEFAULT FALSE,
        password_digest TEXT,
        isVerified BOOLEAN DEFAULT FALSE,
        first_login BOOLEAN DEFAULT TRUE
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".products (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        price DECIMAL(10, 2) NOT NULL,
        image VARCHAR(255) NOT NULL,
        info TEXT NOT NULL,
        cod VARCHAR(255) NOT NULL UNIQUE,
        category TEXT NOT NULL,
        tag VARCHAR(255) NOT NULL,
        stripe_product_id VARCHAR(255)
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".orders (
        id SERIAL PRIMARY KEY,
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price DECIMAL(10, 2) NOT NULL,
        user_id INTEGER NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
        product_id INTEGER REFERENCES "${schemaName}".products(id) ON DELETE CASCADE,
        code_id INTEGER DEFAULT NULL,
        order_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      CREATE TABLE IF NOT EXISTS "${schemaName}".survey_responses (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES "${schemaName}".users(id) ON DELETE CASCADE,
        certification_id INTEGER NOT NULL REFERENCES "${schemaName}".products(id) ON DELETE CASCADE,
        page_no INTEGER,
        survey_data JSONB,
        total_score DECIMAL(10, 2) DEFAULT 0.0,
        co2emissions DECIMAL(10, 2) DEFAULT 0.0,
        completed BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        CONSTRAINT unique_user_survey UNIQUE (user_id, certification_id)
      );
    `);
  } finally {
    await client.end();
  }
}

async function resetTestDb() {
  await getPool().query('TRUNCATE TABLE survey_responses, orders, products, users RESTART IDENTITY CASCADE');
}

async function teardownTestDb() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

async function query(text, params) {
  return getPool().query(text, params);
}

function getSchemaName() {
  return schemaName;
}

module.exports = {
  getPool,
  getSchemaName,
  query,
  resetTestDb,
  setupTestDb,
  teardownTestDb,
};
