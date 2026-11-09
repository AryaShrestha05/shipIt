import { useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { canShip, editorReducer, initialState } from '../editor/editorReducer';
import * as api from '../editor/api';
import { fileToBase64 } from '../lib/stream';
import Composer from '../editor/Composer';
import BuildStatus from '../editor/BuildStatus';
import SitePreview from '../editor/SitePreview';
import PinList from '../editor/PinList';
import { attachPicker, drawPins } from '../editor/picker';
import ShipProgress from '../editor/ShipProgress';
import ShipResult from '../editor/ShipResult';
import KeyPanel from '../editor/KeyPanel';
import ConnectAI from '../editor/ConnectAI';
import { readCallback, finishSignIn } from '../lib/openrouterAuth';
import ThemePicker from '../editor/ThemePicker';
import { setupStep, themeFromSearch } from '../editor/setupStep';
import { THEMES } from '../blocks/catalog';
import { loadAiSettings, providerInfo, saveAiSettings, saveApiKey } from '../lib/aiSettings';
import { useColorMode } from '../lib/colorMode';
import SiteNav from '../components/SiteNav';
import './Editor.css';

// /try — the ShipIt editor. One page that changes with state.stage:
//   photo    → the setup first (see setupStep.js):
//                connect → ConnectAI: Sign in with OpenRouter, or paste a key (first)
//                compose → Composer: an AI-chat-style box, words + a photo
//                theme   → ThemePicker (only if no look is picked yet)
//                then the build starts by itself
//   building → BuildStatus
//   editing  → the site + the side rail with your notes (pins)
//   shipping → the site + live progress and customer tests
//   done     → the changed site + "what I changed and tested"

// Screens simply fade into each other: quick and calm, no sliding or blur.
const fade = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.25, ease: 'easeOut' },
};

