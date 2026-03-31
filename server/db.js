const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });

const { Pool } = require('pg');
const { instrumentPgPool } = require('./lib/pgPoolInstrument');

const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  user: process.env.DB_USER || 'admin',
  password: process.env.DB_PASSWORD || 'pass123',
  database: process.env.DB_NAME || 'green-visa',
  options: process.env.DB_OPTIONS || undefined,
});

instrumentPgPool(pool);

module.exports = pool;
