// Retrying AI calls that fail for a temporary reason.
//
// Rate limits (429) and overloaded servers (503) are temporary, so wait and
// try again: 800ms, 1.6s, 3.2s... Any other error is a real problem — fail fast.

function isTemporary(err) {
  return /\b(429|503)\b/.test(String(err && err.message));
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// options:
//   retries    — how many times to try again (default 3)
//   baseMs     — first wait in milliseconds, doubles each time (default 800)
//   onFallback — called once if every retry failed; its result is returned (optional)
async function withRetry(fn, options) {
  if (!options) options = {};
  const retries = options.retries === undefined ? 3 : options.retries;
  const baseMs = options.baseMs === undefined ? 800 : options.baseMs;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTemporary(err)) throw err;
      if (attempt >= retries) {
        if (options.onFallback) return options.onFallback();
        throw err;
      }
      await sleep(baseMs * 2 ** attempt);
    }
  }
}

module.exports = { withRetry: withRetry };
