import { describe, expect, test } from 'vitest';
import { setupStep, themeFromSearch } from './setupStep';

describe('setupStep', function () {
  test('no AI connected: connecting comes first, before anything else', function () {
    expect(setupStep({ hasDraft: false, keyHint: '', theme: '' })).toBe('connect');
    expect(setupStep({ hasDraft: true, keyHint: '', theme: 'ripple' })).toBe('connect');
  });

  test('connected but nothing written yet: the chat box', function () {
    expect(setupStep({ hasDraft: false, keyHint: 'sk-…cdef', theme: 'ripple' })).toBe('compose');
  });

  test('connected and written, but no look: pick a look next', function () {
    expect(setupStep({ hasDraft: true, keyHint: 'sk-…cdef', theme: '' })).toBe('theme');
  });

  test('all three: ready to build', function () {
    expect(setupStep({ hasDraft: true, keyHint: 'sk-…cdef', theme: 'ripple' })).toBe('ready');
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
