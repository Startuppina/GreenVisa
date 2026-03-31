const pinoHttp = require('pino-http');
const { randomUUID } = require('crypto');
const logger = require('../logger');
const { run } = require('../lib/requestContext');

function authSummary(req) {
  const u = req.user;
  if (!u) return {};
  const isAdmin = u.role === 'administrator';
  return {
    user_id: u.user_id ?? u.id,
    is_admin: isAdmin,
  };
}

/**
 * pino-http: one line per request on response finish.
 * quietResLogger: true + quietReqLogger: false makes the completion line use the root logger (no request_id binding).
 * We assign req.log = logger so route logs stay flat (no serialized req on every line).
 * customSuccessObject/customErrorObject keep completion payloads compact.
 * ALS carries the root logger for DB instrumentation (no request_id in log output).
 */
function createRequestLoggingMiddleware() {
  const httpLogger = pinoHttp({
    logger,
    quietReqLogger: false,
    quietResLogger: true,
    genReqId: (req) => {
      if (!req.requestId) req.requestId = randomUUID();
      return req.requestId;
    },
    customAttributeKeys: {
      responseTime: 'duration_ms',
    },
    customLogLevel(req, res, err) {
      if (err) return 'error';
      if (res.statusCode >= 500) return 'error';
      if (res.statusCode >= 400) return 'warn';
      return 'info';
    },
    customSuccessMessage() {
      return 'http_request_completed';
    },
    customErrorMessage() {
      return 'http_request_completed';
    },
    customSuccessObject(req, res, val) {
      return {
        event: 'http_request_completed',
        method: req.method,
        path: req.originalUrl || req.url,
        status_code: res.statusCode,
        duration_ms: val.duration_ms,
        ...authSummary(req),
      };
    },
    customErrorObject(req, res, error, val) {
      const msg = error?.message != null ? error.message : String(error);
      const out = {
        event: 'http_request_completed',
        method: req.method,
        path: req.originalUrl || req.url,
        status_code: res.statusCode,
        duration_ms: val.duration_ms,
        ...authSummary(req),
        error: msg,
      };
      if (error?.stack) out.stack = error.stack;
      return out;
    },
  });

  return function requestLogging(req, res, next) {
    httpLogger(req, res, () => {
      req.log = logger;
      run({ log: logger }, () => next());
    });
  };
}

module.exports = { createRequestLoggingMiddleware };
