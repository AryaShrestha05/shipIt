import { describe, expect, test } from 'vitest';
import { createKeyVault } from './keyVault';

// A pretend storage box that keeps everything in memory, so the tests can
// look inside it. The real vault uses the browser's IndexedDB.
function memoryStore() {
  const items = {};
  return {
    items: items,
    get: function (name) { return Promise.resolve(items[name]); },
    set: function (name, value) { items[name] = value; return Promise.resolve(); },
    remove: function (name) { delete items[name]; return Promise.resolve(); },
  };
}

const SECRET = 'sk-test-1234567890abcdef';

describe('createKeyVault', function () {
  test('gives back the same key that was saved', async function () {
    const vault = createKeyVault({ store: memoryStore() });
    await vault.save(SECRET);
    expect(await vault.load()).toBe(SECRET);
  });

  test('never stores the key as readable text', async function () {
    const store = memoryStore();
    const vault = createKeyVault({ store: store });
    await vault.save(SECRET);
    const box = store.items.secret;
    const stored = new TextDecoder().decode(box.data);
    expect(stored).not.toContain(SECRET);
    expect(JSON.stringify(store.items)).not.toContain(SECRET);
  });

  test('the lock cannot be copied out of the browser', async function () {
    const store = memoryStore();
    const vault = createKeyVault({ store: store });
    await vault.save(SECRET);
    expect(store.items.lock.extractable).toBe(false);
  });

  test('saving twice scrambles differently each time', async function () {
    const store = memoryStore();
    const vault = createKeyVault({ store: store });
    await vault.save(SECRET);
    const first = new Uint8Array(store.items.secret.iv).join(',');
    await vault.save(SECRET);
    const second = new Uint8Array(store.items.secret.iv).join(',');
    expect(first).not.toBe(second);
  });

  test('nothing saved means an empty key', async function () {
    const vault = createKeyVault({ store: memoryStore() });
    expect(await vault.load()).toBe('');
  });

  test('a removed key is gone', async function () {
    const vault = createKeyVault({ store: memoryStore() });
    await vault.save(SECRET);
    await vault.remove();
    expect(await vault.load()).toBe('');
  });

  test('damaged data gives an empty key instead of crashing', async function () {
    const store = memoryStore();
    const vault = createKeyVault({ store: store });
    await vault.save(SECRET);
    store.items.secret.data = new Uint8Array([1, 2, 3]).buffer;
    expect(await vault.load()).toBe('');
  });
});
