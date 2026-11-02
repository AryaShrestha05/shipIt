import { useState } from 'react';
import { PROVIDERS, aiHeaders, loadAiSettings, providerInfo, removeApiKey, saveAiSettings, saveApiKey } from '../lib/aiSettings';
import { createSpeechListener } from './speechListener';
import './KeyPanel.css';

// Chrome, Edge and Safari can turn speech into text themselves, so voice
// works with every provider there, Claude included.
const BROWSER_VOICE = createSpeechListener().available;

// "Your AI key": pick a provider, paste a key, save it encrypted on this
// device. The key is never shown again in full, only as "sk-…cdef".
// onChange(settings) tells the parent the saved settings changed.
export default function KeyPanel(props) {
  const [saved, setSaved] = useState(loadAiSettings());
  const [provider, setProvider] = useState(saved.provider);
  const [model, setModel] = useState(saved.model);
  const [draft, setDraft] = useState(''); // the key being typed; cleared once saved
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);

  const info = providerInfo(provider);

  function refresh() {
    const next = loadAiSettings();
    setSaved(next);
    if (props.onChange) props.onChange(next);
  }

  async function save() {
    // Nothing typed and nothing saved yet: there's no key to save.
    if (!draft.trim() && !saved.keyHint) {
      setStatus('Paste your key first.');
      return;
    }
    setBusy(true);
    try {
      saveAiSettings({ provider: provider, model: model });
      // An empty box keeps the key already saved; only the provider/model change.
      if (draft.trim()) await saveApiKey(provider, draft.trim());
      setDraft('');
      refresh();
      setStatus('Saved. Your key is encrypted on this device.');
    } catch {
      setStatus('Could not save here. Private windows sometimes block storage.');
    }
    setBusy(false);
  }

  async function remove() {
    setBusy(true);
    await removeApiKey();
    refresh();
    setStatus('Key removed from this device.');
    setBusy(false);
  }

  // Ask the server to make one tiny call with this key.
  async function test() {
    setBusy(true);
    setStatus('Checking your key...');
    try {
      const res = await fetch('/api/ai/check', { method: 'POST', headers: await aiHeaders() });
      const body = await res.json();
      if (body.ok) {
        setStatus('Works: ' + body.provider + ' / ' + body.model + (body.canTranscribe || BROWSER_VOICE ? '' : ' (no voice, type your notes)'));
      } else {
        setStatus('That key did not work: ' + body.error);
      }
    } catch {
      setStatus('Could not reach the server.');
    }
    setBusy(false);
  }

  return (
    <div className="kp">
      <div className="kp-head">
        <h3>Your AI key</h3>
        {props.onClose ? <button className="kp-close" onClick={props.onClose} aria-label="Close">×</button> : null}
      </div>

      <label className="kp-field">
        <span>Provider</span>
        <select value={provider} onChange={function (e) { setProvider(e.target.value); setModel(''); }}>
          {PROVIDERS.map(function (p) {
            return <option key={p.id} value={p.id}>{p.name}</option>;
          })}
        </select>
      </label>

      <label className="kp-field">
        <span>Key</span>
        <input
          type="password"
          autoComplete="off"
          value={draft}
          placeholder={saved.keyHint ? 'Saved: ' + saved.keyHint + ' (paste to replace)' : 'Paste your ' + info.name + ' key'}
          onChange={function (e) { setDraft(e.target.value); }}
        />
      </label>

      <label className="kp-field">
        <span>Model</span>
        {/* '' means the provider's default (the first one in the list). */}
        <select value={model || info.defaultModel} onChange={function (e) { setModel(e.target.value === info.defaultModel ? '' : e.target.value); }}>
          {info.models.map(function (m) {
            return <option key={m.id} value={m.id}>{m.label}</option>;
          })}
          {/* A model saved before this list existed stays selectable. */}
          {model && !info.models.some(function (m) { return m.id === model; }) ? <option value={model}>{model}</option> : null}
        </select>
      </label>

      {info.voice || BROWSER_VOICE ? null : <p className="kp-note">{info.name} can't hear voice notes, so you'll type them instead.</p>}

      <div className="kp-actions">
        <button className="kp-primary" onClick={save} disabled={busy}>Save</button>
        <button onClick={test} disabled={busy || !saved.keyHint}>Test</button>
        <button onClick={remove} disabled={busy || !saved.keyHint}>Remove key</button>
      </div>

      {status ? <p className="kp-status">{status}</p> : null}
      <p className="kp-lock">🔒 Encrypted on this device only. Sent straight to {info.name} with your own requests, never saved on our server.</p>
    </div>
  );
}
