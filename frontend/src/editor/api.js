import { postStream } from '../lib/stream';

// Every call the editor makes to the backend, in one place.

// Photo in, website out. onEvent gets each live step (see editorReducer.js).
export function build(request, onEvent, signal) {
  return postStream('/api/build', {
    imageBase64: request.imageBase64,
    mimeType: request.mimeType,
    sentence: request.sentence,
  }, onEvent, signal);
}
