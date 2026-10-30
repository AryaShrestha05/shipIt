import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import './Blocks.css';

// The building-blocks gallery: every theme and section ShipIt can build a
// site from, each shown live. "Pro" blocks are marked for a future paid plan.

const FILTERS = ['all', 'free', 'pro'];
const PREVIEW_WIDTH = 1280; // the size each block is drawn at before shrinking

export default function Blocks() {
  const [catalog, setCatalog] = useState(null);
  const [theme, setTheme] = useState('hearth');
  const [filter, setFilter] = useState('all');

  useEffect(function () {
    fetch('/api/blocks')
      .then(function (res) { return res.json(); })
      .then(function (body) { setCatalog(body); });
  }, []);

  if (!catalog) return <div className="blocks-page" />;

  const sections = catalog.sections.filter(function (block) {
    return filter === 'all' || block.tier === filter;
  });
  const types = new Set(catalog.sections.map(function (block) { return block.type; }));

  return (
    <div className="blocks-page">
      <nav className="blocks-nav">
        <Link to="/" className="blocks-brand">shipit.</Link>
        <Link to="/dev" className="blocks-link">try it →</Link>
      </nav>

      <header className="blocks-hero">
        <p className="blocks-kicker">the building blocks</p>
        <h1 className="blocks-title">BLOCKS.</h1>
        <p className="blocks-lede">
          every shipit site is put together from hand-made pieces. no two businesses get the same site.
        </p>
        <p className="blocks-stats">
          {catalog.sections.length} blocks · {types.size} kinds · {catalog.themes.length} themes · thousands of combinations
        </p>
      </header>

      <section className="blocks-themes">
        <p className="blocks-label">theme</p>
        <div className="blocks-theme-row">
          {catalog.themes.map(function (t) {
            return (
              <button
                key={t.id}
                className={'blocks-theme' + (t.id === theme ? ' is-active' : '')}
                onClick={function () { setTheme(t.id); }}
              >
                <span className="blocks-theme-name">
                  {t.name} {t.tier === 'pro' ? <ProBadge /> : null}
                </span>
                <span className="blocks-theme-desc">{t.description}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="blocks-filters">
        {FILTERS.map(function (f) {
          return (
            <button
              key={f}
              className={'blocks-chip' + (f === filter ? ' is-active' : '')}
              onClick={function () { setFilter(f); }}
            >
              {f}
            </button>
          );
        })}
      </section>

      <ul className="blocks-grid">
        {sections.map(function (block) {
          const src = '/api/blocks/preview/' + theme + '/index.html?section=' + block.id;
          return (
            <li key={block.id} className="blocks-card">
              <a href={src} target="_blank" rel="noreferrer" className="blocks-preview">
                <ScaledFrame src={src} title={block.name} />
              </a>
              <div className="blocks-card-body">
                <div className="blocks-card-top">
                  <h2 className="blocks-card-name">{block.name}</h2>
                  {block.tier === 'pro' ? <ProBadge /> : <span className="blocks-free">free</span>}
                </div>
                <p className="blocks-card-desc">{block.description}</p>
                <p className="blocks-card-type">{block.type}</p>
              </div>
            </li>
          );
        })}
      </ul>

      <footer className="blocks-footer">
        <span>pro blocks will be part of a paid plan. today, every block is free to try.</span>
      </footer>
    </div>
  );
}

function ProBadge() {
  return <span className="blocks-pro">pro</span>;
}

// Draws a page at full desktop width, then shrinks it to fit the card.
function ScaledFrame(props) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.3);

  useEffect(function () {
    const box = boxRef.current;
    const watcher = new ResizeObserver(function () {
      setScale(box.clientWidth / PREVIEW_WIDTH);
    });
    watcher.observe(box);
    return function () { watcher.disconnect(); };
  }, []);

  return (
    <div ref={boxRef} className="blocks-frame-box">
      <iframe
        title={props.title}
        src={props.src}
        loading="lazy"
        tabIndex={-1}
        className="blocks-frame"
        style={{ width: PREVIEW_WIDTH, height: PREVIEW_WIDTH * 0.75, transform: 'scale(' + scale + ')' }}
      />
    </div>
  );
}
