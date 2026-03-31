/**
 * Root structured logger (pino). Request-scoped children are attached by HTTP middleware as req.log.
 * LOG_LEVEL overrides NODE_ENV defaults (debug in non-production, info in production).
 */
const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

function resolveLogLevel() {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  return isProduction ? 'info' : 'debug';
}

const redactPaths = [
  'req.headers.authorization',
  'req.headers.cookie',
  'headers.authorization',
  'headers.cookie',
  'password',
  'password_digest',
  '*.password',
  'accessToken',
  'recoveryToken',
  'body.password',
  'body.accessToken',
  'body.recoveryToken',
  'body.token',
  'body.OTP',
  'body.otp',
  '*.OTP',
  '*.otp',
];

const logger = pino({
  level: resolveLogLevel(),
  redact: {
    paths: redactPaths,
    censor: '[Redacted]',
  },
});

logger.getRootLogger = function getRootLogger() {
  return logger;
};

module.exports = logger;
