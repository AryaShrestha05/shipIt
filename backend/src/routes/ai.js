const express = require('express');
const fromRequest = require('../ai/fromRequest');

// POST /api/ai/check — the settings panel's "test my key" button.
// Makes one tiny request with the user's key and says whether it worked.
//
// deps.aiFromRequest is only swapped out in tests.
function createAiRouter(deps) {
  if (!deps) deps = {};
  const aiFromRequest = deps.aiFromRequest || fromRequest.aiFromRequest;
  const router = express.Router();

  router.post('/ai/check', async function (req, res) {
    let ai;
    try {
      ai = aiFromRequest(req);
    } catch (err) {
      return res.status(err instanceof fromRequest.NoKeyError ? 401 : 400).json({ ok: false, error: err.message });
    }

    try {
      // The cheapest possible test: ask the AI to say OK.
      const chat = ai.chatModel({ system: 'Reply with the single word OK.' }).startChat();
      await chat.sendMessage('Say OK.');
      res.json({ ok: true, provider: ai.provider, model: ai.model, canTranscribe: ai.canTranscribe });
    } catch (err) {
      res.json({ ok: false, error: err.message });
    }
  });

  return router;
}

module.exports = { createAiRouter: createAiRouter };
