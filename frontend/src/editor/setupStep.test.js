import { describe, expect, test } from 'vitest';
import { setupStep, themeFromSearch } from './setupStep';

describe('setupStep', function () {
  test('no key: the key comes first, even with a theme picked', function () {
    expect(setupStep({ keyHint: '', theme: 'ripple' })).toBe('key');
  });

  test('a key but no look: pick a look next', function () {
    expect(setupStep({ keyHint: 'sk-…cdef', theme: '' })).toBe('theme');
  });

  test('key and look: the photo', function () {
    expect(setupStep({ keyHint: 'sk-…cdef', theme: 'ripple' })).toBe('photo');
  });
});

describe('themeFromSearch', function () {
  test('reads a known theme from ?theme=', function () {
    expect(themeFromSearch('?theme=bloom')).toBe('bloom');
  });

  test('ignores unknown or missing themes', function () {
    expect(themeFromSearch('?theme=nope')).toBe('');
    expect(themeFromSearch('')).toBe('');
  });
});
