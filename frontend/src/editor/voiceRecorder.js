import { fileToBase64 } from '../lib/stream';

// Records one voice clip from the microphone.
//
//   const recorder = createVoiceRecorder();
//   await recorder.start();          // asks for the mic the first time
//   const clip = await recorder.stop();  // { base64, mimeType } or null
//
// deps.mediaDevices and deps.MediaRecorder are only swapped out in tests.
export function createVoiceRecorder(deps) {
  if (!deps) deps = {};
  const mediaDevices = 'mediaDevices' in deps ? deps.mediaDevices : navigator.mediaDevices;
  const MediaRecorderClass = 'MediaRecorder' in deps ? deps.MediaRecorder : window.MediaRecorder;

  let recorder = null;
  let stream = null;
  let chunks = [];

  async function start() {
    if (!mediaDevices || !MediaRecorderClass) {
      throw new Error("This browser can't use the microphone.");
    }
    try {
      stream = await mediaDevices.getUserMedia({ audio: true });
    } catch {
      throw new Error('The microphone is blocked.');
    }
    chunks = [];
    recorder = new MediaRecorderClass(stream);
    recorder.ondataavailable = function (e) {
      if (e.data && e.data.size > 0) chunks.push(e.data);
    };
    recorder.start();
  }

  function stop() {
    if (!recorder) return Promise.resolve(null);
    const current = recorder;
    recorder = null;

    return new Promise(function (resolve) {
      current.onstop = async function () {
        // Turn the mic off (the browser's "recording" light goes away).
        stream.getTracks().forEach(function (track) { track.stop(); });
        if (chunks.length === 0) return resolve(null);
        const mimeType = (current.mimeType || 'audio/webm').split(';')[0];
        const blob = new Blob(chunks, { type: mimeType });
        resolve({ base64: await fileToBase64(blob), mimeType: mimeType });
      };
      current.stop();
    });
  }

  return { start: start, stop: stop };
}
