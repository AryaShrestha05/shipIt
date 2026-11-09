// "Sign in with OpenRouter": the person approves ShipIt on OpenRouter's own
// site and comes back with a key for their OpenRouter account. No copying keys.
//
// It's OpenRouter's official sign-in for apps (OAuth with PKCE):
//   1. startSignIn()  → we make a one-time secret (the "verifier"), keep it in
//                       this tab, and send the person to openrouter.ai with a
//                       scrambled copy of it (the "challenge")
//   2. they approve   → OpenRouter sends them back to /try?code=…
//   3. finishSignIn() → the browser swaps the code + secret for their key,
//                       directly with OpenRouter. Our server never sees it.
// The key is then saved, encrypted, like a pasted key (lib/aiSettings.js).
//
// Docs: https://openrouter.ai/docs/guides/overview/auth/oauth

const AUTH_URL = 'https://openrouter.ai/auth';
const KEYS_URL = 'https://openrouter.ai/api/v1/auth/keys';
const SESSION_KEY = 'shipit.openrouter'; // { verifier, state } while signing in

// Bytes → URL-safe base64 with no "=" padding (what PKCE uses).
export function base64url(bytes) {
  let text = '';
  for (let i = 0; i < bytes.length; i++) text += String.fromCharCode(bytes[i]);
  return btoa(text).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function randomString() {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return base64url(bytes);
}

// The scrambled copy of the secret: SHA-256, then base64url.
export async function challengeFor(verifier) {
  const hash = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier));
  return base64url(new Uint8Array(hash));
}

// options: { callbackUrl, challenge, state }
export function signInUrl(options) {
  const params = new URLSearchParams({
    callback_url: options.callbackUrl,
    code_challenge: options.challenge,
    code_challenge_method: 'S256',
    state: options.state,
  });
  return AUTH_URL + '?' + params.toString();
}

// '?code=…&state=…' → { code, state }, or null on a normal visit.
export function readCallback(search) {
  const params = new URLSearchParams(search);
  const code = params.get('code');
  if (!code) return null;
  return { code: code, state: params.get('state') || '' };
}

// options: { code, verifier }. fetchImpl is only swapped in tests.
export async function exchangeCode(options, fetchImpl) {
  const doFetch = fetchImpl || window.fetch.bind(window);
  const res = await doFetch(KEYS_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code: options.code, code_verifier: options.verifier, code_challenge_method: 'S256' }),
  });
  if (!res.ok) {
    throw new Error('OpenRouter sign-in didn\'t finish (it may have expired). Please try again.');
  }
  const data = await res.json();
  if (!data.key) throw new Error('OpenRouter didn\'t send a key back. Please try again.');
  return data.key;
}

// Step 1: go to OpenRouter. They come back to `callbackUrl` (this page).
export async function startSignIn(callbackUrl) {
  const verifier = randomString();
  const state = randomString();
  window.sessionStorage.setItem(SESSION_KEY, JSON.stringify({ verifier: verifier, state: state }));
  const challenge = await challengeFor(verifier);
  window.location.assign(signInUrl({ callbackUrl: callbackUrl, challenge: challenge, state: state }));
}

// Step 3: back from OpenRouter with ?code=…. Returns their key.
// Checks `state` so a link from somewhere else can't sign someone in.
export async function finishSignIn(callback) {
  let saved = null;
  try {
    saved = JSON.parse(window.sessionStorage.getItem(SESSION_KEY));
  } catch {
    saved = null;
  }
  window.sessionStorage.removeItem(SESSION_KEY); // one use only
  if (!saved || saved.state !== callback.state) {
    throw new Error('That sign-in link didn\'t come from this tab. Please sign in again.');
  }
  return exchangeCode({ code: callback.code, verifier: saved.verifier });
}
