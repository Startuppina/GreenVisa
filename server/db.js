const { Pool } = require('pg');
const pool = new Pool({
  host: 'db',
  port: '5432',
  user: 'admin',
  password: 'pass123',
  database: 'green-visa'
});

module.exports = pool;