import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { THEMES, BLOCKS } from '../blocks/catalog';
import { createPreview } from '../blocks/preview';
import { sceneMarkup } from '../blocks/scenes';
import CustomThemeControls from '../blocks/CustomThemeControls';
import { DEFAULT_STYLE, normalizeCustomStyle, fontFor } from '../blocks/customTheme';
import '../blocks/scenes.css';
import './Blocks.css';

const FILTERS = ['all', 'free', 'pro'];
const PREVIEW_WIDTH = 1280;

export default function Blocks() {
  const [themeId, setThemeId] = useState('canvas');
  const [customStyle, setCustomStyle] = useState(() => normalizeCustomStyle(DEFAULT_STYLE));
  const [filter, setFilter] = useState('all');
  const [preview, setPreview] = useState(null);
  const theme = THEMES.find(item => item.id === themeId);
  const isPro = block => theme.tier === 'pro' || block.tier === 'pro';
  const blocks = BLOCKS.filter(block => filter === 'all' || (isPro(block) ? 'pro' : 'free') === filter);

  return (
    <div className="blocks-page">
      <nav className="blocks-nav">
        <Link to="/" className="blocks-brand">shipit.</Link>
        <Link to="/dev" className="blocks-link">builder playground ↗</Link>
      </nav>
      <header className="blocks-hero">
        <p className="blocks-kicker">a starting point for something yours</p>
        <h1 className="blocks-title">BLOCKS.</h1>
        <p className="blocks-lede">Find your business’s look. Choose a theme, explore its building blocks, and see how they come together.</p>
        <p className="blocks-stats">{THEMES.length + 1} themes · {BLOCKS.length} templates per theme · endless possibilities</p>
      </header>
      <section className="blocks-themes" aria-labelledby="themes-heading">
        <div className="blocks-section-heading">
          <h2 id="themes-heading" className="blocks-label">01 / choose your theme</h2>
          <span className="blocks-subtle">{THEMES.filter(item => item.tier === 'free').length} free themes + your own Theme Studio. {THEMES.filter(item => item.tier === 'pro').length} expressive Pro styles.</span>
        </div>
        <div className="blocks-theme-row">
          <Link to="/blocks/studio" className="blocks-theme blocks-theme-studio">
            <span className="blocks-theme-art" aria-hidden="true"><span>✳</span></span>
            <span className="blocks-theme-name">Theme Studio<span className="blocks-free">free</span></span>
            <span className="blocks-theme-desc">Build your own theme. Upload a background and customize every detail.</span>
            <span className="blocks-theme-effect">Live preview · layouts · save your themes ↗</span>
          </Link>
          {THEMES.map(item => (
            <button key={item.id} className={'blocks-theme blocks-theme-' + item.id + (item.id === themeId ? ' is-active' : '') + (item.tier === 'pro' ? ' is-pro' : '')}
              aria-pressed={item.id === themeId} onClick={() => { setThemeId(item.id); setFilter('all'); }}>
              <ThemeArtwork theme={item} customization={customStyle} />
              <span className="blocks-theme-name">{item.name}<span className="blocks-theme-badges">{item.fresh && <span className="blocks-new">new</span>}{item.tier === 'pro' ? <ProBadge /> : <span className="blocks-free">free</span>}</span></span>
              <span className="blocks-theme-desc">{item.description}</span>
              <span className="blocks-theme-effect">{item.effect}</span>
              <span className="blocks-palette" aria-hidden="true">{(item.id === 'canvas' ? [customStyle.bg, customStyle.ink, customStyle.accent] : item.colors).map((color, index) => <i key={index} style={{ background: color }} />)}</span>
            </button>
          ))}
        </div>
      </section>
      {themeId === 'canvas' && <CustomThemeControls applied={customStyle} onGenerate={setCustomStyle} />}
      <section className="blocks-collection" aria-labelledby="templates-heading">
        <div className="blocks-section-heading">
          <div><p className="blocks-label">02 / explore the templates</p><h2 id="templates-heading" className="blocks-collection-title">{theme.name} {theme.tier === 'pro' && <ProBadge />}</h2></div>
          <div className="blocks-filters" aria-label="Filter templates">{FILTERS.map(value => <button key={value} className={'blocks-chip' + (value === filter ? ' is-active' : '')} aria-pressed={value === filter} onClick={() => setFilter(value)}>{value}</button>)}</div>
        </div>
        <p className="blocks-template-heading" aria-live="polite">{blocks.length} templates · Click Preview website to explore a complete sample.</p>
      </section>
      <ul className="blocks-grid">
        {blocks.map(block => (
          <li key={block.id} className={'blocks-card' + (isPro(block) ? ' is-pro' : '')} onPointerMove={isPro(block) ? moveSpotlight : undefined} onPointerLeave={resetSpotlight}>
            <button className="blocks-preview" aria-label={'Preview ' + theme.name + ' ' + block.name} onClick={() => setPreview(block)}>
              <ScaledFrame html={createPreview(themeId, block.id, false, customStyle)} title={theme.name + ' ' + block.name} />
              <span className="blocks-preview-hint">Explore template ↗</span>
            </button>
            <div className="blocks-card-body">
              <div className="blocks-card-top"><h3 className="blocks-card-name">{block.name}</h3>{isPro(block) ? <ProBadge /> : <span className="blocks-free">free</span>}</div>
              <p className="blocks-card-desc">{block.description}</p>
              <p className="blocks-card-type">{block.type}</p>
              <button className="blocks-customize" onClick={() => setPreview(block)}>Preview website <span aria-hidden="true">↗</span></button>
            </div>
          </li>
        ))}
      </ul>
      {blocks.length === 0 && <p className="blocks-empty">All templates in {theme.name} are Pro. Choose All or Pro to explore them.</p>}
      <footer className="blocks-footer"><span>Explore every style freely. Pro marks our premium designs.</span><span>Made to make your business feel like you.</span></footer>
      {preview && <PreviewDialog theme={theme} block={preview} customization={customStyle} onClose={() => setPreview(null)} />}
    </div>
  );
}

