import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeCustomStyle, contrastRatio, accentTextColor } from '../src/blocks/customTheme.js';

test('keeps valid customer fonts and colors', () => {
  assert.deepEqual(normalizeCustomStyle({ headingFont: 'archivo', bodyFont: 'dm-sans', bg: '#112233', ink: '#FAFAFA', accent: '#ABCDEF' }), {
    headingFont: 'archivo', bodyFont: 'dm-sans', bg: '#112233', ink: '#fafafa', accent: '#abcdef',
  });
});
test('invalid CSS values fall back to usable style defaults', () => {
  assert.deepEqual(normalizeCustomStyle({ headingFont: 'bad</style>', bodyFont: null, bg: 'red;display:none', ink: '#fff', accent: '#abcdef</style>' }), {
    headingFont: 'fraunces', bodyFont: 'manrope', bg: '#f4ece1', ink: '#2e1f14', accent: '#b4532a',
  });
  assert.deepEqual(normalizeCustomStyle(null), normalizeCustomStyle({}));
});
test('contrast feedback distinguishes unreadable combinations and chooses button text', () => {
  assert.equal(contrastRatio('#ffffff', '#ffffff'), 1);
  assert.equal(contrastRatio('#ffffff', '#000000'), 21);
  assert.equal(accentTextColor('#ffff00'), '#111111');
  assert.equal(accentTextColor('#000033'), '#ffffff');
});
