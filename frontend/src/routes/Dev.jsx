import { useEffect, useState } from 'react';

// Bare test page — no design on purpose. Each feature adds a section here so
// we can try it before the real editor exists. Open it at /dev.

// The order sections appear on the page.
const TYPES = ['hero', 'marquee', 'highlight', 'items', 'story', 'visit', 'cta'];
const SAMPLES = ['bakery', 'salon'];

// 'hero-split' -> 'hero'
function typeOf(id) {
  return id.split('-')[0];
}

export default function Dev() {
  // useState gives back two things in a list: the current value, and a
  // function to change it. Calling a setter re-draws the page.
  const [catalog, setCatalog] = useState({ themes: [], sections: [] });
  const [theme, setTheme] = useState('hearth');
  const [sample, setSample] = useState('bakery');
  const [chosen, setChosen] = useState({}); // e.g. { hero: 'hero-split', items: 'items-cards' }
  const [width, setWidth] = useState(1280);

  // Ask ShipIt which layout it would pick for this business, and use it.
  function loadAutoLayout(sampleName) {
    fetch('/api/dev/layout?sample=' + sampleName)
      .then(function (res) { return res.json(); })
      .then(function (layout) {
        const next = {};
        for (const id of layout.sections) next[typeOf(id)] = id;
        setChosen(next);
        setTheme(layout.theme);
      });
  }

  // Runs once when the page opens: load the list of sections, then auto-pick.
  useEffect(function () {
    fetch('/api/dev/sections')
      .then(function (res) { return res.json(); })
      .then(function (body) { setCatalog(body); });
    loadAutoLayout('bakery');
  }, []);

  function variantsOf(type) {
    return catalog.sections.filter(function (id) { return typeOf(id) === type; });
  }

  function shuffle() {
    const next = {};
    for (const type of TYPES) {
      const options = variantsOf(type);
      const required = type === 'hero' || type === 'items' || type === 'visit' || type === 'cta';
      if (!required && Math.random() < 0.3) continue;
      next[type] = options[Math.floor(Math.random() * options.length)];
    }
    setChosen(next);
    setTheme(catalog.themes[Math.floor(Math.random() * catalog.themes.length)]);
  }

  const sectionList = TYPES
    .map(function (type) { return chosen[type]; })
    .filter(function (id) { return Boolean(id); });
  const src = '/api/dev/site/' + theme + '/index.html?sample=' + sample + '&sections=' + sectionList.join(',');

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16, fontFamily: 'monospace' }}>
      <h1>ShipIt dev page</h1>

      <h2>Feature 3 — sections</h2>
      <p>
        Business:{' '}
        <select value={sample} onChange={function (e) { setSample(e.target.value); loadAutoLayout(e.target.value); }}>
          {SAMPLES.map(function (id) {
            return <option key={id} value={id}>{id}</option>;
          })}
        </select>{' '}
        Theme:{' '}
        <select value={theme} onChange={function (e) { setTheme(e.target.value); }}>
          {catalog.themes.map(function (id) {
            return <option key={id} value={id}>{id}</option>;
          })}
        </select>{' '}
        <button onClick={function () { loadAutoLayout(sample); }}>auto (ShipIt picks)</button>{' '}
        <button onClick={shuffle}>shuffle</button>
      </p>
      <p>
        {TYPES.map(function (type) {
          return (
            <span key={type}>
              {type}:{' '}
              <select
                value={chosen[type] || ''}
                onChange={function (e) {
                  const next = Object.assign({}, chosen);
                  next[type] = e.target.value;
                  setChosen(next);
                }}
              >
                <option value="">(none)</option>
                {variantsOf(type).map(function (id) {
                  return <option key={id} value={id}>{id}</option>;
                })}
              </select>{' '}
            </span>
          );
        })}
      </p>
      <p>
        Width:{' '}
        <button onClick={function () { setWidth(1280); }}>desktop (1280)</button>{' '}
        <button onClick={function () { setWidth(390); }}>phone (390)</button>{' '}
        <a href={src} target="_blank" rel="noreferrer">open in new tab</a>
      </p>
      <iframe
        title="site preview"
        src={src}
        style={{ width: width, maxWidth: '100%', height: 760, border: '1px solid #000' }}
      />

      <RunVersions />
    </div>
  );
}

// Feature 4: a run keeps every version (v1, v2, ...) as its own folder.
function RunVersions() {
  const [run, setRun] = useState(null); // { runId, versions: [{ version, previewUrl }] }

  function startRun() {
    fetch('/api/dev/run', { method: 'POST' })
      .then(function (res) { return res.json(); })
      .then(function (body) {
        setRun({ runId: body.runId, versions: [body] });
      });
  }

  function nextVersion() {
    fetch('/api/dev/run/' + run.runId + '/next', { method: 'POST' })
      .then(function (res) { return res.json(); })
      .then(function (body) {
        setRun({ runId: run.runId, versions: run.versions.concat([body]) });
      });
  }

  return (
    <div>
      <h2>Feature 4 — runs and versions</h2>
      <p>
        <button onClick={startRun}>start a new run (builds v1)</button>{' '}
        <button onClick={nextVersion} disabled={!run}>copy to next version (adds "(vN)" to the title)</button>
      </p>
      {run ? <p>run id: {run.runId} — older versions should never change</p> : null}
      <div style={{ display: 'flex', gap: 8, overflowX: 'auto' }}>
        {run ? run.versions.map(function (v) {
          return (
            <div key={v.version}>
              <p>v{v.version}: <a href={v.previewUrl} target="_blank" rel="noreferrer">{v.previewUrl}</a></p>
              <iframe title={'v' + v.version} src={v.previewUrl} style={{ width: 480, height: 360, border: '1px solid #000' }} />
            </div>
          );
        }) : null}
      </div>
    </div>
  );
}
