const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Every run gets its own folder, and every change gets a new numbered copy:
//
//   workspaces/ab12cd34/v1/   ← the site right after it was built
//   workspaces/ab12cd34/v2/   ← after the first Ship
//
// Old versions are never edited, so "before" is always still there for the
// before/after slider, and a failed Ship can never break the last good site.

const WORKSPACES_DIR = process.env.SHIPIT_WORKSPACES || path.join(__dirname, '..', '..', 'workspaces');

// Run ids come from the browser later, so only allow letters and digits —
// anything like "../" could otherwise reach folders outside workspaces/.
function checkRunId(runId) {
  if (!/^[a-z0-9]+$/i.test(String(runId))) throw new Error('Invalid run id: ' + runId);
}

function runDir(runId) {
  checkRunId(runId);
  return path.join(WORKSPACES_DIR, runId);
}

function versionDir(runId, version) {
  return path.join(runDir(runId), 'v' + version);
}

function createRun() {
  // A random id like "ab12cd34": a random UUID, dashes removed, first 8 characters.
  const runId = crypto.randomUUID().replace(/-/g, '').slice(0, 8);
  // recursive: also create any missing parent folders.
  fs.mkdirSync(runDir(runId), { recursive: true });
  return runId;
}

function runExists(runId) {
  try {
    return fs.existsSync(runDir(runId));
  } catch (err) {
    return false;
  }
}

// files: { 'index.html': '<html>...', 'styles.css': '...' }
function writeVersion(runId, version, files) {
  const dir = versionDir(runId, version);
  fs.mkdirSync(dir, { recursive: true });
  for (const name of Object.keys(files)) {
    fs.writeFileSync(path.join(dir, name), files[name], 'utf8');
  }
  return dir;
}

function copyVersion(runId, from, to) {
  const dir = versionDir(runId, to);
  // Copy the whole folder, every file, from the old version to the new one.
  fs.cpSync(versionDir(runId, from), dir, { recursive: true });
  return dir;
}

// Highest vN folder for this run, or 0 if nothing has been built yet.
function latestVersion(runId) {
  let latest = 0;
  for (const name of fs.readdirSync(runDir(runId))) {
    // Is the folder name like v1, v2…? If so, match[1] is the number.
    const match = name.match(/^v(\d+)$/);
    if (match && Number(match[1]) > latest) latest = Number(match[1]);
  }
  return latest;
}

// Where the browser can load a version (index.js serves workspaces/ at /preview).
function previewUrl(runId, version) {
  checkRunId(runId);
  return '/preview/' + runId + '/v' + version + '/index.html';
}

module.exports = {
  WORKSPACES_DIR: WORKSPACES_DIR,
  createRun: createRun,
  runExists: runExists,
  versionDir: versionDir,
  writeVersion: writeVersion,
  copyVersion: copyVersion,
  latestVersion: latestVersion,
  previewUrl: previewUrl,
};
