const express = require('express');
const recorder = require('../runs/recorder');
const replay = require('../runs/replay');
const sse = require('./sse');

// GET /api/replay           — every recorded run, newest first
// GET /api/replay/:runId    — plays one back as a live stream (runId can be "latest")
//
// The stream is the build's events, then for each ship:
//   { type: 'replay_ship', pins }  — the notes, so the editor can show them
//   ...that ship's events...
// and finally { type: 'replay_done' }.
// ?speed=2 plays twice as fast; ?speed=0 sends everything at once (tests).

// Waits `ms` milliseconds, or stops early if the browser left.
function wait(ms, signal) {
  return new Promise(function (resolve) {
    if (ms <= 0 || signal.aborted) return resolve();
    const timer = setTimeout(resolve, ms);
    signal.addEventListener('abort', function () { clearTimeout(timer); resolve(); });
  });
}

function createReplayRouter() {
  const router = express.Router();

  router.get('/replay', function (req, res) {
    res.json(replay.listRecordings());
  });

  router.get('/replay/:runId', async function (req, res) {
    let runId = req.params.runId;
    const all = replay.listRecordings();
    if (runId === 'latest' && all.length > 0) runId = all[0].runId;
    const run = all.find(function (r) { return r.runId === runId; });
    if (!run) return res.status(404).json({ error: 'No recording for ' + runId });

    let speed = 1;
    if (req.query.speed !== undefined) speed = Number(req.query.speed);
    if (!(speed >= 0)) speed = 1; // not a number: real time

    replay.restoreRun(runId);
    const stream = sse.openSse(res);

    // Sends a recording's events with its original timing.
    async function play(entries) {
      const gaps = replay.playbackGaps(entries, speed);
      for (let i = 0; i < entries.length; i++) {
        await wait(gaps[i], stream.signal);
        if (stream.signal.aborted) return;
        stream.send(entries[i].event);
      }
    }

    await play(recorder.loadRecording(runId, 'build'));
    for (const version of run.ships) {
      const entries = recorder.loadRecording(runId, 'ship-' + version);
      // The first entry of a ship recording holds its notes (see routes/ship.js).
      const notes = entries.length && entries[0].event.type === 'pins' ? entries[0].event.pins : [];
      await wait(speed === 0 ? 0 : 2500 / speed, stream.signal); // a moment to look at the site first
      stream.send({ type: 'replay_ship', pins: notes });
      await play(entries.filter(function (entry) { return entry.event.type !== 'pins'; }));
    }
    stream.send({ type: 'replay_done' });
    res.end();
  });

  return router;
}

module.exports = { createReplayRouter: createReplayRouter };
