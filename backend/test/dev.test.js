const test = require('node:test');
const assert = require('node:assert');
const express = require('express');
const dev = require('../src/routes/dev');

// Starts a throwaway server on a free port and returns its base URL.
async function startServer() {
  const app = express();
  app.use('/api', dev.router);
  const server = await new Promise(function (resolve) {
    const s = app.listen(0, function () {
      resolve(s);
    });
  });
  return { server: server, base: 'http://localhost:' + server.address().port };
}

test('serves a template filled with the sample bakery', async () => {
  const s = await startServer();
  const res = await fetch(s.base + '/api/dev/template/hearth/index.html');
  const html = await res.text();
  s.server.close();
  assert.strictEqual(res.status, 200);
  assert.ok(html.includes('Rosie&#39;s Bakery'));
  assert.ok(!html.includes('{{'));
});

test('?sample=salon fills the template with the salon instead', async () => {
  const s = await startServer();
  const res = await fetch(s.base + '/api/dev/template/hearth/index.html?sample=salon');
  const html = await res.text();
  s.server.close();
  assert.ok(html.includes('Studio Nova'));
});

test('serves the template stylesheet', async () => {
  const s = await startServer();
  const res = await fetch(s.base + '/api/dev/template/atelier/styles.css');
  s.server.close();
  assert.strictEqual(res.status, 200);
  assert.match(res.headers.get('content-type'), /css/);
});

test('unknown template is a 404', async () => {
  const s = await startServer();
  const res = await fetch(s.base + '/api/dev/template/nope/index.html');
  s.server.close();
  assert.strictEqual(res.status, 404);
});
