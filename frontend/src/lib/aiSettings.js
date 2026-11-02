import { createKeyVault } from './keyVault';

// The user's AI choice and key, kept on this device only.
//
// Two places:
//   - localStorage 'shipit.ai': the provider, model and a masked hint
//     like "sk-…cdef". Nothing secret.
//   - the key vault (keyVault.js): the real key, encrypted.
//
// Every request to the backend adds the key as headers (see aiHeaders), and
// the backend uses it for that one request without saving it.

const STORAGE_KEY = 'shipit.ai';

// models: what the key panel's Model dropdown offers, cheapest first.
// The first one is the default (the backend uses the same default).
export const PROVIDERS = [
  {
    id: 'gemini', name: 'Gemini', defaultModel: 'gemini-2.5-flash', voice: true,
    models: [
      { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash · fast, cheap' },
      { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro · strongest' },
    ],
  },
  {
    id: 'openai', name: 'OpenAI', defaultModel: 'gpt-5-mini', voice: true,
    models: [
      { id: 'gpt-5-mini', label: 'GPT-5 mini · fast, cheap' },
      { id: 'gpt-5.5', label: 'GPT-5.5 · strongest' },
    ],
  },
  {
    id: 'claude', name: 'Claude', defaultModel: 'claude-haiku-5-5', voice: false,
    models: [
      { id: 'claude-haiku-5-5', label: 'Haiku 5.5 · fastest, under 1¢ a Ship' },
      { id: 'claude-sonnet-5-5', label: 'Sonnet 5.5 · better edits' },
      { id: 'claude-opus-5-5', label: 'Opus 5.5 · strongest, priciest' },
    ],
  },
];

// Made on first use, so pages that never touch the key never open IndexedDB.
let vault = null;
function getVault() {
  if (!vault) vault = createKeyVault();
  return vault;
}

// Tests swap in a pretend vault.
export function setVault(replacement) {
  vault = replacement;
}

// Reads the raw saved settings, or null.
function readStored() {
  try {
    // localStorage = a small storage box in this browser that survives page reloads.
    return JSON.parse(window.localStorage.getItem(STORAGE_KEY));
  } catch {
    // Private windows can block storage.
    return null;
  }
}

function writeStored(settings) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked: settings last until the page is closed.
  }
}

// Returns { provider, model, keyHint }. Never the key itself.
// An empty keyHint means "no key saved: use the server's own key".
export function loadAiSettings() {
  const saved = readStored();
  if (saved && saved.provider) {
    return { provider: saved.provider, model: saved.model || '', keyHint: saved.keyHint || '' };
  }
  return { provider: 'gemini', model: '', keyHint: '' };
}

// Saves the provider and model. The key is saved separately (saveApiKey).
export function saveAiSettings(settings) {
  const current = loadAiSettings();
  writeStored({ provider: settings.provider, model: settings.model || '', keyHint: current.keyHint });
}

// Encrypts and saves the key, and remembers which provider it's for.
export async function saveApiKey(provider, apiKey) {
  await getVault().save(apiKey);
  const current = loadAiSettings();
  writeStored({ provider: provider, model: current.model, keyHint: maskKey(apiKey) });
}

export async function removeApiKey() {
  await getVault().remove();
  const current = loadAiSettings();
  writeStored({ provider: current.provider, model: current.model, keyHint: '' });
}

// "sk-test-1234567890abcdef" -> "sk-…cdef": enough to recognise, not enough to use.
export function maskKey(apiKey) {
  if (!apiKey) return '';
  if (apiKey.length < 12) return '••••';
  return apiKey.slice(0, 3) + '…' + apiKey.slice(-4);
}

// Older versions saved the key as plain text. Move it into the vault and
// wipe the plain copy.
async function moveOldPlainKey() {
  const saved = readStored();
  if (saved && saved.apiKey) {
    await saveApiKey(saved.provider || 'gemini', saved.apiKey);
  }
}

// Headers to send with every backend request. Async because unlocking the
// key takes a moment.
export async function aiHeaders() {
  await moveOldPlainKey();
  const settings = loadAiSettings();
  const apiKey = await getVault().load();
  const headers = {};
  if (apiKey) {
    headers['x-shipit-provider'] = settings.provider;
    headers['x-shipit-key'] = apiKey;
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
