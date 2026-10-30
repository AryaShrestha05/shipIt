const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const os = require('os');
const path = require('path');

process.env.SHIPIT_WORKSPACES = fs.mkdtempSync(path.join(os.tmpdir(), 'shipit-ws-'));
const workspace = require('../src/workspace/workspace');
const ship = require('../src/ship/ship');

const PINS = [{ sid: 'hero-title', label: 'Old', text: 'make it bigger' }];

function newRun() {
  const runId = workspace.createRun();
  workspace.writeVersion(runId, 1, { 'index.html': '<h1 data-sid="hero-title">Old</h1>' });
  return runId;
}

// A fake AI agent: edits the new version's page through the real tool runner.
function fakeAgent(calls) {
  return async function (model, prompt, runTool) {
    calls.push(prompt);
    runTool({ name: 'edit_file', args: { file_path: 'index.html', old_text: 'Old', new_text: 'New ' + calls.length } });
    return calls.length === 1 ? '- Made the title bigger' : '- Linked the order button to the menu';
  };
}

// A fake QA: the old version always passes; the new one fails `links`
// for the first `failures` checks.
function fakeQa(failures) {
  let newChecks = 0;
  return async function (options) {
    let linksOk = true;
    if (!options.url.includes('/v1/')) {
      newChecks++;
      linksOk = newChecks > failures;
    }
    return {
      checks: [
        { id: 'links', label: 'every button and link goes somewhere', ok: linksOk, detail: linksOk ? '' : '#order does not exist' },
        { id: 'phone', label: 'fits on a phone screen', ok: true, detail: '' },
      ],
      shots: { desktop: path.join(options.shotsDir, 'desktop.png'), phone: path.join(options.shotsDir, 'phone.png') },
    };
  };
}

async function run(runId, failures, agentCalls) {
  const events = [];
  const shipped = await ship.shipRun({
    runId: runId,
    pins: PINS,
    model: {},
    baseUrl: 'http://localhost:1',
    onEvent: function (e) { events.push(e); },
    agent: fakeAgent(agentCalls),
    qa: fakeQa(failures),
  });
  return { events: events, shipped: shipped };
}

test('ship applies the notes in v2, catches a QA failure, fixes it and passes', async () => {
  const runId = newRun();
  const calls = [];
  const result = await run(runId, 1, calls);
  const types = result.events.map(function (e) { return e.type; });

  const checks = result.events.filter(function (e) { return e.type === 'qa_check' && e.check.id === 'links'; });
  assert.deepStrictEqual(checks.map(function (e) { return e.check.ok; }), [false, true]);
  assert.ok(types.indexOf('qa_fix') > types.indexOf('qa_check'));
  assert.strictEqual(types[types.length - 1], 'shipped');

  assert.strictEqual(result.shipped.version, 2);
  assert.strictEqual(result.shipped.previewUrl, workspace.previewUrl(runId, 2));
  assert.strictEqual(result.shipped.beforeUrl, workspace.previewUrl(runId, 1));
  assert.deepStrictEqual(result.shipped.summary.changes, ['Made the title bigger', 'Linked the order button to the menu']);
  assert.ok(result.shipped.summary.tests.every(function (c) { return c.ok; }));

  // v1 is never touched; v2 has both edits.
  assert.strictEqual(fs.readFileSync(path.join(workspace.versionDir(runId, 1), 'index.html'), 'utf8'), '<h1 data-sid="hero-title">Old</h1>');
  assert.match(fs.readFileSync(path.join(workspace.versionDir(runId, 2), 'index.html'), 'utf8'), /New 1/);
  assert.match(calls[0], /make it bigger/);
  assert.match(calls[1], /#order/);
});

test('ship gives up fixing after 2 rounds and still reports what failed', async () => {
  const runId = newRun();
  const calls = [];
  const result = await run(runId, 99, calls);
  assert.strictEqual(calls.length, 3); // the edit + 2 fix rounds
  const links = result.shipped.summary.tests.find(function (c) { return c.id === 'links'; });
  assert.strictEqual(links.ok, false);
});

test('a second ship on the same run makes v3 from v2', async () => {
  const runId = newRun();
  await run(runId, 0, []);
  const second = await run(runId, 0, []);
  assert.strictEqual(second.shipped.version, 3);
  assert.strictEqual(second.shipped.beforeUrl, workspace.previewUrl(runId, 2));
});
