const express = require('express');
const fromRequest = require('../ai/fromRequest');

// POST /api/transcribe — a voice note in, text out.
//
// Body: { audioBase64, mimeType }  →  200 { text }
// 400 = no audio, 401 = no AI key, 502 = the AI couldn't do it (for
// example, Claude can't hear audio). The editor then asks the user to type.
//
// deps.aiFromRequest is only swapped out in tests.
function createTranscribeRouter(deps) {
  if (!deps) deps = {};
  const aiFromRequest = deps.aiFromRequest || fromRequest.aiFromRequest;
  const router = express.Router();

  router.post('/transcribe', async function (req, res) {
    const body = req.body || {};
    if (!body.audioBase64 || typeof body.audioBase64 !== 'string') {
      return res.status(400).json({ error: 'audioBase64 is required' });
    }

    let ai;
    try {
      ai = aiFromRequest(req);
    } catch (err) {
      return res.status(err instanceof fromRequest.NoKeyError ? 401 : 400).json({ error: err.message });
    }

    try {
      const text = await ai.transcribe({ audioBase64: body.audioBase64, mimeType: body.mimeType || 'audio/webm' });
      res.json({ text: text });
    } catch (err) {
      res.status(502).json({ error: err.message });
    }
  });

  return router;
}

module.exports = { createTranscribeRouter: createTranscribeRouter };
