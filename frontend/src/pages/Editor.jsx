import { useEffect, useReducer, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { canShip, editorReducer, initialState } from '../editor/editorReducer';
import * as api from '../editor/api';
import { fileToBase64 } from '../lib/stream';
import PhotoDrop from '../editor/PhotoDrop';
import BuildStatus from '../editor/BuildStatus';
import SitePreview from '../editor/SitePreview';
import PinList from '../editor/PinList';
import { attachPicker, drawPins } from '../editor/picker';
import ShipProgress from '../editor/ShipProgress';
import ShipResult from '../editor/ShipResult';
import BeforeAfter from '../editor/BeforeAfter';
import KeyPanel from '../editor/KeyPanel';
import ThemePicker from '../editor/ThemePicker';
import { setupStep, themeFromSearch } from '../editor/setupStep';
import { THEMES } from '../blocks/catalog';
import { loadAiSettings } from '../lib/aiSettings';
import './Editor.css';

// /try — the ShipIt editor. One page that changes with state.stage:
//   photo    → three setup steps first (see setupStep.js):
//                1 key   → KeyPanel (an AI key is required)
//                2 theme → ThemePicker (a look is required)
//                3 photo → PhotoDrop
//   building → BuildStatus
//   editing  → the site + the side rail with your notes (pins)
//   shipping → the site + live progress and customer tests
//   done     → before/after slider + "what I changed and tested"

const fade = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -16, filter: 'blur(8px)' },
  transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
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
  const [keyOpen, setKeyOpen] = useState(false); // is the "Your AI key" panel open?
  const [keyHint, setKeyHint] = useState(loadAiSettings().keyHint); // e.g. "sk-…cdef", or '' for no key
  // The picked look. ?theme=ripple (from the landing page) picks it in advance.
  const location = useLocation(); // the current address, e.g. /try?theme=ripple
  const [theme, setTheme] = useState(themeFromSearch(location.search));
  // /try?replay=latest plays a recorded run instead (the stage backup): no key or look needed.
  const replayId = new URLSearchParams(location.search).get('replay') || '';
  const step = replayId ? 'photo' : setupStep({ keyHint: keyHint, theme: theme });
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

  async function startBuild(choice) {
    dispatch({ type: 'BUILD_START' });
    // Lets "start over" cancel this request halfway.
    const controller = new AbortController();
    stopRef.current = controller;
    try {
      const imageBase64 = await fileToBase64(choice.file);
      await api.build({ imageBase64: imageBase64, mimeType: choice.file.type, sentence: choice.sentence, theme: theme }, function (event) {
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
    dispatch({ type: 'RESET' });
  }

  const name = state.business ? state.business.name : '';

  return (
    <div className="ed-page">
      <nav className="ed-nav">
        <Link to="/" className="ed-brand">shipit.</Link>
        <span className="ed-nav-name">{name}</span>
        <span className="ed-nav-right">
          {/* Shows "sk-…cdef" when a key is saved, so you can tell at a glance. */}
          <button className="ed-link ed-key-btn" onClick={function () { setKeyOpen(!keyOpen); }}>
            {keyHint ? '🔒 ' + keyHint : 'add AI key'}
          </button>
          {state.stage !== 'photo' ? <button className="ed-link" onClick={startOver}>start over</button> : <Link to="/blocks" className="ed-link">blocks</Link>}
        </span>
      </nav>

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
        {state.stage === 'photo' && step === 'key' ? (
          <Motion.main key="step-key" className="ed-center" {...fade}>
            <div className="ed-photo">
              <p className="ed-kicker">step 1 of 3</p>
              <h1 className="ed-headline">Add your AI key.</h1>
              <p className="ed-lede">ShipIt is free: it runs on your own Gemini, OpenAI or Claude key. It's encrypted and stays on this device.</p>
              <KeyPanel onChange={function (settings) { setKeyHint(settings.keyHint); }} />
            </div>
          </Motion.main>
        ) : null}

        {state.stage === 'photo' && step === 'theme' ? (
          <Motion.main key="step-theme" className="ed-center" {...fade}>
            <div className="ed-setup-wide">
              <p className="ed-kicker">step 2 of 3</p>
              <h1 className="ed-headline">Pick a look.</h1>
              <p className="ed-lede">Your site is built in this style. You can change anything afterwards by clicking and talking.</p>
              <ThemePicker value={theme} onPick={setTheme} />
            </div>
          </Motion.main>
        ) : null}

        {state.stage === 'photo' && step === 'photo' ? (
          <Motion.main key="step-photo" className="ed-center" {...fade}>
            <PhotoDrop onBuild={startBuild} error={state.error} look={themeName} onChangeLook={function () { setTheme(''); }} />
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
              {state.stage === 'done' ? (
                <BeforeAfter before={state.result.shots.before} after={state.result.shots.after} />
              ) : (
                <SitePreview
                  src={state.previewUrl}
                  width={width}
                  label={name.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com · v' + state.version}
                  onLoad={setSiteDoc}
                />
              )}
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
