import { getStream, postStream } from '../lib/stream';
import { aiHeaders } from '../lib/aiSettings';

// Every call the editor makes to the backend, in one place.

// Photo in, website out. onEvent gets each live step (see editorReducer.js).
export function build(request, onEvent, signal) {
  return postStream('/api/build', {
    imageBase64: request.imageBase64,
    mimeType: request.mimeType,
    sentence: request.sentence,
    theme: request.theme, // the look picked in step 2
  }, onEvent, signal);
}

// Every note at once → the site edited, tested and fixed. onEvent gets each
// live step: status, step, qa_check, qa_fix, then shipped (see editorReducer.js).
export function ship(request, onEvent, signal) {
  return postStream('/api/ship', {
    runId: request.runId,
    pins: request.pins.map(function (pin) { return { sid: pin.sid, label: pin.label, text: pin.text }; }),
  }, onEvent, signal);
}

// Plays a recorded run back (runId, or 'latest'). No AI key, no internet
// beyond this computer: the stage backup.
export function replay(runId, onEvent, signal) {
  return getStream('/api/replay/' + encodeURIComponent(runId), onEvent, signal);
}

// A voice clip in, text out. Throws with a readable message if it fails.
export async function transcribe(clip) {
  const headers = await aiHeaders();
  headers['Content-Type'] = 'application/json';
  const res = await fetch('/api/transcribe', {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({ audioBase64: clip.base64, mimeType: clip.mimeType }),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(body.error || 'Transcription failed');
  return body.text;
}
