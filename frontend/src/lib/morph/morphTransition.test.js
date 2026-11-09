import { describe, expect, it } from 'vitest';
import { hexToRgb } from './morphTransition';

describe('hexToRgb', function () {
  it('turns a hex colour into 0–1 channels', function () {
    expect(hexToRgb('#ffffff')).toEqual([1, 1, 1]);
    expect(hexToRgb('#05060a')[2]).toBeCloseTo(10 / 255);
  });

  it('accepts the rgb() form browsers give back', function () {
    expect(hexToRgb('rgb(255, 0, 255)')).toEqual([1, 0, 1]);
  });

  it('accepts the short form', function () {
    expect(hexToRgb('#fff')).toEqual([1, 1, 1]);
  });
});
