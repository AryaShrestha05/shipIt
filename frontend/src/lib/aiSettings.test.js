// @vitest-environment jsdom
import { beforeEach, describe, expect, test } from 'vitest';
import { aiHeaders, loadAiSettings, maskKey, removeApiKey, saveApiKey, setVault } from './aiSettings';

// Node 25 has its own half-working localStorage that hides jsdom's, so each
// test gets a simple in-memory one. Real browsers are unaffected.
function memoryStorage() {
  const items = {};
  return {
    getItem: function (name) { return name in items ? items[name] : null; },
    setItem: function (name, value) { items[name] = String(value); },
    clear: function () { for (const name in items) delete items[name]; },
    toJSON: function () { return items; },
  };
}

// A pretend vault that remembers one key in memory.
function memoryVault() {
  let secret = '';
  return {
    save: function (value) { secret = value; return Promise.resolve(); },
    load: function () { return Promise.resolve(secret); },
    remove: function () { secret = ''; return Promise.resolve(); },
  };
}

const KEY = 'sk-test-1234567890abcdef';

beforeEach(function () {
  Object.defineProperty(window, 'localStorage', { value: memoryStorage(), configurable: true });
});

describe('aiSettings', function () {
  test('the key goes in the vault, not in plain browser storage', async function () {
    setVault(memoryVault());
    await saveApiKey('openai', KEY);
    expect(JSON.stringify(window.localStorage)).not.toContain(KEY);
    expect(window.localStorage.getItem('shipit.ai')).not.toContain(KEY);
  });

  test('settings show only a masked hint of the key', async function () {
    setVault(memoryVault());
    await saveApiKey('openai', KEY);
    const settings = loadAiSettings();
    expect(settings.provider).toBe('openai');
    expect(settings.keyHint).toBe('sk-…cdef');
    expect(settings.apiKey).toBeUndefined();
  });

  test('requests carry the unlocked key', async function () {
    setVault(memoryVault());
    await saveApiKey('openai', KEY);
    const headers = await aiHeaders();
    expect(headers['x-shipit-key']).toBe(KEY);
    expect(headers['x-shipit-provider']).toBe('openai');
  });

  test('no key means no key headers', async function () {
    setVault(memoryVault());
    expect(await aiHeaders()).toEqual({});
  });

  test('removing the key clears the vault and the hint', async function () {
    setVault(memoryVault());
    await saveApiKey('openai', KEY);
    await removeApiKey();
    expect(await aiHeaders()).toEqual({});
    expect(loadAiSettings().keyHint).toBe('');
  });

  test('a key saved the old plain way moves into the vault', async function () {
    const vault = memoryVault();
    setVault(vault);
    window.localStorage.setItem('shipit.ai', JSON.stringify({ provider: 'gemini', apiKey: KEY, model: '' }));
    const headers = await aiHeaders();
    expect(headers['x-shipit-key']).toBe(KEY);
    expect(await vault.load()).toBe(KEY);
    expect(window.localStorage.getItem('shipit.ai')).not.toContain(KEY);
  });

  test('maskKey shows the start and the last 4 characters only', function () {
    expect(maskKey(KEY)).toBe('sk-…cdef');
    expect(maskKey('short')).toBe('••••');
    expect(maskKey('')).toBe('');
  });
});
