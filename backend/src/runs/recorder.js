const fs = require('fs');
const path = require('path');

// Saves every event of a run with the time it happened, so the whole run can
// be played back later at the same speed. That's our stage backup: if the
// Wi-Fi or the AI fails during the pitch, we replay a real recorded run.
//
//   recordings/ab12cd34/build.json  →  [{ t: 0, event: {...} }, { t: 1840, event: {...} }]

const RECORDINGS_DIR = process.env.SHIPIT_RECORDINGS || path.join(__dirname, '..', '..', 'recordings');

// Same rule as workspace.js: letters and digits only, so "../" can't sneak in.
function recordingDir(runId) {
  if (!/^[a-z0-9]+$/i.test(String(runId))) throw new Error('Invalid run id: ' + runId);
  return path.join(RECORDINGS_DIR, runId);
}

function createRecorder(runId, phase) {
  const dir = recordingDir(runId);
  const start = Date.now();
  const entries = [];

  function record(event) {
    entries.push({ t: Date.now() - start, event: event });
  }

  function save() {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(path.join(dir, phase + '.json'), JSON.stringify(entries, null, 2), 'utf8');
  }

  return { dir: dir, record: record, save: save };
}

// The saved entries, or null if this run has no recording for that phase.
function loadRecording(runId, phase) {
  const file = path.join(recordingDir(runId), phase + '.json');
  if (!fs.existsSync(file)) return null;
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

module.exports = {
  RECORDINGS_DIR: RECORDINGS_DIR,
  createRecorder: createRecorder,
  loadRecording: loadRecording,
};
