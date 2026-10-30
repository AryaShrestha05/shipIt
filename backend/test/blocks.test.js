const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const compose = require('../src/site/compose');
const catalog = require('../src/site/catalog');
const blocks = require('../src/routes/blocks');

async function get(url) {
  const app = express();
  app.use('/api', blocks.router);
  const server = await new Promise(function (resolve) {
    const s = app.listen(0, function () {
      resolve(s);
    });
  });
  try {
    const res = await fetch('http://localhost:' + server.address().port + url);
    return { status: res.status, text: await res.text() };
  } finally {
    server.close();
  }
}

test('every section on disk has a catalog entry, and every entry has a file', () => {
  const listed = catalog.CATALOG.sections.map(function (s) { return s.id; }).sort();
  assert.deepStrictEqual(listed, compose.SECTION_IDS);
});

test('every theme has a catalog entry', () => {
  const listed = catalog.CATALOG.themes.map(function (t) { return t.id; }).sort();
  assert.deepStrictEqual(listed, Object.keys(compose.THEMES).sort());
});

test('every catalog entry has a name, a description, and a free or pro tier', () => {
  const all = catalog.CATALOG.sections.concat(catalog.CATALOG.themes);
  for (const entry of all) {
    assert.ok(entry.name, entry.id + ' has no name');
    assert.ok(entry.description, entry.id + ' has no description');
    assert.ok(entry.tier === 'free' || entry.tier === 'pro', entry.id + ' has tier ' + entry.tier);
  }
  assert.ok(all.some(function (e) { return e.tier === 'pro'; }));
  assert.ok(all.some(function (e) { return e.tier === 'free'; }));
});

test('GET /api/blocks returns the catalog', async () => {
  const res = await get('/api/blocks');
  const body = JSON.parse(res.text);
  assert.strictEqual(body.sections.length, compose.SECTION_IDS.length);
  assert.strictEqual(body.sections[0].type.length > 0, true);
});

test('GET /api/blocks/preview shows one block on its own', async () => {
  const res = await get('/api/blocks/preview/noir/index.html?section=items-tilt');
  assert.strictEqual(res.status, 200);
  assert.ok(res.text.includes('items-tilt'));
  assert.ok(!res.text.includes('hero-title'));
  assert.ok(res.text.includes('.will-reveal'), 'previews should show blocks in their finished state');
});

test('preview of an unknown block is a 404', async () => {
  const res = await get('/api/blocks/preview/noir/index.html?section=nope');
  assert.strictEqual(res.status, 404);
});

test('preview serves the theme files next to the page', async () => {
  const res = await get('/api/blocks/preview/atelier/theme.css');
  assert.strictEqual(res.status, 200);
  assert.ok(res.text.includes('atelier'));
});
