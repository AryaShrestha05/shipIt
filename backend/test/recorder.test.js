const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.SHIPIT_RECORDINGS = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-rec-'));
const recorder = require('../src/runs/recorder');

test('a saved recording loads back with the same events in order', async () => {
  const rec = recorder.createRecorder('ab12cd34', 'build');
  rec.record({ type: 'status', message: 'one' });
  await new Promise(function (resolve) { setTimeout(resolve, 5); });
  rec.record({ type: 'built', previewUrl: '/x' });
  rec.save();

  const loaded = recorder.loadRecording('ab12cd34', 'build');
  assert.deepStrictEqual(loaded.map(function (entry) { return entry.event.type; }), ['status', 'built']);
  assert.ok(loaded[1].t > loaded[0].t);
  assert.ok(fs.existsSync(path.join(recorder.RECORDINGS_DIR, 'ab12cd34', 'build.json')));
});

test('loadRecording returns null when there is no recording', () => {
  assert.strictEqual(recorder.loadRecording('zzzzzzzz', 'build'), null);
});

test('recordings refuse run ids that could escape the folder', () => {
  assert.throws(function () { recorder.createRecorder('../etc', 'build'); }, /Invalid run id/);
});
