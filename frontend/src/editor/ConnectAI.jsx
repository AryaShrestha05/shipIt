import { useState } from 'react';
import KeyPanel from './KeyPanel';
import { startSignIn } from '../lib/openrouterAuth';

// The first screen on /try: connect an AI before anything else.
//   - Sign in with OpenRouter: one click, no key to copy (lib/openrouterAuth.js)
//   - or paste an API key from Gemini, OpenAI or Claude (KeyPanel)
//
// props.onConnected(settings) → a key was saved
// props.connecting            → true while finishing an OpenRouter sign-in
// props.error                 → why the last sign-in failed, if it did
export default function ConnectAI(props) {
  const [showKey, setShowKey] = useState(false);
  const [leaving, setLeaving] = useState(false); // on our way to openrouter.ai

  function signIn() {
    setLeaving(true);
    // OpenRouter sends them back to /try on this same site (localhost or the real domain).
    startSignIn(window.location.origin + '/try').catch(function () { setLeaving(false); });
  }

  const busy = leaving || props.connecting;

  return (
    <div className="ca">
      <p className="ed-kicker">first, connect your AI</p>
      <h1 className="ed-headline">Connect your AI.</h1>
      <p className="ed-lede">ShipIt runs on your own AI account, so it stays free. Connect once: it's saved, encrypted, on this device only.</p>

      {props.error ? <p className="ed-error">{props.error}</p> : null}

      <button className="ed-btn ed-btn-primary ca-main" onClick={signIn} disabled={busy}>
        {props.connecting ? 'Connecting…' : leaving ? 'Opening OpenRouter…' : 'Sign in with OpenRouter'}
        <span className="ed-btn-icon" aria-hidden="true">↗</span>
      </button>
      <p className="ca-note">
        One account for Claude, Gemini and GPT. You pay OpenRouter directly from your credits, about 1¢ per change.
      </p>

      <div className="ca-or"><span>or</span></div>

      {showKey ? (
        <KeyPanel onChange={props.onConnected} />
      ) : (
        <button className="ed-btn ca-alt" onClick={function () { setShowKey(true); }} disabled={busy}>
          Paste an API key instead
        </button>
      )}
      <p className="ca-note">Already have a Gemini, OpenAI or Claude API key? Use it here.</p>
    </div>
  );
}
