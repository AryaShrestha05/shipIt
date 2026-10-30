const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const tools = require('../src/agent/tools');

function tempRunner() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-tools-'));
  return tools.createToolRunner(root);
}

test('refuses to read outside the workspace', () => {
  const runTool = tempRunner();
  const out = runTool({ name: 'read_file', args: { file_path: '../../etc/passwd' } });
  assert.match(out, /^ERROR:/);
});

test('returns an error for a missing file instead of throwing', () => {
  const runTool = tempRunner();
  const out = runTool({ name: 'read_file', args: { file_path: 'missing.txt' } });
  assert.match(out, /^ERROR:/);
});

test('write_file then read_file round-trips', () => {
  const runTool = tempRunner();
  runTool({ name: 'write_file', args: { file_path: 'a/b.txt', content: 'hi' } });
  const out = runTool({ name: 'read_file', args: { file_path: 'a/b.txt' } });
  assert.strictEqual(out, 'hi');
});
