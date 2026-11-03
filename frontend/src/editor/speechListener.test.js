import { describe, expect, test, vi } from 'vitest';
import { createSpeechListener } from './speechListener';

// A pretend browser speech engine. Tests call say() to make it "hear" words.
function fakeEngine() {
  const made = [];
  class FakeRecognition {
    constructor() { made.push(this); this.started = false; }
    start() { this.started = true; }
    stop() { if (this.onend) this.onend(); }
    // isFinal: the engine is sure of these words; false = still guessing.
    say(text, isFinal) {
      const result = [{ transcript: text }];
      result.isFinal = isFinal;
      this.onresult({ resultIndex: 0, results: [result] });
    }
  }
  return { Recognition: FakeRecognition, made: made };
}

describe('createSpeechListener', function () {
  test('is unavailable when the browser has no speech engine', function () {
    expect(createSpeechListener({ Recognition: null }).available).toBe(false);
  });

  test('shows words live while you talk, then gives the final text', async function () {
    const engine = fakeEngine();
    const listener = createSpeechListener({ Recognition: engine.Recognition });
    const live = [];
    listener.start({ onLive: function (text) { live.push(text); } });
    const rec = engine.made[0];
    expect(rec.started).toBe(true);
    expect(rec.interimResults).toBe(true);
    rec.say('make the', false);
    rec.say('make the title bigger', true);
    expect(live).toEqual(['make the', 'make the title bigger']);
    expect(await listener.stop()).toBe('make the title bigger');
  });

  test('nothing said gives empty text', async function () {
    const engine = fakeEngine();
    const listener = createSpeechListener({ Recognition: engine.Recognition });
    listener.start({ onLive: function () {} });
    expect(await listener.stop()).toBe('');
  });

  test('a blocked mic or engine error ends with empty text', async function () {
    const engine = fakeEngine();
    const listener = createSpeechListener({ Recognition: engine.Recognition });
    listener.start({ onLive: function () {} });
    engine.made[0].onerror({ error: 'not-allowed' });
    expect(await listener.stop()).toBe('');
    expect(listener.lastError()).toBe('not-allowed');
  });

  test('stop still finishes if the engine never says it ended', async function () {
    vi.useFakeTimers();
    class SilentRecognition {
      start() {}
      stop() {} // never calls onend
    }
    const listener = createSpeechListener({ Recognition: SilentRecognition });
    listener.start({ onLive: function () {} });
    const stopped = listener.stop();
    vi.advanceTimersByTime(2000);
    await expect(stopped).resolves.toBe('');
    vi.useRealTimers();
  });

  test('an engine that refuses to start fails cleanly and can be used again', async function () {
    class BrokenRecognition {
      start() { throw new Error('InvalidStateError'); }
      stop() {}
    }
    const listener = createSpeechListener({ Recognition: BrokenRecognition });
    expect(function () { listener.start({ onLive: function () {} }); }).toThrow();
    await expect(listener.stop()).resolves.toBe('');
  });
});
