import { describe, expect, it } from 'vitest';
import { pickMode, nextMode } from './colorMode';

describe('pickMode', function () {
  it('uses the saved choice first', function () {
    expect(pickMode({ saved: 'light', prefersDark: true })).toBe('light');
    expect(pickMode({ saved: 'dark', prefersDark: false })).toBe('dark');
  });

  it('starts in light mode when nothing valid is saved, even on a dark computer', function () {
    expect(pickMode({ saved: null, prefersDark: true })).toBe('light');
    expect(pickMode({ saved: 'purple', prefersDark: false })).toBe('light');
  });
});

describe('nextMode', function () {
  it('flips between light and dark', function () {
    expect(nextMode('light')).toBe('dark');
    expect(nextMode('dark')).toBe('light');
  });
});
