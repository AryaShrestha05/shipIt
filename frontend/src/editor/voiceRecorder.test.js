// @vitest-environment jsdom
import { describe, expect, test } from 'vitest';
import { createVoiceRecorder } from './voiceRecorder';

// A pretend MediaRecorder: hands back one chunk of audio when stopped.
class FakeMediaRecorder {
  constructor(stream) {
    this.stream = stream;
    this.mimeType = 'audio/webm';
  }
  start() {}
  stop() {
    this.ondataavailable({ data: new Blob(['hi'], { type: 'audio/webm' }) });
    this.onstop();
  }
}

function fakeStream() {
  const track = { stopped: false, stop: function () { track.stopped = true; } };
  return { track: track, getTracks: function () { return [track]; } };
}

describe('createVoiceRecorder', function () {
  test('a blocked microphone fails with a plain message', async function () {
    const recorder = createVoiceRecorder({
      mediaDevices: { getUserMedia: function () { return Promise.reject(new Error('NotAllowedError')); } },
      MediaRecorder: FakeMediaRecorder,
    });
    await expect(recorder.start()).rejects.toThrow(/microphone/i);
  });

  test('a browser with no microphone support fails with a plain message', async function () {
    const recorder = createVoiceRecorder({ mediaDevices: null, MediaRecorder: null });
    await expect(recorder.start()).rejects.toThrow(/microphone/i);
  });

  test('records, then gives back the audio as base64 and releases the mic', async function () {
    const stream = fakeStream();
    const recorder = createVoiceRecorder({
      mediaDevices: { getUserMedia: function () { return Promise.resolve(stream); } },
      MediaRecorder: FakeMediaRecorder,
    });
    await recorder.start();
    const clip = await recorder.stop();
    expect(clip.mimeType).toBe('audio/webm');
    expect(clip.base64).toBe(btoa('hi'));
    expect(stream.track.stopped).toBe(true);
  });

  test('stop without start gives nothing', async function () {
    const recorder = createVoiceRecorder({ mediaDevices: null, MediaRecorder: null });
    expect(await recorder.stop()).toBe(null);
  });
});
