const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

// Point workspaces at a throwaway folder before loading the module.
process.env.SHIPIT_WORKSPACES = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-ws-'));
const workspace = require('../src/workspace/workspace');

test('createRun gives a short id and a new folder', () => {
  const runId = workspace.createRun();
  assert.match(runId, /^[a-z0-9]{8}$/);
  assert.ok(fs.existsSync(path.join(workspace.WORKSPACES_DIR, runId)));
});

test('editing a copied version leaves the original untouched', () => {
  const runId = workspace.createRun();
  workspace.writeVersion(runId, 1, { 'index.html': 'one', 'styles.css': 'a{}' });
  workspace.copyVersion(runId, 1, 2);
  fs.writeFileSync(path.join(workspace.versionDir(runId, 2), 'index.html'), 'two');

  assert.strictEqual(fs.readFileSync(path.join(workspace.versionDir(runId, 1), 'index.html'), 'utf8'), 'one');
  assert.strictEqual(fs.readFileSync(path.join(workspace.versionDir(runId, 2), 'styles.css'), 'utf8'), 'a{}');
});

test('latestVersion returns the highest version, or 0 when there is none', () => {
  const runId = workspace.createRun();
  assert.strictEqual(workspace.latestVersion(runId), 0);
  workspace.writeVersion(runId, 1, { 'index.html': 'x' });
  workspace.copyVersion(runId, 1, 2);
  assert.strictEqual(workspace.latestVersion(runId), 2);
});

test('previewUrl points at the version page', () => {
  assert.strictEqual(workspace.previewUrl('ab12cd34', 2), '/preview/ab12cd34/v2/index.html');
});

test('versionDir rejects run ids that could escape the folder', () => {
  assert.throws(function () { workspace.versionDir('../etc', 1); }, /Invalid run id/);
  assert.throws(function () { workspace.versionDir('ab/cd', 1); }, /Invalid run id/);
});

test('runExists tells real runs from made-up ones', () => {
  const runId = workspace.createRun();
  assert.strictEqual(workspace.runExists(runId), true);
  assert.strictEqual(workspace.runExists('zzzzzzzz'), false);
  assert.strictEqual(workspace.runExists('../etc'), false);
});
