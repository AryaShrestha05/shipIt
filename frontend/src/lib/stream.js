import { aiHeaders } from './aiSettings';

// POSTs JSON to a streaming endpoint (like /api/build) and calls onEvent
// for every event the server sends, as soon as it arrives.
//
// The browser's built-in EventSource can only do GET, so we read the
// response body ourselves: the server writes "data: {...}\n\n" per event.
//
// Resolves when the stream ends. A non-stream error (400, 401) comes back
// as one { type: 'error' } event so callers handle every failure the same way.
export async function postStream(url, body, onEvent, signal) {
  const headers = aiHeaders();
  headers['Content-Type'] = 'application/json';
  const res = await fetch(url, { method: 'POST', headers: headers, body: JSON.stringify(body), signal: signal });

  if (!res.ok) {
    let message = 'Request failed (' + res.status + ')';
    try {
      const json = await res.json();
      if (json.error) message = json.error;
    } catch {
      // not JSON — keep the plain message
    }
    onEvent({ type: 'error', message: message });
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const chunk = await reader.read();
    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });
    const parsed = parseSseChunk(buffer);
    buffer = parsed.rest;
    for (const event of parsed.events) onEvent(event);
  }
}

// Text arrives in pieces that don't line up with events. Events end with a
// blank line, so split on that; the last piece may be half an event, so it's
// handed back as `rest` to be joined with the next piece.
export function parseSseChunk(buffer) {
  const parts = buffer.split('\n\n');
  const rest = parts.pop();
  const events = [];
  for (const part of parts) {
    if (!part.startsWith('data: ')) continue;
    try {
      events.push(JSON.parse(part.slice(6)));
    } catch {
      // a broken event is skipped rather than stopping the whole stream
    }
  }
  return { events: events, rest: rest };
}

// Reads a File from an <input type="file"> as base64 text (without the
// "data:image/png;base64," part in front).
export function fileToBase64(file) {
  return new Promise(function (resolve, reject) {
    const reader = new FileReader();
    reader.onload = function () { resolve(String(reader.result).split(',')[1]); };
    reader.onerror = function () { reject(reader.error); };
    reader.readAsDataURL(file);
  });
}
