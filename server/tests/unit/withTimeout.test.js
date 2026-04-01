const { withTimeout } = require('../../utils/withTimeout');

describe('withTimeout', () => {
  it('resolves when the promise settles before the deadline', async () => {
    const out = await withTimeout(
      Promise.resolve('ok'),
      5000,
      () => new Error('should not fire'),
    );
    expect(out).toBe('ok');
  });

  it('rejects with the factory error when the promise never settles', async () => {
    const hung = new Promise(() => {});
    const err = await withTimeout(hung, 25, () => {
      const e = new Error('timed out');
      e.code = 'TEST_TIMEOUT';
      return e;
    }).catch((e) => e);

    expect(err).toMatchObject({ message: 'timed out', code: 'TEST_TIMEOUT' });
  });

  it('returns the original promise when ms is zero (no guard)', async () => {
    const out = await withTimeout(Promise.resolve(1), 0, () => new Error('no'));
    expect(out).toBe(1);
  });

  it('returns the original promise when ms is negative', async () => {
    const out = await withTimeout(Promise.resolve(2), -1, () => new Error('no'));
    expect(out).toBe(2);
  });

  it('clears the timer when the promise wins the race', async () => {
    await withTimeout(
      new Promise((r) => setTimeout(() => r('late'), 20)),
      100,
      () => new Error('no'),
    );
  });
});
