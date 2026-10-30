const test = require('node:test');
const assert = require('node:assert');
const retry = require('../src/ai/retry');
const withRetry = retry.withRetry;

// A function that fails with the given errors in order, then returns 'ok'.
function failing(...messages) {
  let calls = 0;
  const fn = async () => {
    calls++;
    if (calls <= messages.length) throw new Error(messages[calls - 1]);
    return 'ok';
  };
  fn.calls = () => calls;
  return fn;
}

test('withRetry resolves after two rate-limit failures', async () => {
  const fn = failing('429 Too Many Requests', '429 Too Many Requests');
  const result = await withRetry(fn, { baseMs: 1 });
  assert.strictEqual(result, 'ok');
  assert.strictEqual(fn.calls(), 3);
});

test('withRetry does not retry a bad request', async () => {
  const fn = failing('400 Bad Request');
  await assert.rejects(withRetry(fn, { baseMs: 1 }), /400/);
  assert.strictEqual(fn.calls(), 1);
});

test('withRetry falls back after exhausting retries', async () => {
  const fn = failing('503', '503', '503', '503', '503');
  let fellBack = 0;
  const result = await withRetry(fn, {
    retries: 2,
    baseMs: 1,
    onFallback: async () => {
      fellBack++;
      return 'fallback';
    },
  });
  assert.strictEqual(result, 'fallback');
  assert.strictEqual(fellBack, 1);
  assert.strictEqual(fn.calls(), 3);
});
