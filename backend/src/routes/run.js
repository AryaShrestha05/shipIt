const express = require('express');
const { runOnce } = require('../agent/runner');

const router = express.Router();

// POST /api/run — streams agent events as Server-Sent Events.
//
// Why SSE: the agent takes 30-90s. A plain res.json(...) would leave the
// browser blank until it's done. SSE keeps the HTTP connection open and
// writes each event the instant it happens, so the UI fills in live.
router.post('/run', async (req, res) => {
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt is required' });
  }

  // SSE headers — tell the browser: "this is a stream, stay open"
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const send = (event) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  try {
    await runOnce(prompt, send);
  } catch (err) {
    send({ type: 'error', message: err.message });
  } finally {
    res.end();
  }
});

module.exports = router;
