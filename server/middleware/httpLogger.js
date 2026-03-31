const pinoHttp = require('pino-http');
const { randomUUID } = require('crypto');
const logger = require('../logger');
const { run } = require('../lib/requestContext');

/**
 * pino-http logs one line per request on response finish; customProps add domain fields.
 * ALS is entered so pool.query instrumentation can attach request_id to db_query_* logs.
 */
function createRequestLoggingMiddleware() {
  const httpLogger = pinoHttp({
    logger,
    genReqId: (req) => {
      if (!req.requestId) req.requestId = randomUUID();
      return req.requestId;
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
    customAttributeKeys: {
      req: 'http_req',
      res: 'http_res',
      responseTime: 'duration_ms',
    },
    serializers: {
      req(req) {
        return {
          method: req.method,
          path: req.originalUrl || req.url,
          user_agent: req.headers['user-agent'],
          ip: req.ip || req.socket?.remoteAddress,
        };
      },
      res(res) {
        return { status_code: res.statusCode };
      },
    },
    customProps(req, res) {
      const u = req.user;
      const isAdmin = u?.role === 'administrator' ? true : u ? false : undefined;
      return {
        event: 'http_request_completed',
        request_id: req.id,
        method: req.method,
        path: req.originalUrl || req.url,
        status_code: res.statusCode,
        user_id: u?.user_id ?? u?.id,
        is_admin: isAdmin,
        session_id: req.cookies?.sessionId,
        ip: req.ip || req.socket?.remoteAddress,
        user_agent: req.headers['user-agent'],
      };
    },
  });

  return function requestLogging(req, res, next) {
    httpLogger(req, res, () => {
      run({ requestId: req.id, log: req.log }, () => next());
    });
  };
}

module.exports = { createRequestLoggingMiddleware };
