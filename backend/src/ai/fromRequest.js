const providers = require('./providers');

// Builds the AI for one request from the user's own key.
//
// The browser sends three headers with every request:
//   x-shipit-provider: gemini | openai | claude
//   x-shipit-key:      the user's API key
//   x-shipit-model:    optional model name
//
// The key is used for this request only. It is never saved or logged.
// With no key sent, we fall back to the server's own GEMINI_API_KEY
// (that's what the stage demo uses).

class NoKeyError extends Error {
  constructor() {
    super('No AI key. Add your Gemini, OpenAI or Claude key in settings.');
    this.name = 'NoKeyError';
  }
}

function aiFromRequest(req) {
  const key = req.get('x-shipit-key');
  if (key) {
    return providers.createAI({
      provider: req.get('x-shipit-provider') || 'gemini',
      apiKey: key,
      model: req.get('x-shipit-model') || undefined,
    });
  }

  if (process.env.GEMINI_API_KEY) {
    return providers.createAI({ provider: 'gemini', apiKey: process.env.GEMINI_API_KEY });
  }

  throw new NoKeyError();
}

module.exports = { aiFromRequest: aiFromRequest, NoKeyError: NoKeyError };
