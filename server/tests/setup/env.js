// Test environment bootstrap.
// Loaded by vitest via setupFiles in vitest.config.js.
// Sets the minimum env vars needed for config modules to load without errors.

import { vi } from 'vitest';

globalThis.__GVITEST_VI__ = vi;

process.env.NODE_ENV = 'test';
process.env.GOOGLE_CLOUD_PROJECT_ID = 'test-project';
process.env.GOOGLE_DOCUMENT_AI_LOCATION = 'eu';
process.env.GOOGLE_DOCUMENT_AI_TRANSPORT_PROCESSOR_ID = 'transport-proc-id';
process.env.GOOGLE_DOCUMENT_AI_TRANSPORT_PROCESSOR_VERSION = '';
process.env.GOOGLE_DOCUMENT_AI_APE_PROCESSOR_ID = 'ape-proc-id';
process.env.GOOGLE_DOCUMENT_AI_APE_PROCESSOR_VERSION = '';
// Legacy fallback var — TRANSPORT_PROCESSOR_ID above should take precedence in config.
process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID = 'legacy-proc-id';
process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_VERSION = '';

process.env.DB_HOST = 'localhost';
process.env.DB_PORT = '5432';
process.env.DB_USER = 'test';
process.env.DB_PASSWORD = 'test';
process.env.DB_NAME = 'test';
process.env.SECRET_KEY = 'test-secret';
