// The user's AI choice and key, kept in this browser only.
// Every request to the backend adds them as headers (see aiHeaders), and the
// backend uses the key for that one request without saving it.

const STORAGE_KEY = 'shipit.ai';

export const PROVIDERS = [
  { id: 'gemini', name: 'Gemini', defaultModel: 'gemini-2.5-flash', voice: true },
  { id: 'openai', name: 'OpenAI', defaultModel: 'gpt-5.5', voice: true },
  { id: 'claude', name: 'Claude', defaultModel: 'claude-opus-5-5', voice: false },
];

// Returns { provider, apiKey, model }. Missing or unreadable storage gives an
// empty key, which means "use the server's own key".
export function loadAiSettings() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
    if (saved && saved.provider) return saved;
  } catch {
    // Private windows can block storage; fall through to the defaults.
  }
  return { provider: 'gemini', apiKey: '', model: '' };
}

export function saveAiSettings(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked: settings last until the page is closed.
  }
}

// Headers to send with every backend request.
export function aiHeaders() {
  const settings = loadAiSettings();
  const headers = {};
  if (settings.apiKey) {
    headers['x-shipit-provider'] = settings.provider;
    headers['x-shipit-key'] = settings.apiKey;
    if (settings.model) headers['x-shipit-model'] = settings.model;
  }
  return headers;
}

export function providerInfo(id) {
  for (const provider of PROVIDERS) {
    if (provider.id === id) return provider;
  }
  return PROVIDERS[0];
}
