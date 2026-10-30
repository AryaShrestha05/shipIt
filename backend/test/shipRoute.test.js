const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.SHIPIT_WORKSPACES = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-ws-'));
process.env.SHIPIT_RECORDINGS = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-rec-'));
const workspace = require('../src/workspace/workspace');
const shipRoutes = require('../src/routes/ship');

async function startServer(router) {
  const app = express();
  app.use(express.json());
  app.use('/api', router);
  return new Promise(function (resolve) {
    const s = app.listen(0, function () { resolve(s); });
  });
}

function post(server, body) {
  return fetch('http://localhost:' + server.address().port + '/api/ship', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

const PINS = [{ sid: 'hero-title', label: 'Old', text: 'bigger' }];

function deps(shipRun) {
  return { aiFromRequest: function () { return { chatModel: function () { return {}; } }; }, shipRun: shipRun };
}

test('POST /api/ship refuses no notes, empty notes and unknown runs', async () => {
  const runId = workspace.createRun();
  const server = await startServer(shipRoutes.createShipRouter(deps(function () {})));
  try {
    assert.strictEqual((await post(server, { runId: runId, pins: [] })).status, 400);
    assert.strictEqual((await post(server, { runId: runId, pins: [{ sid: 'a', text: '  ' }] })).status, 400);
    assert.strictEqual((await post(server, { runId: 'zzzzzzzz', pins: PINS })).status, 400);
  } finally {
    server.close();
  }
});

test('POST /api/ship refuses a second ship while one is running (409)', async () => {
  const runId = workspace.createRun();
  workspace.writeVersion(runId, 1, { 'index.html': '<h1 data-sid="hero-title">Old</h1>' });
  let finish;
  const slowShip = function (options) {
    options.onEvent({ type: 'status', message: 'applying' });
    return new Promise(function (resolve) {
      finish = function () {
        options.onEvent({ type: 'shipped', version: 2 });
        resolve({ type: 'shipped', version: 2 });
      };
    });
  };
  const server = await startServer(shipRoutes.createShipRouter(deps(slowShip)));
  try {
    const first = await post(server, { runId: runId, pins: PINS });
    const second = await post(server, { runId: runId, pins: PINS });
    assert.strictEqual(second.status, 409);
    finish();
    const text = await first.text();
    assert.match(text, /"type":"shipped"/);
    // Once finished, shipping again is allowed.
    finish = null;
    const third = post(server, { runId: runId, pins: PINS });
    await new Promise(function (r) { setTimeout(r, 50); });
    finish();
    assert.strictEqual((await third).status, 200);
  } finally {
    server.close();
  }
});
