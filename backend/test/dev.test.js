const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const dev = require('../src/routes/dev');

// Starts a throwaway server, makes one GET request, always shuts the server
// down (even if the request fails), and returns { status, type, text }.
async function get(url) {
  const app = express();
  app.use('/api', dev.router);
  const server = await new Promise(function (resolve) {
    const s = app.listen(0, function () {
      resolve(s);
    });
  });
  try {
    const res = await fetch('http://localhost:' + server.address().port + url);
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
