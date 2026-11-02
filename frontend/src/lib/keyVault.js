// Keeps the user's AI key encrypted on this device.
//
// Why encrypt and not hash: a hash can never be turned back into the key,
// but we have to send the real key to OpenAI / Gemini / Claude. Encryption
// can be undone, but only with the lock.
//
// How it works:
//   - The browser makes a "lock" (an AES-256-GCM key) the first time.
//   - The lock is non-extractable: code can use it, but nothing can read
//     it or copy it out of the browser.
//   - The AI key is saved scrambled. DevTools shows bytes, not "sk-...".
//   - It is unscrambled only at the moment a request is sent.
//
// Limit: this stops someone reading the key out of storage. It cannot stop
// harmful code running inside the page itself — nothing in a browser can.

const ALGORITHM = 'AES-GCM';

// deps lets tests swap in a pretend store. The real app uses IndexedDB,
// the only browser storage that can hold a lock without exposing it.
export function createKeyVault(deps) {
  if (!deps) deps = {};
  const webCrypto = deps.crypto || globalThis.crypto;
  const store = deps.store || indexedDbStore();

  // The lock, made once and then reused.
  async function getLock() {
    const existing = await store.get('lock');
    if (existing) return existing;
    // false = non-extractable: the lock can never leave the browser.
    const lock = await webCrypto.subtle.generateKey({ name: ALGORITHM, length: 256 }, false, ['encrypt', 'decrypt']);
    await store.set('lock', lock);
    return lock;
  }

  async function save(secret) {
    const lock = await getLock();
    // A fresh random starting value (iv) every save, so the same key never
    // scrambles to the same bytes twice.
    const iv = webCrypto.getRandomValues(new Uint8Array(12));
    const data = await webCrypto.subtle.encrypt({ name: ALGORITHM, iv: iv }, lock, new TextEncoder().encode(secret));
    await store.set('secret', { iv: iv, data: data });
  }

  // The key as text, or '' if there isn't one or it can't be unlocked.
  async function load() {
    try {
      const box = await store.get('secret');
      const lock = await store.get('lock');
      if (!box || !lock) return '';
      const plain = await webCrypto.subtle.decrypt({ name: ALGORITHM, iv: box.iv }, lock, box.data);
      return new TextDecoder().decode(plain);
    } catch {
      // Damaged data, blocked storage, or a lock from another browser.
      return '';
    }
  }

  function remove() {
    return store.remove('secret');
  }

  return { save: save, load: load, remove: remove };
}

// IndexedDB (a small database inside the browser) wrapped as get / set / remove.
function indexedDbStore() {
  const DB_NAME = 'shipit';
  const TABLE = 'vault';

  function open() {
    return new Promise(function (resolve, reject) {
      const request = window.indexedDB.open(DB_NAME, 1);
      // First time only: create the table.
      request.onupgradeneeded = function () { request.result.createObjectStore(TABLE); };
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  // Runs one action on the table and waits for it to finish.
  async function run(mode, action) {
    const db = await open();
    return new Promise(function (resolve, reject) {
      const table = db.transaction(TABLE, mode).objectStore(TABLE);
      const request = action(table);
      request.onsuccess = function () { resolve(request.result); };
      request.onerror = function () { reject(request.error); };
    });
  }

  return {
    get: function (name) { return run('readonly', function (t) { return t.get(name); }); },
    set: function (name, value) { return run('readwrite', function (t) { return t.put(value, name); }); },
    remove: function (name) { return run('readwrite', function (t) { return t.delete(name); }); },
  };
}
