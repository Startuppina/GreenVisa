/**
 * Root structured logger (pino). Request-scoped children are attached by HTTP middleware as req.log.
 * LOG_LEVEL overrides NODE_ENV defaults (debug in non-production, info in production).
 * base: {} omits default pid/hostname on every line (operational JSON stays compact).
 * time is local wall-clock HH:mm:ss.sss (string), no calendar date.
 */
const pino = require('pino');

const isProduction = process.env.NODE_ENV === 'production';

function resolveLogLevel() {
  if (process.env.LOG_LEVEL) return process.env.LOG_LEVEL;
  return isProduction ? 'info' : 'debug';
}

/** Pino timestamp fragment: wall-clock time only (no date), local timezone, `HH:mm:ss.sss`. */
function timeOfDayTimestamp() {
  const d = new Date();
  const p = (n) => String(n).padStart(2, '0');
  const ms = String(d.getMilliseconds()).padStart(3, '0');
  return `,"time":"${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}.${ms}"`;
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
  base: {},
  timestamp: timeOfDayTimestamp,
  redact: {
    paths: redactPaths,
    censor: '[Redacted]',
  },
});

logger.getRootLogger = function getRootLogger() {
  return logger;
};

module.exports = logger;
