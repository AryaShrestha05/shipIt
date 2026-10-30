const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const express = require('express');

process.env.SHIPIT_WORKSPACES = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-dev-'));
const dev = require('../src/routes/dev');
const workspace = require('../src/workspace/workspace');

// Starts a throwaway server, makes one GET request, always shuts the server
// down (even if the request fails), and returns { status, type, text }.
async function get(url, method) {
  const app = express();
  app.use('/api', dev.router);
  const server = await new Promise(function (resolve) {
    const s = app.listen(0, function () {
      resolve(s);
    });
  });
  try {
    const res = await fetch('http://localhost:' + server.address().port + url, { method: method || 'GET' });
    const text = await res.text();
    return { status: res.status, type: res.headers.get('content-type'), text: text };
  } finally {
    server.close();
  }
}

test('lists themes and section variants', async () => {
  const res = await get('/api/dev/sections');
  const body = JSON.parse(res.text);
  assert.deepStrictEqual(body.themes, ['hearth', 'atelier', 'noir']);
  assert.ok(body.sections.includes('hero-split'));
});

test('gives the automatic layout for a sample business', async () => {
  const res = await get('/api/dev/layout?sample=salon');
  const body = JSON.parse(res.text);
  assert.strictEqual(body.theme, 'atelier');
  assert.match(body.sections[0], /^hero-/);
});

test('serves a composed site with the chosen sections', async () => {
  const res = await get('/api/dev/site/noir/index.html?sample=salon&sections=hero-giant,items-list');
  assert.strictEqual(res.status, 200);
  assert.ok(res.text.includes('Studio Nova'));
  assert.ok(res.text.includes('hero-giant'));
  assert.ok(res.text.includes('items-list'));
  assert.ok(!res.text.includes('{{'));
});

test('serves the theme stylesheet and effects next to the page', async () => {
  const css = await get('/api/dev/site/noir/theme.css');
  const js = await get('/api/dev/site/noir/effects.js');
  assert.strictEqual(css.status, 200);
  assert.ok(css.text.includes('noir'));
  assert.strictEqual(js.status, 200);
});

test('unknown site file is a 404', async () => {
  const res = await get('/api/dev/site/noir/secrets.txt');
  assert.strictEqual(res.status, 404);
});

test('POST /api/dev/run builds v1 of a sample site in a new run', async () => {
  const res = await get('/api/dev/run?sample=salon', 'POST');
  const body = JSON.parse(res.text);
  assert.strictEqual(body.version, 1);
  assert.strictEqual(body.previewUrl, '/preview/' + body.runId + '/v1/index.html');
  const dir = workspace.versionDir(body.runId, 1);
  for (const file of ['index.html', 'base.css', 'theme.css', 'effects.js', 'layout.json']) {
    assert.ok(fs.existsSync(path.join(dir, file)), file);
  }
  assert.ok(fs.readFileSync(path.join(dir, 'index.html'), 'utf8').includes('Studio Nova'));
});

test('POST /api/dev/run/:runId/next copies to a new version and marks only the copy', async () => {
  const first = JSON.parse((await get('/api/dev/run', 'POST')).text);
  const res = await get('/api/dev/run/' + first.runId + '/next', 'POST');
  const body = JSON.parse(res.text);
  assert.strictEqual(body.version, 2);
  const v1 = fs.readFileSync(path.join(workspace.versionDir(first.runId, 1), 'index.html'), 'utf8');
  const v2 = fs.readFileSync(path.join(workspace.versionDir(first.runId, 2), 'index.html'), 'utf8');
  assert.ok(!v1.includes('(v2)'));
  assert.ok(v2.includes('(v2)'));
});

test('next on an unknown run is a 404', async () => {
  const res = await get('/api/dev/run/zzzzzzzz/next', 'POST');
  assert.strictEqual(res.status, 404);
});
