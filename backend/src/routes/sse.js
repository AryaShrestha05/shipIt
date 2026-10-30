// Opens a Server-Sent Events stream on a response.
//
// SSE keeps the HTTP connection open and lets us write one event at a time,
// so the browser can show progress live instead of waiting for the end.
//
// Returns:
//   send(event) — writes one event as a "data: {...}" line
//   signal      — an AbortSignal that fires if the browser tab goes away,
//                 so long jobs can stop instead of running for nobody
function openSse(res) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  const controller = new AbortController();
  res.on('close', function () { controller.abort(); });

  function send(event) {
    if (res.writableEnded) return;
    res.write('data: ' + JSON.stringify(event) + '\n\n');
  }

  return { send: send, signal: controller.signal };
}

module.exports = { openSse: openSse };
