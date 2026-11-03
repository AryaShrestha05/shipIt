const fs = require('fs');
const path = require('path');
const recorder = require('./recorder');
const workspace = require('../workspace/workspace');

// Plays a recorded run back: our stage backup. No AI and no internet needed,
// just the files the recorder saved (see recorder.js):
//
//   recordings/ab12cd34/
//     build.json, ship-2.json, ship-3.json   — the timed events
//     v1/, v2/, ...                           — copies of each site version
//     shots/v2/desktop.png, ...               — the before/after screenshots

// A replay waits as long as the real run did between events, but never more
// than this, so a slow AI moment doesn't leave the stage silent.
const MAX_GAP_MS = 1800;

// Did this recorded build finish with a site? (A wrong key or a bad photo
// records a build that ends in an error, and that's nothing to show on stage.)
function builtOk(runId) {
  const file = path.join(recorder.RECORDINGS_DIR, runId, 'build.json');
  if (!fs.existsSync(file)) return false;
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8')).some(function (entry) { return entry.event.type === 'built'; });
  } catch {
    return false; // a half-written file
  }
}

// Every recorded run that built a site, newest first: [{ runId, name, ships: [2, 3], when }]
function listRecordings() {
  if (!fs.existsSync(recorder.RECORDINGS_DIR)) return [];
  return fs.readdirSync(recorder.RECORDINGS_DIR)
    .filter(builtOk)
    .map(function (runId) {
      const dir = path.join(recorder.RECORDINGS_DIR, runId);
      let name = runId;
      const businessFile = path.join(dir, 'v1', 'business.json');
      if (fs.existsSync(businessFile)) name = JSON.parse(fs.readFileSync(businessFile, 'utf8')).name || runId;
      // ship-2.json -> 2
      const ships = fs.readdirSync(dir)
        .filter(function (file) { return /^ship-\d+\.json$/.test(file); })
        .map(function (file) { return Number(file.slice(5, -5)); })
        .sort(function (a, b) { return a - b; });
      return { runId: runId, name: name, ships: ships, when: fs.statSync(path.join(dir, 'build.json')).mtimeMs };
    })
    .sort(function (a, b) { return b.when - a.when; });
}

// What "latest" plays: the newest run with at least one ship (the full demo),
// or the newest run at all if none has shipped yet. null if there are none.
function latestRun(list) {
  const shipped = list.find(function (run) { return run.ships.length > 0; });
  if (shipped) return shipped;
  if (list.length > 0) return list[0];
  return null;
}

// Puts the saved versions and screenshots back into workspaces/, so the
// recorded events' /preview/... links work again even after a cleanup.
function restoreRun(runId) {
  const from = path.join(recorder.RECORDINGS_DIR, runId);
  const to = path.join(workspace.WORKSPACES_DIR, runId);
  fs.mkdirSync(to, { recursive: true });
  for (const name of fs.readdirSync(from)) {
    if (/^v\d+$/.test(name) || name === 'shots') {
      fs.cpSync(path.join(from, name), path.join(to, name), { recursive: true });
    }
  }
}

// How long to wait before each entry. speed 1 = real time (capped), 0 = no waiting.
function playbackGaps(entries, speed) {
  return entries.map(function (entry, i) {
    if (i === 0 || speed === 0) return 0;
    const real = entry.t - entries[i - 1].t;
    return Math.min(real, MAX_GAP_MS) / speed;
  });
}

module.exports = {
  MAX_GAP_MS: MAX_GAP_MS,
  listRecordings: listRecordings,
  latestRun: latestRun,
  restoreRun: restoreRun,
  playbackGaps: playbackGaps,
};
