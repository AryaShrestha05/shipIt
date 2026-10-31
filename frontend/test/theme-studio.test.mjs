import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeStudioTheme, studioPreset, safeImage, readThemeLibrary, saveThemeLibrary, upsertTheme, saveStudioDraft, readStudioDraft } from '../src/blocks/studio/themeModel.js';
import { readBackgroundImage } from '../src/blocks/studio/uploadBackground.js';

test('studio controls normalize bounds, invalid styles, colors and image URLs', () => {
  const value = normalizeStudioTheme({ headingSize: 900, bodySize: 0, columns: Infinity, buttonStyle: 'bad', light: { bg: 'red;}' }, image: 'https://external/image.png' });
  assert.equal(value.headingSize, 144); assert.equal(value.bodySize, 12); assert.equal(value.columns, 2);
  assert.equal(value.buttonStyle, 'filled'); assert.equal(value.light.bg, '#f7f7f2'); assert.equal(value.image, '');
  assert.equal(safeImage('data:image/svg+xml;base64,YWJj'), '');
  assert.equal(safeImage('data:image/png;base64,YWJj'), 'data:image/png;base64,YWJj');
});
test('presets have distinct styling and switching modes preserves both palettes', () => {
  const presets = ['minimalist','pastel','modern','colorful'].map(studioPreset);
  assert.equal(new Set(presets.map(value => JSON.stringify(value))).size, 4);
  const theme = normalizeStudioTheme({ light: { bg: '#abcdef' }, dark: { bg: '#112233' } });
  const dark = normalizeStudioTheme({ ...theme, mode: 'dark' });
  assert.equal(dark.light.bg, '#abcdef'); assert.equal(dark.dark.bg, '#112233');
});
test('create, reload, edit and switch saved themes without duplicating an edited theme', () => {
  let text = null;
  const storage = { getItem: () => text, setItem: (key, value) => { text = value; } };
  let library = upsertTheme({ themes: [], activeId: null }, { id: 'one', name: 'My studio', settings: studioPreset('pastel') });
  library = upsertTheme(library, { id: 'two', name: 'Night studio', settings: studioPreset('modern') });
  saveThemeLibrary(storage, library);
  assert.equal(readThemeLibrary(storage).themes.length, 2);
  library = upsertTheme(readThemeLibrary(storage), { id: 'one', name: 'Renamed studio', settings: { ...studioPreset('pastel'), image: 'data:image/png;base64,YWJj' } });
  saveThemeLibrary(storage, library);
  const restored = readThemeLibrary(storage);
  assert.equal(restored.activeId, 'one'); assert.equal(restored.themes.length, 2);
  assert.equal(restored.themes.find(theme => theme.id === 'one').settings.image, 'data:image/png;base64,YWJj');
  assert.throws(() => upsertTheme(library, { id: 'three', name: ' ', settings: {} }), /name/);
});
test('storage failures are surfaced, rather than claiming a theme was saved', () => {
  assert.throws(() => saveThemeLibrary({ setItem() { throw new Error('Quota exceeded'); } }, { themes: [], activeId: null }), /Quota/);
  assert.throws(() => readThemeLibrary({ getItem: () => '{broken' }));
});
test('background uploads reject unsupported files and oversized images before decoding', async () => {
  await assert.rejects(readBackgroundImage({ type: 'image/svg+xml', size: 100 }), /JPG, PNG or WebP/);
  await assert.rejects(readBackgroundImage({ type: 'image/jpeg', size: 11 * 1024 * 1024 }), /10 MB/);
});
test('unsaved settings and uploaded background survive route exits, and a saved draft can be cleared', () => {
  let text = null;
  const storage = { getItem: () => text, setItem: (key,value) => { text = value; }, removeItem: () => { text = null; } };
  saveStudioDraft(storage, { activeId: 'existing', name: 'Work in progress', settings: { ...studioPreset('pastel'), image: 'data:image/png;base64,YWJj', headingSize: 120 } });
  const draft = readStudioDraft(storage);
  assert.equal(draft.name, 'Work in progress'); assert.equal(draft.activeId, 'existing');
  assert.equal(draft.settings.headingSize, 120); assert.equal(draft.settings.image, 'data:image/png;base64,YWJj');
  saveStudioDraft(storage, null);
  assert.equal(readStudioDraft(storage), null);
});
