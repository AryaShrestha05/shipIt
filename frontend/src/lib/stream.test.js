import { describe, expect, test } from 'vitest';
import { parseSseChunk } from './stream';

describe('parseSseChunk', function () {
  test('returns finished events and keeps a half-received one for later', function () {
    const result = parseSseChunk('data: {"a":1}\n\ndata: {"b"');
    expect(result.events).toEqual([{ a: 1 }]);
    expect(result.rest).toBe('data: {"b"');
  });

  test('skips lines that are not data and events that are not valid JSON', function () {
    const result = parseSseChunk(': ping\n\ndata: {oops}\n\ndata: {"ok":true}\n\n');
    expect(result.events).toEqual([{ ok: true }]);
    expect(result.rest).toBe('');
  });
});
