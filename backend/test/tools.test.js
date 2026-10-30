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

test('edit_file replaces one exact piece of text', () => {
  const runTool = tempRunner();
  runTool({ name: 'write_file', args: { file_path: 'index.html', content: '<h1>Old title</h1><p>keep</p>' } });
  const out = runTool({ name: 'edit_file', args: { file_path: 'index.html', old_text: 'Old title', new_text: 'New title' } });
  assert.match(out, /^Edited/);
  assert.strictEqual(runTool({ name: 'read_file', args: { file_path: 'index.html' } }), '<h1>New title</h1><p>keep</p>');
});

test('edit_file refuses text that is missing or appears more than once', () => {
  const runTool = tempRunner();
  runTool({ name: 'write_file', args: { file_path: 'a.html', content: '<p>x</p><p>x</p>' } });
  assert.match(runTool({ name: 'edit_file', args: { file_path: 'a.html', old_text: 'nope', new_text: 'y' } }), /^ERROR:.*not found/);
  assert.match(runTool({ name: 'edit_file', args: { file_path: 'a.html', old_text: '<p>x</p>', new_text: 'y' } }), /^ERROR:.*2 times/);
});
