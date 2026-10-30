const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const transcribeRoutes = require('../src/routes/transcribe');
const fromRequest = require('../src/ai/fromRequest');

async function post(router, body) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  const server = await new Promise(function (resolve) {
    const s = app.listen(0, function () { resolve(s); });
  });
  try {
    const res = await fetch('http://localhost:' + server.address().port + '/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, body: await res.json() };
  } finally {
    server.close();
  }
}

// A fake AI whose transcribe() answers `text`, or fails with `error`.
function deps(text, error) {
  return {
    aiFromRequest: function () {
      return {
        transcribe: function (request) {
          if (error) return Promise.reject(new Error(error));
          return Promise.resolve(text + ' (' + request.mimeType + ')');
        },
      };
    },
  };
}

test('POST /api/transcribe turns audio into text', async () => {
  const res = await post(transcribeRoutes.createTranscribeRouter(deps('make it bigger')), { audioBase64: 'AAA', mimeType: 'audio/webm' });
  assert.strictEqual(res.status, 200);
  assert.deepStrictEqual(res.body, { text: 'make it bigger (audio/webm)' });
});

test('POST /api/transcribe without audio is a 400', async () => {
  const res = await post(transcribeRoutes.createTranscribeRouter(deps('x')), { audioBase64: '', mimeType: 'audio/webm' });
  assert.strictEqual(res.status, 400);
});

test('POST /api/transcribe without any AI key is a 401', async () => {
  const noKey = { aiFromRequest: function () { throw new fromRequest.NoKeyError(); } };
  const res = await post(transcribeRoutes.createTranscribeRouter(noKey), { audioBase64: 'AAA', mimeType: 'audio/webm' });
  assert.strictEqual(res.status, 401);
});

test('POST /api/transcribe reports a 502 with the reason when the AI fails', async () => {
  const res = await post(transcribeRoutes.createTranscribeRouter(deps(null, 'Claude cannot hear audio. Please type instead.')), { audioBase64: 'AAA', mimeType: 'audio/webm' });
  assert.strictEqual(res.status, 502);
  assert.match(res.body.error, /type instead/);
});
