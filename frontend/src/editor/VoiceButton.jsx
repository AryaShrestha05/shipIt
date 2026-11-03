import { useRef, useState } from 'react';
import { createVoiceRecorder } from './voiceRecorder';
import { createSpeechListener } from './speechListener';
import * as api from './api';

const TOO_SHORT_MS = 300; // a quick tap isn't a voice note

// Hold to talk. Let go, and what you said is typed into the note.
// props.onText(text) — the words heard
// props.onLive(text) — the words so far, while still talking ('' when done)
// props.onFail()     — anything went wrong; the note falls back to typing
//
// Two ways to listen, best first:
//   1. the browser's own speech engine (speechListener.js): free, live, works with any AI key
//   2. record a clip and ask the AI to write it down (needs a Gemini or OpenAI key)
export default function VoiceButton(props) {
  const [state, setState] = useState('idle'); // idle | recording | busy
  const recorderRef = useRef(null);
  const listenerRef = useRef(null);
  const startedAtRef = useRef(0);

  function live(text) {
    if (props.onLive) props.onLive(text);
  }

  // Mic button pressed down: start listening.
  async function begin(e) {
    e.preventDefault();
    if (state !== 'idle') return;
    startedAtRef.current = Date.now();

    const listener = createSpeechListener();
    if (listener.available) {
      try {
        listener.start({ onLive: live });
      } catch {
        // The browser wouldn't start listening: fall back to typing.
        props.onFail();
        return;
      }
      listenerRef.current = listener;
      setState('recording');
      return;
    }

    recorderRef.current = createVoiceRecorder();
    setState('recording');
    try {
      await recorderRef.current.start();
    } catch {
      setState('idle');
      recorderRef.current = null;
      props.onFail();
    }
  }

  // Button let go (or the pointer slid off it): stop and use what was heard.
  async function end() {
    const listener = listenerRef.current;
    if (listener) {
      listenerRef.current = null;
      setState('busy');
      const heard = await listener.stop();
      live('');
      setState('idle');
      if (Date.now() - startedAtRef.current < TOO_SHORT_MS) return;
      if (heard) props.onText(heard);
      else props.onFail();
      return;
    }

    const recorder = recorderRef.current;
    if (!recorder) return;
    recorderRef.current = null;
    const clip = await recorder.stop();
    if (!clip || Date.now() - startedAtRef.current < TOO_SHORT_MS) {
      setState('idle');
      return;
    }
    setState('busy');
    try {
      const text = await api.transcribe(clip);
      if (text) props.onText(text);
      else props.onFail();
    } catch {
      props.onFail();
    }
    setState('idle');
  }

  let title = 'Hold to talk';
  if (state === 'recording') title = 'Listening… let go when done';
  if (state === 'busy') title = 'Writing it down…';

  return (
    <button
      type="button"
      className={'ed-mic is-' + state}
      title={title}
      aria-label={title}
      onPointerDown={begin}
      onPointerUp={end}
      onPointerLeave={end}
    >
      {state === 'busy' ? <span className="ed-mic-spin" /> : <MicIcon />}
    </button>
  );
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <rect x="9" y="3" width="6" height="11" rx="3" />
      <path d="M5 11a7 7 0 0 0 14 0M12 18v3" />
    </svg>
  );
}
