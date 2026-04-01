/**
 * Race `promise` against a timer. On timeout, reject with `errorFactory()`.
 * @template T
 * @param {Promise<T>} promise
 * @param {number} ms — Must be positive; 0 or negative skips the guard (waits for `promise` only).
 * @param {() => Error} errorFactory
 * @returns {Promise<T>}
 */
function withTimeout(promise, ms, errorFactory) {
  if (!Number.isFinite(ms) || ms <= 0) {
    return promise;
  }

  let timer;
  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => reject(errorFactory()), ms);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

module.exports = { withTimeout };
