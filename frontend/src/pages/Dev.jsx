import { useEffect, useState } from 'react';
import KeyPanel from '../editor/KeyPanel';
import { fileToBase64, postStream } from '../lib/stream';

// Bare test page — no design on purpose. Each feature adds a section here so
// we can try it before the real editor exists. Open it at /dev.

// The order sections appear on the page.
const TYPES = ['hero', 'marquee', 'highlight', 'items', 'story', 'visit', 'cta'];

// 'hero-split' -> 'hero'
function typeOf(id) {
  return id.split('-')[0];
}

// Tailwind removes the browser's default look from buttons and inputs, so
// on this bare page we give them plain borders to tell them apart.
const DEV_STYLES = `
  .dev-page h1 { font-size: 22px; font-weight: bold; margin-bottom: 12px; }
  .dev-page h2 { font-size: 16px; font-weight: bold; margin: 28px 0 10px; padding-top: 14px; border-top: 3px solid #000; }
  .dev-page p { margin: 8px 0; }
  .dev-page button { border: 2px solid #000; border-radius: 4px; padding: 3px 10px; background: #e8e8e8; cursor: pointer; }
  .dev-page button:hover { background: #c8e0ff; }
  .dev-page button:disabled { opacity: 0.4; cursor: not-allowed; }
  .dev-page input, .dev-page select { border: 1px solid #555; border-radius: 3px; padding: 2px 6px; background: #fffbe6; }
  .dev-page input[type=file] { background: none; border: 1px dashed #555; }
  .dev-page a { color: #0645ad; text-decoration: underline; }
  .dev-page ol { list-style: decimal; padding-left: 24px; }
  .dev-page summary { cursor: pointer; text-decoration: underline; }
`;

export default function Dev() {
  // useState gives back two things in a list: the current value, and a
  // function to change it. Calling a setter re-draws the page.
  const [catalog, setCatalog] = useState({ themes: [], sections: [] });
  const [theme, setTheme] = useState('hearth');
  const [samples, setSamples] = useState([]); // e.g. [{ id: 'plumber', label: 'Plumber' }, ...]
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
    // The kinds of business we can test with (bakery, plumber, dentist, ...).
    fetch('/api/dev/samples')
      .then(function (res) { return res.json(); })
      .then(function (body) { setSamples(body); });
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
    <div className="dev-page" style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16, fontFamily: 'monospace' }}>
      <style>{DEV_STYLES}</style>
      <h1>ShipIt dev page</h1>

      <AiSettings />

      <PhotoBuild />

      <Replays />

      <h2>Feature 3 — sections</h2>
      <p>
        Business:{' '}
        <select value={sample} onChange={function (e) { setSample(e.target.value); loadAutoLayout(e.target.value); }}>
          {samples.map(function (s) {
            return <option key={s.id} value={s.id}>{s.label}</option>;
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

// Feature 5: upload a photo, watch the build stream in, see the site.
function PhotoBuild() {
  const [file, setFile] = useState(null);
  const [sentence, setSentence] = useState('');
  const [events, setEvents] = useState([]);
  const [building, setBuilding] = useState(false);

  async function build() {
    setBuilding(true);
    setEvents([]);
    const imageBase64 = await fileToBase64(file);
    const seen = [];
    await postStream('/api/build', { imageBase64: imageBase64, mimeType: file.type, sentence: sentence }, function (event) {
      seen.push(event);
      setEvents(seen.slice()); // a new array, so React re-draws
    });
    setBuilding(false);
  }

  let built = null;
  let business = null;
  for (const event of events) {
    if (event.type === 'built') built = event;
    if (event.type === 'extracted') business = event.business;
  }

  return (
    <div>
      <h2>Feature 5 — photo to site</h2>
      <p>
        photo: <input type="file" accept="image/*" onChange={function (e) { setFile(e.target.files[0] || null); }} />{' '}
        one line about it (optional):{' '}
        <input value={sentence} placeholder="family bakery since 1987" onChange={function (e) { setSentence(e.target.value); }} />{' '}
        <button onClick={build} disabled={!file || building}>{building ? 'building…' : 'build site'}</button>
      </p>
      <ol>
        {events.map(function (event, i) {
          let detail = event.message || event.runId || event.previewUrl || '';
          if (event.type === 'extracted') detail = event.business.name + ' — ' + event.business.items.length + ' items, vibe ' + event.business.vibe;
          return <li key={i}>{event.type}: {detail}</li>;
        })}
      </ol>
      {business ? <details><summary>what the AI read</summary><pre>{JSON.stringify(business, null, 2)}</pre></details> : null}
      {built ? (
        <div>
          <p>layout: {built.layout.theme} — {built.layout.sections.join(', ')} — <a href={built.previewUrl} target="_blank" rel="noreferrer">open</a></p>
          <iframe title="built site" src={built.previewUrl} style={{ width: '100%', height: 600, border: '1px solid #000' }} />
        </div>
      ) : null}
    </div>
  );
}

// Feature 12: the stage backup. Every recorded run, with a link that plays it
// back in the real editor (no AI key, no internet needed).
function Replays() {
  const [runs, setRuns] = useState(null);

  useEffect(function () {
    fetch('/api/replay')
      .then(function (res) { return res.json(); })
      .then(setRuns)
      .catch(function () { setRuns([]); });
  }, []);

  return (
    <div>
      <h2>Feature 12 — replay a recorded run</h2>
      <p><a href="/try?replay=latest">▶ replay the latest run</a></p>
      {runs === null ? <p>loading...</p> : null}
      {runs && runs.length === 0 ? <p>No recordings yet. Build a site on /try first.</p> : null}
      <ol>
        {(runs || []).map(function (run) {
          return (
            <li key={run.runId}>
              <a href={'/try?replay=' + run.runId}>{run.name}</a> — {run.ships.length} ship{run.ships.length === 1 ? '' : 's'}, {new Date(run.when).toLocaleString()}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Feature 4b: bring your own key. The same panel the editor uses.
function AiSettings() {
  return (
    <div style={{ marginBottom: 16 }}>
      <h2>Feature 4b — AI settings (your own key)</h2>
      <KeyPanel />
    </div>
  );
}
