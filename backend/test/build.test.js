const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.SHIPIT_WORKSPACES = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-ws-'));
process.env.SHIPIT_RECORDINGS = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-rec-'));
const build = require('../src/routes/build');
const workspace = require('../src/workspace/workspace');
const recorder = require('../src/runs/recorder');
const sample = require('../src/site/sample');

// Starts the router on a free port, POSTs `body`, and returns the raw text.
async function post(router, body) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  const server = await new Promise(function (resolve) {
    const s = app.listen(0, function () { resolve(s); });
  });
  try {
    const res = await fetch('http://localhost:' + server.address().port + '/api/build', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    return { status: res.status, text: await res.text() };
  } finally {
    server.close();
  }
}

// "data: {...}\n\n" lines -> [{...}, ...]
function events(text) {
  return text.split('\n\n').filter(Boolean).map(function (chunk) {
    return JSON.parse(chunk.replace(/^data: /, ''));
  });
}

const fakeDeps = {
  aiFromRequest: function () { return {}; },
  extract: function () { return Promise.resolve(sample.SAMPLE_BUSINESS); },
};

test('POST /api/build streams extracted then built, and the site exists', async () => {
  const res = await post(build.createBuildRouter(fakeDeps), { imageBase64: 'AAA', mimeType: 'image/png' });
  const list = events(res.text);
  const types = list.map(function (e) { return e.type; });
  assert.deepStrictEqual(types, ['run', 'status', 'extracted', 'status', 'built']);

  const runId = list[0].runId;
  const built = list[4];
  assert.strictEqual(built.previewUrl, workspace.previewUrl(runId, 1));
  assert.strictEqual(list[2].business.name, "Rosie's Bakery");
  assert.ok(fs.existsSync(path.join(workspace.versionDir(runId, 1), 'index.html')));
  assert.ok(fs.existsSync(path.join(workspace.versionDir(runId, 1), 'layout.json')));

  // The whole build is recorded, with a snapshot of v1, for replay on stage.
  assert.strictEqual(recorder.loadRecording(runId, 'build').length, 5);
  assert.ok(fs.existsSync(path.join(recorder.RECORDINGS_DIR, runId, 'v1', 'index.html')));
});

test('POST /api/build without a photo is a 400', async () => {
  const res = await post(build.createBuildRouter(fakeDeps), { mimeType: 'image/png' });
  assert.strictEqual(res.status, 400);
});

test('POST /api/build without any AI key is a 401', async () => {
  const deps = { aiFromRequest: function () { throw new (require('../src/ai/fromRequest').NoKeyError)(); }, extract: fakeDeps.extract };
  const res = await post(build.createBuildRouter(deps), { imageBase64: 'AAA', mimeType: 'image/png' });
  assert.strictEqual(res.status, 401);
});

test('POST /api/build reports an error event when reading the photo fails', async () => {
  const deps = { aiFromRequest: fakeDeps.aiFromRequest, extract: function () { return Promise.reject(new Error('quota')); } };
  const list = events((await post(build.createBuildRouter(deps), { imageBase64: 'AAA', mimeType: 'image/png' })).text);
  const last = list[list.length - 1];
  assert.strictEqual(last.type, 'error');
  assert.match(last.message, /quota/);
});
