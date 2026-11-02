import { THEMES } from '../blocks/catalog';

// Before the photo, /try needs two things, in this order:
//   1. 'key'   — an AI key saved on this device
//   2. 'theme' — a look picked from the gallery
//   3. 'photo' — both done: drop the photo
// Nobody can skip ahead: no key always means the key step.
export function setupStep(options) {
  if (!options.keyHint) return 'key';
  if (!options.theme) return 'theme';
  return 'photo';
}

// "?theme=bloom" -> 'bloom', so a look picked on the landing page carries over.
// Unknown names give '' (pick again).
export function themeFromSearch(search) {
  const id = new URLSearchParams(search).get('theme');
  const known = THEMES.some(function (theme) { return theme.id === id; });
  if (known) return id;
  return '';
}
