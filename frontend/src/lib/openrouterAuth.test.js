import { describe, expect, it } from 'vitest';
import { base64url, challengeFor, signInUrl, readCallback, exchangeCode } from './openrouterAuth';

describe('base64url', function () {
  it('uses - and _ and drops the = padding', function () {
    expect(base64url(new Uint8Array([251, 255, 191]))).toBe('-_-_');
    expect(base64url(new Uint8Array([1]))).toBe('AQ');
  });
});

describe('challengeFor', function () {
  it('matches the example in the PKCE standard (RFC 7636)', async function () {
    const challenge = await challengeFor('dBjftJeZ4CVP-mB92K27uhbUJU1p1r_wW1gFWFOEjXk');
    expect(challenge).toBe('E9Melhoa2OwvFrEMTJguCHaoeK1t8URWbuGJSstw-cM');
  });
});

describe('signInUrl', function () {
  it('sends the person to OpenRouter with where to come back to', function () {
    const url = new URL(signInUrl({ callbackUrl: 'https://shipit.app/try', challenge: 'abc', state: 'xyz' }));
    expect(url.origin + url.pathname).toBe('https://openrouter.ai/auth');
    expect(url.searchParams.get('callback_url')).toBe('https://shipit.app/try');
    expect(url.searchParams.get('code_challenge')).toBe('abc');
    expect(url.searchParams.get('code_challenge_method')).toBe('S256');
    expect(url.searchParams.get('state')).toBe('xyz');
  });
});

describe('readCallback', function () {
  it('reads the code OpenRouter sends back', function () {
    expect(readCallback('?code=c123&state=xyz')).toEqual({ code: 'c123', state: 'xyz' });
  });

  it('is null on a normal visit', function () {
    expect(readCallback('')).toBe(null);
    expect(readCallback('?theme=zest')).toBe(null);
  });
});

describe('exchangeCode', function () {
  it('swaps the code for the person\'s key, straight with OpenRouter', async function () {
    const calls = [];
    function fakeFetch(url, init) {
      calls.push({ url: url, init: init });
      return Promise.resolve({ ok: true, json: function () { return Promise.resolve({ key: 'sk-or-v1-abc' }); } });
    }
    const key = await exchangeCode({ code: 'c123', verifier: 'v456' }, fakeFetch);
    expect(key).toBe('sk-or-v1-abc');
    expect(calls[0].url).toBe('https://openrouter.ai/api/v1/auth/keys');
    expect(calls[0].init.method).toBe('POST');
    expect(JSON.parse(calls[0].init.body)).toEqual({ code: 'c123', code_verifier: 'v456', code_challenge_method: 'S256' });
  });

  it('explains a failed sign-in in plain words', async function () {
    function fakeFetch() { return Promise.resolve({ ok: false, status: 403, json: function () { return Promise.resolve({}); } }); }
    await expect(exchangeCode({ code: 'old', verifier: 'v' }, fakeFetch)).rejects.toThrow(/expired|try again/i);
  });
});
