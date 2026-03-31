const logger = require('../logger');
const { getRequestContext } = require('./requestContext');

const SLOW_MS = Number(process.env.LOG_SLOW_QUERY_MS) || 500;

function summarizeQuery(text) {
  if (text == null) return 'unknown';
  if (typeof text === 'string') {
    return text.replace(/\s+/g, ' ').trim().slice(0, 120);
  }
  if (typeof text === 'object' && typeof text.text === 'string') {
    return summarizeQuery(text.text);
  }
  return 'non-text-query';
}

/**
 * Wraps pool.query to record duration, warn on slow queries, and error-log failures.
 * Does not log bound parameter values. Callback-style pool.query is passed through untouched.
 */
function instrumentPgPool(pool) {
  const origQuery = pool.query.bind(pool);

  pool.query = function instrumentedQuery(text, params, callback) {
    if (typeof params === 'function') {
      return origQuery(text, params);
    }

    const label = summarizeQuery(text);
    const started = Date.now();
    const ctx = getRequestContext();
    const log = ctx?.log || logger;

    const doneSlow = (durationMs) => {
      if (durationMs >= SLOW_MS) {
        log.warn({
          event: 'db_query_slow',
          query: label,
          duration_ms: durationMs,
        });
      }
    };

    if (typeof callback === 'function') {
      return origQuery(text, params, (err, result) => {
        const durationMs = Date.now() - started;
        if (err) {
          log.error(
            {
              event: 'db_query_failed',
              query: label,
              duration_ms: durationMs,
              error: err.message,
              ...(err.code ? { db_code: err.code } : {}),
            },
            'db query failed',
          );
        } else {
          doneSlow(durationMs);
        }
        callback(err, result);
      });
    }

    const p = origQuery(text, params);
    if (p && typeof p.then === 'function') {
      return p
        .then((result) => {
          doneSlow(Date.now() - started);
          return result;
        })
        .catch((err) => {
          const durationMs = Date.now() - started;
          log.error(
            {
              event: 'db_query_failed',
              query: label,
              duration_ms: durationMs,
              error: err.message,
              ...(err.code ? { db_code: err.code } : {}),
            },
            'db query failed',
          );
          throw err;
        });
    }

    return p;
  };

  return pool;
}

module.exports = { instrumentPgPool, SLOW_MS };
