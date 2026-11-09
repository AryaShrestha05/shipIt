const openaiSdk = require('openai');
const openaiProvider = require('./openaiProvider');

// OpenRouter: one account that reaches Claude, Gemini, GPT and more.
// People connect it with "Sign in with OpenRouter" on /try (the browser gets
// their key straight from OpenRouter), and pay with their OpenRouter credits.
//
// OpenRouter speaks the same API as OpenAI, so this reuses openaiProvider
// and only changes the address, the default model and the name.

const BASE_URL = 'https://openrouter.ai/api/v1';
// Same price as calling Claude Haiku directly: about 1¢ for a whole Ship.
const DEFAULT_MODEL = 'anthropic/claude-haiku-5.5';

function create(options, client) {
  if (!client) {
    client = new openaiSdk.OpenAI({
      apiKey: options.apiKey,
      baseURL: BASE_URL,
      // Shows "ShipIt" in the person's OpenRouter activity page.
      defaultHeaders: { 'X-Title': 'ShipIt' },
    });
  }
  const ai = openaiProvider.create({ apiKey: options.apiKey, model: options.model || DEFAULT_MODEL }, client);
  return {
    provider: 'openrouter',
    model: ai.model,
    canTranscribe: false, // OpenRouter has no speech-to-text; the browser does voice
    chatModel: ai.chatModel,
    extractJson: ai.extractJson,
    transcribe: ai.transcribe,
  };
}

module.exports = { create: create, DEFAULT_MODEL: DEFAULT_MODEL, BASE_URL: BASE_URL };
