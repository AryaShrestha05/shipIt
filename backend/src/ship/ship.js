const fs = require('fs');
const path = require('path');
const workspace = require('../workspace/workspace');
const qaRunner = require('../qa/runQa');
const prompts = require('./prompts');
const edits = require('./edits');

// Ship: apply every note at once, test the site like a customer, fix what
// failed, and report back.
//
//   v1 (before) ──copy──► v2 ──1 AI call: edit plan──► test ──fail?──► 1 AI call: fix plan ──► test ...
//
// Each round is ONE AI call: we send the whole page, the AI answers with an
// edit plan (edits.js), and our code applies it. At most 3 calls per Ship.
//
// options:
//   runId, pins     — which site, and the owner's notes
//   ai              — the AI (from ai/providers.js); we use ai.extractJson
//   baseUrl         — where this server is, e.g. http://localhost:3001 (QA opens the site there)
//   onEvent(event)  — live updates for the browser
//   signal          — stops before the next round if the browser tab closes
//   qa              — only swapped out in tests

const MAX_FIX_ROUNDS = 2;

// Screenshots go next to the versions, so /preview can serve them:
// workspaces/<runId>/shots/v2/desktop.png
function shotsDir(runId, version) {
  const dir = path.join(workspace.WORKSPACES_DIR, runId, 'shots', 'v' + version);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

function shotUrl(runId, version, file) {
  return '/preview/' + runId + '/shots/v' + version + '/' + file;
}

// Every data-sid in a page, so we can tell if an edit removed one.
function sidsIn(html) {
  const sids = [];
  // Finds every data-sid="..." in the page. The g at the end means "all of them".
  const pattern = /data-sid="([^"]+)"/g;
  let match = pattern.exec(html);
  while (match) {
    sids.push(match[1]);
    match = pattern.exec(html);
  }
  return sids;
}

async function shipRun(options) {
  const runId = options.runId;
  const onEvent = options.onEvent || function () {};
  const qa = options.qa || qaRunner.runQa;

  const from = workspace.latestVersion(runId);
  const to = from + 1;
  // Start from a copy, so the old version is never touched.
  workspace.copyVersion(runId, from, to);
  const expectedSids = sidsIn(fs.readFileSync(path.join(workspace.versionDir(runId, from), 'index.html'), 'utf8'));
  const dir = workspace.versionDir(runId, to); // every edit happens in the new copy only

  // The page as it is right now, for the AI to read.
  function currentPage() {
    const themePath = path.join(dir, 'theme.css');
    return {
      html: fs.readFileSync(path.join(dir, 'index.html'), 'utf8'),
      themeCss: fs.existsSync(themePath) ? fs.readFileSync(themePath, 'utf8') : '',
    };
  }

  // One AI call → one edit plan → applied. Returns the plan's change lines.
  async function round(prompt) {
    const plan = await options.ai.extractJson({ system: prompts.SHIP_SYSTEM, prompt: prompt, schema: edits.PLAN_SCHEMA });
    const result = edits.applyEdits(dir, plan, expectedSids);
    onEvent({ type: 'step', message: 'made ' + result.applied + ' edit' + (result.applied === 1 ? '' : 's') + (result.cssAdded ? ' and a style change' : '') });
    if (result.skipped.length > 0) {
      onEvent({ type: 'warning', message: 'skipped ' + result.skipped.length + ' edit' + (result.skipped.length === 1 ? '' : 's') + ' that didn\'t fit the page' });
    }
    return plan.changes || [];
  }

  async function test(version) {
    return qa({
      url: options.baseUrl + workspace.previewUrl(runId, version),
      expectedSids: expectedSids,
      shotsDir: shotsDir(runId, version),
    });
  }

  // 1. A "before" screenshot of the current site.
  await test(from);

  // 2. Make every change.
  onEvent({ type: 'status', message: 'applying your ' + options.pins.length + ' change' + (options.pins.length === 1 ? '' : 's') });
  const changes = (await round(prompts.buildShipPrompt(options.pins, currentPage()))).slice();

  // 3. Test like a customer; fix and retest up to MAX_FIX_ROUNDS times.
  onEvent({ type: 'status', message: 'testing your site like a customer' });
  let result = await test(to);
  let fixRound = 0;
  // Report the checks, then stop if all passed or we've used up the fix rounds.
  while (true) {
    result.checks.forEach(function (check) { onEvent({ type: 'qa_check', round: fixRound, check: check }); });
    // Only the checks that failed (! means "not").
    const failed = result.checks.filter(function (check) { return !check.ok; });
    if (failed.length === 0 || fixRound >= MAX_FIX_ROUNDS) break;
    if (options.signal && options.signal.aborted) break;

    fixRound++;
    onEvent({
      type: 'qa_fix',
      round: fixRound,
      message: 'found: ' + failed.map(function (c) { return c.label; }).join(', ') + ' — fixing it',
      failed: failed.map(function (c) { return c.id; }),
    });
    // Ask the AI to fix exactly what failed, then test again.
    (await round(prompts.buildFixPrompt(failed, currentPage()))).forEach(function (line) { changes.push(line); });
    result = await test(to);
  }

  const shipped = {
    type: 'shipped',
    version: to,
    previewUrl: workspace.previewUrl(runId, to),
    beforeUrl: workspace.previewUrl(runId, from),
    shots: {
      before: shotUrl(runId, from, 'desktop.png'),
      after: shotUrl(runId, to, 'desktop.png'),
      phone: shotUrl(runId, to, 'phone.png'),
    },
    summary: { changes: changes, tests: result.checks },
  };
  // The final event: the browser shows the summary and before/after.
  onEvent(shipped);
  return shipped;
}

module.exports = { shipRun: shipRun, MAX_FIX_ROUNDS: MAX_FIX_ROUNDS };
