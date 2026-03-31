const rootLogger = require('../logger');

function getLog(req) {
  if (req && req.log) return req.log;
  return rootLogger;
}

function emit(req, level, event, fields = {}) {
  const log = getLog(req);
  const payload = { event, ...fields };
  if (typeof log[level] === 'function') {
    log[level](payload);
  } else {
    log.info(payload);
  }
}

function logAuthEvent(req, event, fields = {}, level = 'info') {
  emit(req, level, event, fields);
}

function logQuestionnaireEvent(req, event, fields = {}, level = 'info') {
  emit(req, level, event, fields);
}

function logDocumentEvent(req, event, fields = {}, level = 'info') {
  emit(req, level, event, fields);
}

function logPaymentEvent(req, event, fields = {}, level = 'info') {
  emit(req, level, event, fields);
}

function logAdminEvent(req, event, fields = {}, level = 'info') {
  emit(req, level, event, fields);
}

function logBuildingEvent(req, event, fields = {}, level = 'info') {
  emit(req, level, event, fields);
}

/** Cron / background jobs: pass null for req; uses root logger */
function logCronEvent(event, fields = {}, level = 'info') {
  emit(null, level, event, fields);
}

function logUnexpectedError(req, err, context = {}) {
  const log = getLog(req);
  const message = err?.message != null ? err.message : String(err);
  log.error(
    {
      event: 'unexpected_error',
      error: message,
      ...(err?.stack ? { stack: err.stack } : {}),
      ...context,
    },
    message,
  );
}

module.exports = {
  logAuthEvent,
  logQuestionnaireEvent,
  logDocumentEvent,
  logPaymentEvent,
  logAdminEvent,
  logBuildingEvent,
  logCronEvent,
  logUnexpectedError,
  getLog,
};
