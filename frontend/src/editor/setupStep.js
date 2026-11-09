import { THEMES } from '../blocks/catalog';

// What /try asks for before it builds, in this order:
//   1. 'connect' — connect an AI: Sign in with OpenRouter, or paste an API key
//   2. 'compose' — the chat box: a few words about the business + a photo
//   3. 'theme'   — a look (skipped if already picked, e.g. on the landing page)
//   4. 'ready'   — everything's there: build
// options: { hasDraft: true/false, keyHint: 'sk-…cdef' or '', theme: 'ripple' or '' }
export function setupStep(options) {
  if (!options.keyHint) return 'connect';
  if (!options.hasDraft) return 'compose';
  if (!options.theme) return 'theme';
  return 'ready';
}

// "?theme=bloom" -> 'bloom', so a look picked on the landing page carries over.
// Unknown names give '' (pick again).
export function themeFromSearch(search) {
  const id = new URLSearchParams(search).get('theme');
  const known = THEMES.some(function (theme) { return theme.id === id; });
  if (known) return id;
  return '';
}
