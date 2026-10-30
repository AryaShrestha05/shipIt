import { useReducer, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { AnimatePresence, motion as Motion } from 'framer-motion';
import { canShip, editorReducer, initialState } from '../editor/editorReducer';
import * as api from '../editor/api';
import { fileToBase64 } from '../lib/stream';
import PhotoDrop from '../editor/PhotoDrop';
import BuildStatus from '../editor/BuildStatus';
import SitePreview from '../editor/SitePreview';
import './Editor.css';

// /try — the ShipIt editor. One page that changes with state.stage:
//   photo    → PhotoDrop
//   building → BuildStatus
//   editing  → the site + the side rail (pins and Ship come next)

const fade = {
  initial: { opacity: 0, y: 24, filter: 'blur(8px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -16, filter: 'blur(8px)' },
  transition: { duration: 0.7, ease: [0.32, 0.72, 0, 1] },
};

export default function Editor() {
  const [state, dispatch] = useReducer(editorReducer, initialState);
  const [width, setWidth] = useState('desktop');
  const stopRef = useRef(null); // lets "start over" cancel a build in progress

  async function startBuild(choice) {
    dispatch({ type: 'BUILD_START' });
    const controller = new AbortController();
    stopRef.current = controller;
    try {
      const imageBase64 = await fileToBase64(choice.file);
      await api.build({ imageBase64: imageBase64, mimeType: choice.file.type, sentence: choice.sentence }, function (event) {
        dispatch({ type: 'SSE_EVENT', event: event });
      }, controller.signal);
    } catch (err) {
      if (err.name !== 'AbortError') dispatch({ type: 'SSE_EVENT', event: { type: 'error', message: err.message } });
    }
  }

  function startOver() {
    if (stopRef.current) stopRef.current.abort();
    dispatch({ type: 'RESET' });
  }

  const name = state.business ? state.business.name : '';

  return (
    <div className="ed-page">
      <nav className="ed-nav">
        <Link to="/" className="ed-brand">shipit.</Link>
        <span className="ed-nav-name">{name}</span>
        {state.stage !== 'photo' ? <button className="ed-link" onClick={startOver}>start over</button> : <Link to="/blocks" className="ed-link">blocks</Link>}
      </nav>

      <AnimatePresence mode="wait">
        {state.stage === 'photo' ? (
          <Motion.main key="photo" className="ed-center" {...fade}>
            <PhotoDrop onBuild={startBuild} error={state.error} />
          </Motion.main>
        ) : null}

        {state.stage === 'building' ? (
          <Motion.main key="building" className="ed-center" {...fade}>
            <BuildStatus lines={state.statusLines} business={state.business} />
          </Motion.main>
        ) : null}

        {state.stage === 'editing' ? (
          <Motion.main key="editing" className="ed-workspace" {...fade}>
            <section className="ed-stage">
              <SitePreview src={state.previewUrl} width={width} label={name.toLowerCase().replace(/[^a-z0-9]+/g, '') + '.com · v' + state.version} />
            </section>
            <aside className="ed-rail">
              <div className="ed-rail-block">
                <p className="ed-kicker">view</p>
                <div className="ed-toggle">
                  <button className={width === 'desktop' ? 'is-active' : ''} onClick={function () { setWidth('desktop'); }}>Desktop</button>
                  <button className={width === 'phone' ? 'is-active' : ''} onClick={function () { setWidth('phone'); }}>Phone</button>
                </div>
              </div>
              <div className="ed-rail-block ed-rail-grow">
                <p className="ed-kicker">your notes</p>
                <p className="ed-empty">Click anything on your site and say what to change. Leave as many notes as you like.</p>
              </div>
              <button className="ed-btn ed-btn-primary ed-ship" disabled={!canShip(state)}>
                Ship <span className="ed-btn-icon">↗</span>
              </button>
            </aside>
          </Motion.main>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
