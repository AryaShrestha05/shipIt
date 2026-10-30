import { postStream } from '../lib/stream';
import { aiHeaders } from '../lib/aiSettings';

// Every call the editor makes to the backend, in one place.

// Photo in, website out. onEvent gets each live step (see editorReducer.js).
export function build(request, onEvent, signal) {
  return postStream('/api/build', {
    imageBase64: request.imageBase64,
    mimeType: request.mimeType,
    sentence: request.sentence,
  }, onEvent, signal);
}

// A voice clip in, text out. Throws with a readable message if it fails.
export async function transcribe(clip) {
  const headers = aiHeaders();
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