function ThemeArtwork({ theme, customization }) {
  if (theme.id === 'canvas') return <span className="blocks-theme-art" aria-hidden="true" style={{ background: customization.bg, color: customization.ink, fontFamily: fontFor(customization.headingFont).css }}><span>Aa</span></span>;
  const markup = sceneMarkup(theme.id);
  if (markup) return <span className="blocks-theme-art blocks-scene-art" aria-hidden="true" dangerouslySetInnerHTML={{ __html: markup }} />;
  return <span className="blocks-theme-art" aria-hidden="true"><span>{theme.id === 'noir' ? 'Aa.' : theme.id === 'zest' ? 'HEY!' : theme.id === 'bloom' ? 'Bloom' : 'Aa'}</span></span>;
}

function ProBadge() {
  return <span className="blocks-pro"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m3 6 5 4 4-7 4 7 5-4-2 12H5L3 6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round"/><path d="M5 21h14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/></svg>Pro</span>;
}

// Lightweight local interpretations of React Bits' spotlight and tilt behavior.
function moveSpotlight(event) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches || event.pointerType === 'touch') return;
  const card = event.currentTarget;
  const rect = card.getBoundingClientRect();
  const x = (event.clientX - rect.left) / rect.width;
  const y = (event.clientY - rect.top) / rect.height;
  card.style.setProperty('--spot-x', x * 100 + '%');
  card.style.setProperty('--spot-y', y * 100 + '%');
  card.style.setProperty('--tilt-x', (0.5 - y) * 4 + 'deg');
  card.style.setProperty('--tilt-y', (x - 0.5) * 4 + 'deg');
}
function resetSpotlight(event) {
  event.currentTarget.style.setProperty('--tilt-x', '0deg');
  event.currentTarget.style.setProperty('--tilt-y', '0deg');
}

function ScaledFrame({ html, title }) {
  const boxRef = useRef(null);
  const [scale, setScale] = useState(0.3);
  useEffect(() => {
    const box = boxRef.current;
    const watcher = new ResizeObserver(() => setScale(box.clientWidth / PREVIEW_WIDTH));
    watcher.observe(box);
    return () => watcher.disconnect();
  }, []);
  return <div ref={boxRef} className="blocks-frame-box"><iframe title={title} srcDoc={html} sandbox="" loading="lazy" tabIndex={-1} className="blocks-frame" style={{ width: PREVIEW_WIDTH, height: PREVIEW_WIDTH * 0.75, transform: 'scale(' + scale + ')' }} /></div>;
}

function PreviewDialog({ theme, block, customization, onClose }) {
  const dialogRef = useRef(null);
  const [phone, setPhone] = useState(false);
  const html = useMemo(() => createPreview(theme.id, block.id, true, customization), [theme.id, block.id, customization]);
  useEffect(() => {
    const dialog = dialogRef.current;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.showModal();
    return () => { dialog.close(); document.body.style.overflow = previous; };
  }, []);
  return <dialog ref={dialogRef} className="blocks-dialog" aria-labelledby="preview-title" onCancel={onClose} onClick={event => { if (event.target === event.currentTarget) onClose(); }}>
    <div className="blocks-dialog-shell">
      <header className="blocks-dialog-header"><div><h2 id="preview-title">{theme.name} / {block.name}</h2><p>Sample website · {theme.tier === 'pro' || block.tier === 'pro' ? 'Pro template' : 'Free template'}</p></div>
        <div className="blocks-dialog-controls"><button aria-pressed={!phone} onClick={() => setPhone(false)}>Desktop</button><button aria-pressed={phone} onClick={() => setPhone(true)}>Phone</button><button onClick={onClose} autoFocus aria-label="Close website preview">Close ×</button></div>
      </header>
      <div className="blocks-dialog-canvas"><iframe title={theme.name + ' complete sample website'} srcDoc={html} sandbox="" className={phone ? 'is-phone' : ''} /></div>
    </div>
  </dialog>;
}
