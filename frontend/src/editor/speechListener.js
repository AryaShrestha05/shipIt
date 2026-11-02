// Turns speech into text with the browser's own speech engine (Chrome, Edge,
// Safari). Free, no AI key, and words appear while you talk.
//
//   const listener = createSpeechListener();
//   if (listener.available) {
//     listener.start({ onLive: function (text) { ... } }); // called as words arrive
//     const text = await listener.stop();                  // the final words, or ''
//   }
//
// deps.Recognition is only swapped out in tests.
export function createSpeechListener(deps) {
  if (!deps) deps = {};
  // Chrome still calls it webkitSpeechRecognition.
  let Recognition = null;
  if ('Recognition' in deps) Recognition = deps.Recognition;
  else if (typeof window !== 'undefined') Recognition = window.SpeechRecognition || window.webkitSpeechRecognition || null;

  let recognition = null;
  let heard = '';
  let ended = false;
  let error = '';
  let onEnd = null;

  function start(options) {
    heard = '';
    ended = false;
    error = '';
    recognition = new Recognition();
    recognition.lang = 'en-US';
    recognition.continuous = true; // keep listening through short pauses
    recognition.interimResults = true; // send guesses before it's sure, so text shows live

    recognition.onresult = function (event) {
      // event.results holds everything heard so far; join it into one line.
      let text = '';
      for (let i = 0; i < event.results.length; i++) text += event.results[i][0].transcript;
      heard = text.trim();
      options.onLive(heard);
    };
    recognition.onerror = function (event) {
      error = event.error; // e.g. 'not-allowed' when the mic is blocked
    };
    recognition.onend = function () {
      ended = true;
      if (onEnd) onEnd();
    };
    recognition.start();
  }

  // Stops listening and gives back what was heard.
  function stop() {
    return new Promise(function (resolve) {
      if (!recognition || ended) return resolve(heard);
      onEnd = function () { resolve(heard); };
      recognition.stop(); // the engine calls onend once it has finished the last words
    });
  }

  return {
    available: Boolean(Recognition),
    start: start,
    stop: stop,
    lastError: function () { return error; },
  };
}
