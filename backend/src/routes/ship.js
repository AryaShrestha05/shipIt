const express = require('express');
const fs = require('fs');
const path = require('path');
const fromRequest = require('../ai/fromRequest');
const workspace = require('../workspace/workspace');
const recorder = require('../runs/recorder');
const tools = require('../agent/tools');
const ship = require('../ship/ship');
const prompts = require('../ship/prompts');
const sse = require('./sse');

// POST /api/ship — apply all the owner's notes, test, fix, report.
//
// Body: { runId, pins: [{ sid, label, text }] }
// Streams: status, step, qa_check, qa_fix, warning, then shipped (or error).
// 400 = bad request, 401 = no AI key, 409 = this site is already shipping.
//
// deps.aiFromRequest and deps.shipRun are only swapped out in tests.

// Runs that are shipping right now. Two Ships at once on the same site would
// both write the same next version.
const shipping = new Set();

function createShipRouter(deps) {
  if (!deps) deps = {};
  const aiFromRequest = deps.aiFromRequest || fromRequest.aiFromRequest;
  const shipRun = deps.shipRun || ship.shipRun;
  const router = express.Router();

  router.post('/ship', async function (req, res) {
    const body = req.body || {};
    const pins = Array.isArray(body.pins) ? body.pins : [];
    if (!workspace.runExists(body.runId)) return res.status(400).json({ error: 'Unknown run' });
    if (pins.length === 0) return res.status(400).json({ error: 'Add at least one note first' });
    const allWritten = pins.every(function (pin) { return pin && pin.sid && typeof pin.text === 'string' && pin.text.trim(); });
    if (!allWritten) return res.status(400).json({ error: 'Every note needs some text' });
    if (shipping.has(body.runId)) return res.status(409).json({ error: 'This site is already shipping' });

    let ai;
    try {
      ai = aiFromRequest(req);
    } catch (err) {
      return res.status(err instanceof fromRequest.NoKeyError ? 401 : 400).json({ error: err.message });
    }

    const runId = body.runId;
    shipping.add(runId);
    const stream = sse.openSse(res);
    const to = workspace.latestVersion(runId) + 1;
    const rec = recorder.createRecorder(runId, 'ship-' + to);
    function send(event) {
      rec.record(event);
      stream.send(event);
    }

    try {
      await shipRun({
        runId: runId,
        pins: pins.map(function (pin) { return { sid: pin.sid, label: String(pin.label || ''), text: pin.text }; }),
        model: ai.chatModel({ system: prompts.SHIP_SYSTEM, tools: tools.toolDeclarations }),
        // QA opens the site on this same server, at the port it's listening on.
        baseUrl: 'http://localhost:' + req.socket.localPort,
        onEvent: send,
        signal: stream.signal,
      });
      // Keep the shipped version and its screenshots with the recording, for replay.
      const versionDir = workspace.versionDir(runId, to);
      if (fs.existsSync(versionDir)) fs.cpSync(versionDir, path.join(rec.dir, 'v' + to), { recursive: true });
      const shots = path.join(workspace.WORKSPACES_DIR, runId, 'shots');
      if (fs.existsSync(shots)) fs.cpSync(shots, path.join(rec.dir, 'shots'), { recursive: true });
    } catch (err) {
      send({ type: 'error', message: err.message });
    } finally {
      shipping.delete(runId);
      rec.save();
      res.end();
    }
  });

  return router;
}

module.exports = { createShipRouter: createShipRouter };
