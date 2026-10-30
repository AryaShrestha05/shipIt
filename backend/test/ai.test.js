const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const aiRoutes = require('../src/routes/ai');
const fromRequest = require('../src/ai/fromRequest');

async function post(router, url) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  const server = await new Promise(function (resolve) {
    const s = app.listen(0, function () { resolve(s); });
  });
  try {
    const res = await fetch('http://localhost:' + server.address().port + url, { method: 'POST' });
    return { status: res.status, body: await res.json() };
  } finally {
    server.close();
  }
}

// A fake AI that answers every chat message with `reply`, or fails with `error`.
function fakeAI(reply, error) {
  return {
    provider: 'claude',
    model: 'claude-opus-5-5',
    canTranscribe: false,
    chatModel: function () {
      return { startChat: function () { return { sendMessage: function () {
        if (error) return Promise.reject(new Error(error));
        return Promise.resolve({ response: { text: function () { return reply; } } });
      } }; } };
    },
  };
}

test('POST /api/ai/check reports a working key', async () => {
  const router = aiRoutes.createAiRouter({ aiFromRequest: function () { return fakeAI('OK'); } });
  const res = await post(router, '/api/ai/check');
  assert.deepStrictEqual(res.body, { ok: true, provider: 'claude', model: 'claude-opus-5-5', canTranscribe: false });
});

test('POST /api/ai/check reports a bad key without crashing', async () => {
  const router = aiRoutes.createAiRouter({ aiFromRequest: function () { return fakeAI('', '401 invalid x-api-key'); } });
  const res = await post(router, '/api/ai/check');
  assert.strictEqual(res.body.ok, false);
  assert.match(res.body.error, /401/);
});

test('POST /api/ai/check says when there is no key at all', async () => {
  const router = aiRoutes.createAiRouter({ aiFromRequest: function () { throw new fromRequest.NoKeyError(); } });
  const res = await post(router, '/api/ai/check');
  assert.strictEqual(res.status, 401);
  assert.match(res.body.error, /No AI key/);
});
