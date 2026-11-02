const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const edits = require('../src/ship/edits');

const PAGE = '<h1 data-sid="hero-title">Rosie\'s</h1>\n<p data-sid="hero-sub">Bread</p>\n<p data-sid="hero-sub2">Bread</p>';

function site() {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-edits-'));
  fs.writeFileSync(path.join(dir, 'index.html'), PAGE);
  fs.writeFileSync(path.join(dir, 'custom.css'), '/* Changes made with ShipIt go here. */\n');
  return dir;
}

function read(dir, file) {
  return fs.readFileSync(path.join(dir, file), 'utf8');
}

const SIDS = ['hero-title', 'hero-sub', 'hero-sub2'];

test('applies a find/replace edit that matches exactly once', () => {
  const dir = site();
  const result = edits.applyEdits(dir, { edits: [{ find: '>Rosie\'s<', replace: '>Rosie\'s Bakery<' }], css: '' }, SIDS);
  assert.strictEqual(result.applied, 1);
  assert.ok(read(dir, 'index.html').includes('>Rosie\'s Bakery<'));
});

test('skips text that is missing or appears more than once, and says why', () => {
  const dir = site();
  const result = edits.applyEdits(dir, { edits: [{ find: 'nope', replace: 'x' }, { find: '>Bread<', replace: '>Cake<' }], css: '' }, SIDS);
  assert.strictEqual(result.applied, 0);
  assert.deepStrictEqual(result.skipped.map(function (s) { return s.reason; }), ['not found', 'found 2 times']);
  assert.strictEqual(read(dir, 'index.html'), PAGE);
});

test('never lets an edit remove a data-sid name tag', () => {
  const dir = site();
  const result = edits.applyEdits(dir, { edits: [{ find: '<h1 data-sid="hero-title">', replace: '<h1>' }], css: '' }, SIDS);
  assert.strictEqual(result.applied, 0);
  assert.strictEqual(result.skipped[0].reason, 'would remove a name tag');
  assert.ok(read(dir, 'index.html').includes('data-sid="hero-title"'));
});

test('style changes are added to custom.css, never to the shared files', () => {
  const dir = site();
  edits.applyEdits(dir, { edits: [], css: '.hero-title { font-size: 120px; }' }, SIDS);
  const css = read(dir, 'custom.css');
  assert.ok(css.startsWith('/* Changes made with ShipIt go here. */'));
  assert.ok(css.includes('.hero-title { font-size: 120px; }'));
});

test('css that tries to close the style or load a script is refused', () => {
  const dir = site();
  const result = edits.applyEdits(dir, { edits: [], css: '</style><script>alert(1)</script>' }, SIDS);
  assert.strictEqual(result.cssAdded, false);
  assert.ok(!read(dir, 'custom.css').includes('script'));
});

test('a plan with nothing in it changes nothing', () => {
  const dir = site();
  const result = edits.applyEdits(dir, {}, SIDS);
  assert.strictEqual(result.applied, 0);
  assert.strictEqual(read(dir, 'index.html'), PAGE);
});
