const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const url = require('url');
const qa = require('../src/qa/runQa');

function fixture(name) {
  return url.pathToFileURL(path.join(__dirname, 'fixtures', name, 'index.html')).href;
}

function byId(result) {
  const checks = {};
  for (const check of result.checks) checks[check.id] = check;
  return checks;
}

test('a broken site fails the link, phone, image and console checks', async () => {
  const shotsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-qa-'));
  const result = await qa.runQa({ url: fixture('broken'), expectedSids: ['hero-title'], shotsDir: shotsDir });
  const checks = byId(result);

  assert.strictEqual(checks.links.ok, false);
  assert.match(checks.links.detail, /#order/);
  assert.match(checks.links.detail, /Order ahead/);
  assert.strictEqual(checks.phone.ok, false);
  assert.strictEqual(checks.images.ok, false);
  assert.strictEqual(checks.console.ok, false);
  assert.strictEqual(checks.sids.ok, true);

  assert.ok(fs.existsSync(result.shots.desktop));
  assert.ok(fs.existsSync(result.shots.phone));
});

test('a clean site passes every check, each with a plain-English label', async () => {
  const shotsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-qa-'));
  const result = await qa.runQa({ url: fixture('clean'), expectedSids: ['nav-brand', 'hero-title'], shotsDir: shotsDir });
  assert.deepStrictEqual(result.checks.map(function (c) { return c.id; }), ['links', 'console', 'phone', 'images', 'sids']);
  for (const check of result.checks) {
    assert.strictEqual(check.ok, true, check.id + ': ' + check.detail);
    assert.ok(check.label.length > 0);
  }
});

test('a missing name tag fails the "nothing editable went missing" check', async () => {
  const shotsDir = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-qa-'));
  const result = await qa.runQa({ url: fixture('clean'), expectedSids: ['hero-title', 'gone'], shotsDir: shotsDir });
  const sids = byId(result).sids;
  assert.strictEqual(sids.ok, false);
  assert.match(sids.detail, /gone/);
});
