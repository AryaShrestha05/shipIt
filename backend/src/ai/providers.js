const geminiProvider = require('./geminiProvider');
const openaiProvider = require('./openaiProvider');
const claudeProvider = require('./claudeProvider');
const openrouterProvider = require('./openrouterProvider');

// The switchboard: picks the right provider file for the user's choice.
// Every provider gives back the same shape, so the rest of ShipIt never
// needs to know which AI it is talking to:
//
//   ai.chatModel({ system }).startChat().sendMessage(...)  — a chat (the key check in routes/ai.js uses it)
//   ai.extractJson({ system, prompt, imageBase64, mimeType, schema }) — reading a photo
//   ai.transcribe({ audioBase64, mimeType })                     — voice to text
//   ai.canTranscribe                                             — false for Claude and OpenRouter

const PROVIDERS = {
  gemini: geminiProvider,
  openai: openaiProvider,
  claude: claudeProvider,
  openrouter: openrouterProvider, // "Sign in with OpenRouter"
};

// options: provider ('gemini' | 'openai' | 'claude' | 'openrouter'), apiKey, model (optional)
// client is only passed in tests, to swap the real SDK for a fake one.
function createAI(options, client) {
  // Look up the provider file by name, e.g. PROVIDERS['claude'].
  const provider = PROVIDERS[options.provider];
  if (!provider) throw new Error('Unknown AI provider: ' + options.provider);
  return provider.create(options, client);
}

module.exports = {
  PROVIDER_IDS: Object.keys(PROVIDERS),
  createAI: createAI,
};
