const fs = require('fs');
const path = require('path');
const workspace = require('../workspace/workspace');
const tools = require('../agent/tools');
const loop = require('../agent/loop');
const qaRunner = require('../qa/runQa');
const prompts = require('./prompts');

// Ship: apply every note at once, test the site like a customer, fix what
// failed, and report back.
//
//   v1 (before) ──copy──► v2 ──AI edits──► test ──fail?──► AI fixes ──► test ...
//
// options:
//   runId, pins     — which site, and the owner's notes
//   model           — the AI's chat model (from ai.chatModel)
//   baseUrl         — where this server is, e.g. http://localhost:3001 (QA opens the site there)
//   onEvent(event)  — live updates for the browser
//   signal          — stops the AI if the browser tab closes
//   agent, qa       — only swapped out in tests

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
  const agent = options.agent || loop.runAgent;
  const qa = options.qa || qaRunner.runQa;

  const from = workspace.latestVersion(runId);
  const to = from + 1;
  // Start from a copy, so the old version is never touched.
  workspace.copyVersion(runId, from, to);
  const expectedSids = sidsIn(fs.readFileSync(path.join(workspace.versionDir(runId, from), 'index.html'), 'utf8'));
  // The AI's tools can only touch files inside the new version's folder.
  const runTool = tools.createToolRunner(workspace.versionDir(runId, to));

  // The AI's tool steps, as short readable lines (not whole file contents).
  function onAgentEvent(event) {
    if (event.type === 'tool_call') {
      onEvent({ type: 'step', tool: event.name, file: event.args ? event.args.file_path || '' : '' });
    }
    if (event.type === 'error') onEvent({ type: 'warning', message: event.message });
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
  // Run the AI with all the notes; its final reply becomes the list of changes.
  const changes = prompts.parseSummary(await agent(options.model, prompts.buildShipPrompt(options.pins), runTool, onAgentEvent, { signal: options.signal }));

  // 3. Test like a customer; fix and retest up to MAX_FIX_ROUNDS times.
  onEvent({ type: 'status', message: 'testing your site like a customer' });
  let result = await test(to);
  let round = 0;
  // Report the checks, then stop if all passed or we've used up the fix rounds.
  while (true) {
    result.checks.forEach(function (check) { onEvent({ type: 'qa_check', round: round, check: check }); });
    // Only the checks that failed (! means "not").
    const failed = result.checks.filter(function (check) { return !check.ok; });
    if (failed.length === 0 || round >= MAX_FIX_ROUNDS) break;
    if (options.signal && options.signal.aborted) break;

    round++;
    onEvent({
      type: 'qa_fix',
      round: round,
      message: 'found: ' + failed.map(function (c) { return c.label; }).join(', ') + ' — fixing it',
      failed: failed.map(function (c) { return c.id; }),
    });
    // Ask the AI to fix exactly what failed, then test again.
    const fixText = await agent(options.model, prompts.buildFixPrompt(failed), runTool, onAgentEvent, { signal: options.signal });
    prompts.parseSummary(fixText).forEach(function (line) { changes.push(line); });
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
