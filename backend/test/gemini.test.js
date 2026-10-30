const test = require('node:test');
const assert = require('node:assert');
const gemini = require('../src/agent/gemini');
const createModel = gemini.createModel;
const withRetry = gemini.withRetry;

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

// Stand-in for GoogleGenerativeAI that records the model config it was given.
function stubGenAI() {
  const configs = [];
  class Stub {
    getGenerativeModel(config) {
      configs.push(config);
      return {};
    }
  }
  return { Stub: Stub, configs: configs };
}

test('createModel without tools sends no tools key', () => {
  const stub = stubGenAI();
  createModel({ apiKey: 'k' }, stub.Stub);
  assert.ok(!('tools' in stub.configs[0]));
});

test('createModel defaults to gemini-2.5-flash', () => {
  const stub = stubGenAI();
  const saved = process.env.GEMINI_MODEL;
  delete process.env.GEMINI_MODEL;
  createModel({ apiKey: 'k', tools: [] }, stub.Stub);
  if (saved !== undefined) process.env.GEMINI_MODEL = saved;
  assert.strictEqual(stub.configs[0].model, 'gemini-2.5-flash');
  assert.deepStrictEqual(stub.configs[0].tools, [{ functionDeclarations: [] }]);
});