export default function Editor() {
  // state = everything the editor knows. dispatch({ type: ... }) asks editorReducer to change it.
  const [state, dispatch] = useReducer(editorReducer, initialState);
  // useState: a value React remembers between redraws, plus the function that changes it.
  const [width, setWidth] = useState('desktop');
  const stopRef = useRef(null); // lets "start over" cancel a build in progress
  const [siteDoc, setSiteDoc] = useState(null); // the website's page inside the iframe
  const [focusId, setFocusId] = useState(null); // which note gets the cursor
  const pinsRef = useRef(state.pins);
  const colorMode = useColorMode(); // light or dark, shared by every page
  const [keyOpen, setKeyOpen] = useState(false); // is the "Your AI key" panel open?
  const [keyHint, setKeyHint] = useState(loadAiSettings().keyHint); // e.g. "sk-…cdef", or '' for no key
  // The picked look. ?theme=ripple (from the landing page) picks it in advance.
  const location = useLocation(); // the current address, e.g. /try?theme=ripple
  const navigate = useNavigate();
  // Coming back from "Sign in with OpenRouter": the address ends in ?code=…
  const [connecting, setConnecting] = useState(Boolean(readCallback(location.search)));
  const [connectError, setConnectError] = useState('');
  const signInHandledRef = useRef(false); // React's dev mode runs effects twice; finish only once
  const [theme, setTheme] = useState(themeFromSearch(location.search));
  // /try?replay=latest plays a recorded run instead (the stage backup): no key or look needed.
  const replayId = new URLSearchParams(location.search).get('replay') || '';
  // draft: what the owner sent from the chat box, { file, sentence }, or null.
  const [draft, setDraft] = useState(null);
  const [lastDraft, setLastDraft] = useState(null); // the last message sent, so "edit" can bring it back
  const step = replayId ? 'replay' : setupStep({ hasDraft: Boolean(draft), keyHint: keyHint, theme: theme });
  const themeName = theme ? THEMES.find(function (t) { return t.id === theme; }).name : '';

  // The picker is attached once per page load, so it reads the latest pins
  // from this ref instead of from a stale copy.
  useEffect(function () {
    const before = pinsRef.current;
    pinsRef.current = state.pins;
    // A pin was just added: put the cursor in its box.
    if (state.pins.length > before.length) setFocusId(state.pins[state.pins.length - 1].id);
  }, [state.pins]);

  // While editing, clicks on the site drop pins.
  useEffect(function () {
    // useEffect runs after React draws, and again whenever siteDoc or the stage changes.
    // What it returns (detach) is called to clean up before the next run.
    if (!siteDoc || state.stage !== 'editing') return undefined;
    return attachPicker(siteDoc, {
      onPick: function (pick) {
        const existing = pinsRef.current.find(function (pin) { return pin.sid === pick.sid; });
        if (existing) {
          // Same part clicked again: go back to its note instead of adding a second.
          setFocusId(null);
          setTimeout(function () { setFocusId(existing.id); }, 0);
          return;
        }
        dispatch({ type: 'ADD_PIN', sid: pick.sid, rect: pick.rect, label: pick.label });
      },
    });
  }, [siteDoc, state.stage]);

  // Keep the numbered dots on the site in sync with the notes, and redraw
  // them when the page changes size (e.g. switching to phone view).
  useEffect(function () {
    if (!siteDoc) return undefined;
    const win = siteDoc.defaultView;
    function redraw() { drawPins(siteDoc, state.pins); }
    redraw();
    win.addEventListener('resize', redraw);
    return function () { win.removeEventListener('resize', redraw); };
  }, [siteDoc, state.pins]);

  // Replay mode: play the recording through the same screens as a live run.
  useEffect(function () {
    if (!replayId) return undefined;
    const controller = new AbortController();
    stopRef.current = controller;
    dispatch({ type: 'BUILD_START' });
    api.replay(replayId, function (event) {
      dispatch({ type: 'SSE_EVENT', event: event });
    }, controller.signal).catch(function () {
      // Stopped by "start over" or by leaving the page: nothing to do.
    });
    return function () { controller.abort(); };
  }, [replayId]);

  // Back from OpenRouter with ?code=…: swap it for the person's key, save it
  // encrypted like a pasted key, and clean the code out of the address bar.
  useEffect(function () {
    const callback = readCallback(location.search);
    if (!callback || signInHandledRef.current) return;
    signInHandledRef.current = true;
    finishSignIn(callback)
      .then(async function (key) {
        await saveApiKey('openrouter', key);
        saveAiSettings({ provider: 'openrouter', model: providerInfo('openrouter').defaultModel });
        setKeyHint(loadAiSettings().keyHint);
      })
      .catch(function (err) { setConnectError(err.message); })
      .finally(function () {
        setConnecting(false);
        navigate('/try', { replace: true });
      });
  }, [location.search, navigate]);

  // Builds as soon as all three are there: the chat message, a key and a look.
  // Called after each of them is given, with the newest values.
  function buildIfReady(next) {
    if (next.draft && next.keyHint && next.theme) startBuild(next.draft, next.theme);
  }

  function onSend(newDraft) {
    setLastDraft(newDraft);
    setDraft(newDraft);
    buildIfReady({ draft: newDraft, keyHint: keyHint, theme: theme });
  }

  function onKeySaved(settings) {
    setKeyHint(settings.keyHint);
    buildIfReady({ draft: draft, keyHint: settings.keyHint, theme: theme });
  }

  function onPickLook(id) {
    setTheme(id);
    buildIfReady({ draft: draft, keyHint: keyHint, theme: id });
  }

  async function startBuild(choice, look) {
    dispatch({ type: 'BUILD_START' });
    // Lets "start over" cancel this request halfway.
    const controller = new AbortController();
    stopRef.current = controller;
    try {
      const imageBase64 = await fileToBase64(choice.file);
      await api.build({ imageBase64: imageBase64, mimeType: choice.file.type, sentence: choice.sentence, theme: look }, function (event) {
        // Every live event from the server goes into the reducer.
        dispatch({ type: 'SSE_EVENT', event: event });
      }, controller.signal);
    } catch (err) {
      if (err.name !== 'AbortError') dispatch({ type: 'SSE_EVENT', event: { type: 'error', message: err.message } });
    }
  }

  async function startShip() {
    dispatch({ type: 'SHIP_START' });
    const controller = new AbortController();
    stopRef.current = controller;
    try {
      await api.ship({ runId: state.runId, pins: state.pins }, function (event) {
        dispatch({ type: 'SSE_EVENT', event: event });
      }, controller.signal);
      dispatch({ type: 'SHIP_ENDED' }); // only does something if it never finished
    } catch (err) {
      if (err.name !== 'AbortError') dispatch({ type: 'SSE_EVENT', event: { type: 'error', message: err.message } });
    }
  }

  function startOver() {
    if (stopRef.current) stopRef.current.abort();
    setSiteDoc(null);
    setDraft(null);
    setLastDraft(null);
    dispatch({ type: 'RESET' });
  }

  const name = state.business ? state.business.name : '';


  return (
    <div className="ed-page app" data-mode={colorMode.mode}>
      <SiteNav colorMode={colorMode} title={name}>
        {/* Shows which AI is connected (e.g. "🔒 OpenRouter"); opens the key panel. */}
        <button className="ed-link ed-key-btn" title={keyHint} onClick={function () { setKeyOpen(!keyOpen); }}>
          {keyHint ? '🔒 ' + providerInfo(loadAiSettings().provider).name : 'Connect AI'}
        </button>
        {state.stage !== 'photo' ? <button className="ed-link" onClick={startOver}>start over</button> : null}
      </SiteNav>

      {keyOpen ? (
        <div className="ed-key-pop">
          <KeyPanel
            onClose={function () { setKeyOpen(false); }}
            onChange={function (settings) { setKeyHint(settings.keyHint); }}
          />
        </div>
      ) : null}

      {/* AnimatePresence lets the old screen fade out before the new one fades in. */}
      <AnimatePresence mode="wait">
        {/* One screen per stage. cond ? (screen) : null means "show this screen only if cond". */}
        {state.stage === 'photo' && (step === 'compose' || step === 'ready') ? (
          <Motion.main key="step-compose" className="ed-center" {...fade}>
            {/* 'ready' only shows here after a failed build: the message is kept, send again. */}
            <Composer
              initial={draft || lastDraft}
              error={state.error}
              look={themeName}
              onChangeLook={function () { setTheme(''); }}
              onSend={onSend}
            />
          </Motion.main>
        ) : null}

        {state.stage === 'photo' && step === 'connect' ? (
          <Motion.main key="step-connect" className="ed-center" {...fade}>
            <ConnectAI onConnected={onKeySaved} connecting={connecting} error={connectError} />
          </Motion.main>
        ) : null}

        {state.stage === 'photo' && step === 'theme' ? (
          <Motion.main key="step-theme" className="ed-center" {...fade}>
            <div className="ed-setup-wide">
              <DraftRecap draft={draft} onEdit={function () { setDraft(null); }} />
              <p className="ed-kicker">last step</p>
              <h1 className="ed-headline">Pick a look.</h1>
              <p className="ed-lede">Your site is built in this style as soon as you pick. You can change anything afterwards by clicking and talking.</p>
              <ThemePicker value={theme} onPick={onPickLook} />
            </div>
          </Motion.main>
        ) : null}

        {state.stage === 'building' ? (
          <Motion.main key="building" className="ed-center" {...fade}>
            <BuildStatus lines={state.statusLines} business={state.business} />
          </Motion.main>
        ) : null}

        {/* editing, shipping and done share one workspace, so the site doesn't reload between them */}
        {state.stage === 'editing' || state.stage === 'shipping' || state.stage === 'done' ? (
          <Motion.main key="workspace" className="ed-workspace" {...fade}>
            <section className="ed-stage">
              {/* After Ship, previewUrl is the new version, so the owner sees the changed site straight away. */}
              <SitePreview
                src={state.previewUrl}
                width={width}
                label={name.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com · v' + state.version}
                onLoad={setSiteDoc}
              />

            </section>

            <aside className="ed-rail">
              {state.stage === 'editing' ? (
                <>
                  <div className="ed-rail-block">
                    <p className="ed-kicker">view</p>
                    <div className="ed-toggle">
                      <button className={width === 'desktop' ? 'is-active' : ''} onClick={function () { setWidth('desktop'); }}>Desktop</button>
                      <button className={width === 'phone' ? 'is-active' : ''} onClick={function () { setWidth('phone'); }}>Phone</button>
                    </div>
                  </div>
                  <div className="ed-rail-block ed-rail-grow">
                    <p className="ed-kicker">your notes{state.pins.length ? ' · ' + state.pins.length : ''}</p>
                    <PinList
                      pins={state.pins}
                      focusId={focusId}
                      onChange={function (id, text) { dispatch({ type: 'UPDATE_PIN', id: id, text: text }); }}
                      onRemove={function (id) { dispatch({ type: 'REMOVE_PIN', id: id }); }}
                    />
                  </div>
                  {state.error ? <p className="ed-error">{state.error}</p> : null}
                  <button className="ed-btn ed-btn-primary ed-ship" disabled={!canShip(state)} onClick={startShip}>
                    Ship {state.pins.length > 1 ? state.pins.length + ' changes' : ''} <span className="ed-btn-icon">↗</span>
                  </button>
                </>
              ) : null}

              {state.stage === 'shipping' ? (
                <div className="ed-rail-block ed-rail-grow">
                  <ShipProgress log={state.shipLog} checks={state.checks} fixRound={state.fixRound} />
                </div>
              ) : null}

              {state.stage === 'done' ? (
                <div className="ed-rail-block ed-rail-grow">
                  <ShipResult
                    result={state.result}
                    onContinue={function () { setSiteDoc(null); dispatch({ type: 'CONTINUE_EDITING' }); }}
                    onViewSite={function () { window.open(state.previewUrl, '_blank', 'noopener'); }}
                  />
                </div>
              ) : null}
            </aside>
          </Motion.main>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

// The message sent from the chat box, shown small at the top of the key
// and look steps (like a chat history), with a way to go back and edit it.
function DraftRecap(props) {
  const file = props.draft ? props.draft.file : null;
  // A temporary link to show the photo, cleaned up when the photo changes.
  const url = useMemo(function () { return file ? URL.createObjectURL(file) : ''; }, [file]);
  useEffect(function () {
    return function () { if (url) URL.revokeObjectURL(url); };
  }, [url]);
  if (!props.draft) return null;
  return (
    <div className="ed-recap">
      {url ? <img src={url} alt="" /> : null}
      <span className="ed-recap-text">{props.draft.sentence || 'Your photo'}</span>
      <button className="ed-link" onClick={props.onEdit}>edit</button>
    </div>
  );
}
