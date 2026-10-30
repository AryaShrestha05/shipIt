import { useState } from 'react';

// Bare test page — no design on purpose. Each feature adds a section here so
// we can try it before the real editor exists. Open it at /dev.

const TEMPLATES = ['hearth', 'atelier'];
const SAMPLES = ['bakery', 'salon'];

export default function Dev() {
  // useState gives back two things in a list: the current value, and a
  // function to change it. Calling setTemplate re-draws the page.
  const [template, setTemplate] = useState('hearth');
  const [sample, setSample] = useState('bakery');
  const [width, setWidth] = useState(1280);

  const src = '/api/dev/template/' + template + '/index.html?sample=' + sample;

  return (
    <div style={{ background: '#fff', color: '#000', minHeight: '100vh', padding: 16, fontFamily: 'monospace' }}>
      <h1>ShipIt dev page</h1>

      <h2>Feature 3 — templates</h2>
      <p>
        Template:{' '}
        <select value={template} onChange={function (e) { setTemplate(e.target.value); }}>
          {TEMPLATES.map(function (id) {
            return <option key={id} value={id}>{id}</option>;
          })}
        </select>{' '}
        Business:{' '}
        <select value={sample} onChange={function (e) { setSample(e.target.value); }}>
          {SAMPLES.map(function (id) {
            return <option key={id} value={id}>{id}</option>;
          })}
        </select>{' '}
        Width:{' '}
        <button onClick={function () { setWidth(1280); }}>desktop (1280)</button>{' '}
        <button onClick={function () { setWidth(390); }}>phone (390)</button>{' '}
        <a href={src} target="_blank" rel="noreferrer">open in new tab</a>
      </p>
      <iframe
        title="template preview"
        src={src}
        style={{ width: width, maxWidth: '100%', height: 700, border: '1px solid #000' }}
      />
    </div>
  );
}
