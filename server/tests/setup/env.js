const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '..', '.env') });

process.env.NODE_ENV = 'test';
// Keep test output readable; override with LOG_LEVEL=debug when debugging failing tests.
process.env.LOG_LEVEL = process.env.LOG_LEVEL || 'silent';
process.env.SECRET_KEY = process.env.SECRET_KEY || 'gv-transport-v2-test-secret';
process.env.TEST_DB_SCHEMA = process.env.TEST_DB_SCHEMA || 'gv_transport_v2_test';
process.env.DB_OPTIONS = process.env.DB_OPTIONS || `--search_path=${process.env.TEST_DB_SCHEMA}`;
