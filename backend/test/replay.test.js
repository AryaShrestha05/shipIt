const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.SHIPIT_WORKSPACES = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-ws-'));
process.env.SHIPIT_RECORDINGS = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-rec-'));
const workspace = require('../src/workspace/workspace');
const recorder = require('../src/runs/recorder');
const replay = require('../src/runs/replay');
const replayRoutes = require('../src/routes/replay');

// Writes a pretend recorded run: a build, then one ship, plus the saved site copies.
function recordedRun(runId, name) {
  const dir = path.join(recorder.RECORDINGS_DIR, runId);
  fs.mkdirSync(path.join(dir, 'v1'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'v2'), { recursive: true });
  fs.mkdirSync(path.join(dir, 'shots', 'v2'), { recursive: true });
  fs.writeFileSync(path.join(dir, 'v1', 'index.html'), '<h1>v1</h1>');
  fs.writeFileSync(path.join(dir, 'v1', 'business.json'), JSON.stringify({ name: name }));
  fs.writeFileSync(path.join(dir, 'v2', 'index.html'), '<h1>v2</h1>');
  fs.writeFileSync(path.join(dir, 'shots', 'v2', 'desktop.png'), 'png');
  fs.writeFileSync(path.join(dir, 'build.json'), JSON.stringify([
    { t: 0, event: { type: 'run', runId: runId } },
    { t: 5000, event: { type: 'built', previewUrl: '/preview/' + runId + '/v1/index.html' } },
  ]));
  fs.writeFileSync(path.join(dir, 'ship-2.json'), JSON.stringify([
    { t: 0, event: { type: 'pins', pins: [{ sid: 'hero-title', label: 'Rosie', text: 'bigger' }] } },
    { t: 10, event: { type: 'status', message: 'applying your 1 change' } },
    { t: 20, event: { type: 'shipped', version: 2 } },
  ]));
}

test('lists recorded runs with the business name and how many ships', () => {
  recordedRun('aaaa1111', "Rosie's Bakery");
  const list = replay.listRecordings();
  const run = list.find(function (r) { return r.runId === 'aaaa1111'; });
  assert.strictEqual(run.name, "Rosie's Bakery");
  assert.deepStrictEqual(run.ships, [2]);
});

test('restoring copies the saved versions and screenshots back where /preview serves them', () => {
  recordedRun('bbbb2222', 'Studio');
  replay.restoreRun('bbbb2222');
  assert.strictEqual(fs.readFileSync(path.join(workspace.versionDir('bbbb2222', 1), 'index.html'), 'utf8'), '<h1>v1</h1>');
  assert.strictEqual(fs.readFileSync(path.join(workspace.versionDir('bbbb2222', 2), 'index.html'), 'utf8'), '<h1>v2</h1>');
  assert.ok(fs.existsSync(path.join(workspace.WORKSPACES_DIR, 'bbbb2222', 'shots', 'v2', 'desktop.png')));
});

test('long waits are shortened so a replay never stalls on stage', () => {
  const gaps = replay.playbackGaps([{ t: 0 }, { t: 5000 }, { t: 5300 }], 1);
  assert.deepStrictEqual(gaps, [0, replay.MAX_GAP_MS, 300]);
  assert.deepStrictEqual(replay.playbackGaps([{ t: 0 }, { t: 5000 }], 0), [0, 0]);
});

test('GET /api/replay/:runId streams the build, then each ship led by its notes', async () => {
  recordedRun('cccc3333', 'Cafe');
  const app = express();
  app.use('/api', replayRoutes.createReplayRouter());
  const server = await new Promise(function (resolve) { const s = app.listen(0, function () { resolve(s); }); });
  try {
    const res = await fetch('http://localhost:' + server.address().port + '/api/replay/cccc3333?speed=0');
    const types = (await res.text()).split('\n\n').filter(Boolean).map(function (chunk) {
      return JSON.parse(chunk.replace(/^data: /, '')).type;
    });
    assert.deepStrictEqual(types, ['run', 'built', 'replay_ship', 'replay_shipping', 'status', 'shipped', 'replay_done']);
  } finally {
    server.close();
  }
});

test('an unknown or "latest" run id is handled', async () => {
  const app = express();
  app.use('/api', replayRoutes.createReplayRouter());
  const server = await new Promise(function (resolve) { const s = app.listen(0, function () { resolve(s); }); });
  try {
    const missing = await fetch('http://localhost:' + server.address().port + '/api/replay/zzzz9999?speed=0');
    assert.strictEqual(missing.status, 404);
    const latest = await fetch('http://localhost:' + server.address().port + '/api/replay/latest?speed=0');
    assert.strictEqual(latest.status, 200);
  } finally {
    server.close();
  }
});

test('a build that failed (no site) is never offered for replay', () => {
  const dir = path.join(recorder.RECORDINGS_DIR, 'cccc3333');
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'build.json'), JSON.stringify([
    { t: 0, event: { type: 'run', runId: 'cccc3333' } },
    { t: 10, event: { type: 'error', message: 'invalid x-api-key' } },
  ]));
  assert.ok(!replay.listRecordings().some(function (r) { return r.runId === 'cccc3333'; }));
});

test('"latest" means the newest run that has a ship, not just the newest build', () => {
  const list = [
    { runId: 'new1', ships: [] },
    { runId: 'mid2', ships: [2] },
    { runId: 'old3', ships: [2, 3] },
  ];
  assert.strictEqual(replay.latestRun(list).runId, 'mid2');
  assert.strictEqual(replay.latestRun([{ runId: 'only', ships: [] }]).runId, 'only');
  assert.strictEqual(replay.latestRun([]), null);
});
