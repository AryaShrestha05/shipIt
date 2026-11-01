import { useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FONT_OPTIONS, contrastRatio } from '../blocks/customTheme';
import { STUDIO_PRESETS, normalizeStudioTheme, studioPreset, readThemeLibrary, saveThemeLibrary, upsertTheme, readStudioDraft, saveStudioDraft } from '../blocks/studio/themeModel';
import { createStudioPreview } from '../blocks/studio/renderStudio';
import { readBackgroundImage } from '../blocks/studio/uploadBackground';
import BackgroundControls from '../blocks/studio/BackgroundControls';
import './ThemeStudio.css';

function readInitial() {
  let library = { themes: [], activeId: null }, error = '', draft = null;
  try { library = readThemeLibrary(window.localStorage); }
  catch { error = 'Saved themes could not be loaded. Browser storage may be blocked. You can still customize a preview.'; }
  try { draft = readStudioDraft(window.sessionStorage); } catch { /* Explicit Save remains available when session storage is blocked. */ }
  if (draft) library = { ...library, activeId: library.themes.some(theme => theme.id === draft.activeId) ? draft.activeId : null };
  return { library, error, draft };
}

export default function ThemeStudio() {
  const [initial] = useState(readInitial);
  const [library, setLibrary] = useState(initial.library);
  const first = initial.library.themes.find(theme => theme.id === initial.library.activeId);
  const [settings, setSettings] = useState(() => initial.draft?.settings || first?.settings || studioPreset('minimalist'));
  const [name, setName] = useState(initial.draft?.name ?? first?.name ?? 'My custom theme');
  const [error, setError] = useState(initial.error);
  const [message, setMessage] = useState(initial.draft ? 'Recovered your unsaved draft from this tab.' : '');
  const [draftWarning, setDraftWarning] = useState('');
  const [phone, setPhone] = useState(false);
  const [uploading, setUploading] = useState(false);
  const mounted = useRef(true);
  const deferred = useDeferredValue(settings);
  const html = useMemo(() => createStudioPreview(deferred), [deferred]);
  const selected = library.themes.find(theme => theme.id === library.activeId);
  const dirty = selected ? name !== selected.name || JSON.stringify(settings) !== JSON.stringify(selected.settings) : name !== 'My custom theme' || JSON.stringify(settings) !== JSON.stringify(studioPreset('minimalist'));
  const colors = settings[settings.mode];

  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    try { saveStudioDraft(window.sessionStorage, dirty ? { activeId: library.activeId, name, settings } : null); }
    catch {
      const timer = setTimeout(() => setDraftWarning('Automatic draft recovery is unavailable. Save your theme before using browser Back or leaving this page.'), 0);
      return () => clearTimeout(timer);
    }
  }, [settings, name, library.activeId, dirty]);
  useEffect(() => {
    if (!dirty) return;
    const warn = event => { event.preventDefault(); event.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function patchSettings(patch) { setSettings(previous => normalizeStudioTheme({ ...previous, ...patch })); setMessage(''); }
  function update(key, value) { setSettings(previous => normalizeStudioTheme({ ...previous, [key]: value })); setMessage(''); }
  function changeColor(key, value) { setSettings(previous => normalizeStudioTheme({ ...previous, [previous.mode]: { ...previous[previous.mode], [key]: value } })); setMessage(''); }
  function canDiscard() { return !dirty || window.confirm('Leave this unsaved theme? Save it first if you want to keep these changes.'); }
  function persist(next) { saveThemeLibrary(window.localStorage, next); setLibrary(next); }
  function save(copy = false) {
    try {
      if (!name.trim()) throw new Error('Give your theme a name before saving.');
      const id = !copy && selected ? selected.id : (globalThis.crypto?.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).slice(2));
      const next = upsertTheme(library, { id, name: copy ? name.trim() + ' copy' : name, settings });
      persist(next);
      const saved = next.themes.find(theme => theme.id === id);
      setName(saved.name); setSettings(saved.settings);
      setError(''); setDraftWarning(''); setMessage(copy ? 'A new copy is saved in this browser.' : 'Theme saved in this browser. You can return and edit it later.');
    } catch (err) { setError(err.message.includes('name') ? err.message : 'Could not save this theme. Browser storage may be full or disabled. Try removing the background image or using a smaller picture. Your current preview is still here.'); }
  }
  function switchTheme(id) {
    if (!id || id === library.activeId || !canDiscard()) return;
    const theme = library.themes.find(item => item.id === id);
    if (!theme) return;
    try {
      persist({ ...library, activeId: id });
      setSettings(theme.settings); setName(theme.name); setError(''); setMessage('Opened ' + theme.name + '.');
    } catch { setError('Could not switch saved themes because browser storage is unavailable.'); }
  }
  function newTheme() {
    if (!canDiscard()) return;
    setLibrary(previous => ({ ...previous, activeId: null }));
    setSettings(studioPreset('minimalist')); setName('My custom theme'); setError(''); setMessage('New theme. Your saved themes are still in the list.');
  }
  async function upload(event) {
    const file = event.target.files?.[0]; event.target.value = '';
    if (!file) return;
    setUploading(true); setError('');
    try {
      const image = await readBackgroundImage(file);
      if (mounted.current) setSettings(previous => normalizeStudioTheme({ ...previous, image, imageName: file.name, background: 'image' }));
    } catch (err) { if (mounted.current) setError(err.message); }
    finally { if (mounted.current) setUploading(false); }
  }

  return <div className="studio-page">
    <header className="studio-header">
      <Link to="/blocks" onClick={event => { if (!canDiscard()) event.preventDefault(); }}>← Blocks</Link>
      <div><h1>Theme Studio</h1><p>Choose a look. Make it yours.</p></div>
      <button className="studio-primary" disabled={uploading} onClick={() => save()}>{selected ? 'Save changes' : 'Save theme'}</button>
    </header>
    <div className="studio-workspace">
      <aside className="studio-controls" aria-label="Theme customization">
        <section className="studio-library">
          {library.themes.length > 0 && <><label htmlFor="studio-saved">Open a theme</label>
          <select id="studio-saved" disabled={uploading} value={library.activeId || '__new__'} onChange={event => event.target.value === '__new__' ? newTheme() : switchTheme(event.target.value)}><option value="__new__">＋ Create a new theme</option>{library.themes.map(theme => <option key={theme.id} value={theme.id}>{theme.name}</option>)}</select></>}
          <label htmlFor="studio-name">Theme name</label><input id="studio-name" value={name} maxLength={60} onChange={event => { setName(event.target.value); setMessage(''); }} />
          <div className="studio-save-status"><span>{dirty ? '● Unsaved changes' : selected ? '✓ Saved' : 'New theme · not saved yet'}</span></div>
          <small>Your themes are saved in this browser.</small>
        </section>
        {error && <p className="studio-error" role="alert">{error}</p>}
        {message && <p className="studio-message" role="status">{message}</p>}
        {draftWarning && <p className="studio-note" role="status">{draftWarning}</p>}
        <fieldset disabled={uploading} className="studio-fieldset">
          <section className="studio-basics">
            <Choice label="Starting look" value="" onChange={value => { if (value) { setSettings(studioPreset(value)); setMessage('Style applied. Keep customizing or save your theme.'); } }} options={[["","Choose a starting style…"],...STUDIO_PRESETS.map(preset => [preset,preset.charAt(0).toUpperCase()+preset.slice(1)])]} />
            <label className="studio-mode-switch"><span>Dark mode</span><input type="checkbox" checked={settings.mode === 'dark'} onChange={event => update('mode',event.target.checked ? 'dark' : 'light')} /></label>
            <div className="studio-quick-colors">{[['bg','Background'],['ink','Text'],['accent','Accent']].map(([key,label]) => <label key={key}><input type="color" aria-label={label + ' color'} value={colors[key]} onChange={event => changeColor(key,event.target.value)} /><span>{label}</span></label>)}</div>
            {contrastRatio(colors.bg,colors.ink) < 4.5 && <small>Try more contrast between text and background.</small>}
            <Choice label="Heading font" value={settings.headingFont} onChange={value => update('headingFont',value)} options={FONT_OPTIONS.map(font => [font.id,font.name])} />
            <Choice label="Page layout" value={settings.layout} onChange={value => update('layout',value)} options={[["split","Side by side"],["centered","Centered"],["editorial","Big headline"]]} />
          </section>
          <BackgroundControls settings={settings} onChange={patchSettings} onUpload={upload} uploading={uploading} />
          <details className="studio-advanced"><summary>Advanced options</summary><p className="studio-bg-hint">Only if you want to fine-tune the details.</p>
          <details><summary>Fonts & text sizes</summary>
            <Choice label="Body font" value={settings.bodyFont} onChange={value => update('bodyFont',value)} options={FONT_OPTIONS.map(font => [font.id,font.name])} />
            <Slider label="Heading size" value={settings.headingSize} min={36} max={144} onChange={value => update('headingSize',value)} />
            <Slider label="Body size" value={settings.bodySize} min={12} max={24} onChange={value => update('bodySize',value)} />
          </details>
          <details><summary>Cards layout</summary>
            <Choice label="Offerings layout" value={settings.items} onChange={value => update('items',value)} options={[["cards","Card grid"],["list","Numbered list"],["stickers","Sticker cards"]]} />
            {settings.items !== 'list' && <Slider label="Card columns on desktop" value={settings.columns} min={1} max={3} unit="" onChange={value => update('columns',value)} />}
          </details>
          <details><summary>Buttons & cards</summary>
            <Choice label="Button style" value={settings.buttonStyle} onChange={value => update('buttonStyle',value)} options={[["filled","Filled"],["outline","Outlined"],["soft","Soft tint"]]} />
            <Choice label="Button shape" value={settings.buttonShape} onChange={value => update('buttonShape',value)} options={[["pill","Pill"],["rounded","Rounded"],["square","Square"]]} />
            <Choice label="Card design" value={settings.cardDesign} onChange={value => update('cardDesign',value)} options={[["elevated","Elevated shadow"],["outlined","Outlined"],["glass","Frosted glass"],["flat","Flat"]]} />
          </details>
          <details><summary>Spacing & borders</summary>
            <Slider label="Section spacing" value={settings.spacing} min={24} max={160} onChange={value => update('spacing',value)} />
            <Slider label="Layout gaps" value={settings.gap} min={8} max={48} onChange={value => update('gap',value)} />
            <Slider label="Corner radius" value={settings.radius} min={0} max={48} onChange={value => update('radius',value)} />
            <Slider label="Border width" value={settings.borderWidth} min={0} max={4} onChange={value => update('borderWidth',value)} />
          </details>
          <details><summary>Extra colors</summary><div className="studio-color-list">{[['surface','Card background'],['border','Borders']].map(([key,label]) => <label key={key}><span>{label}</span><input type="color" aria-label={label + ' color'} value={colors[key]} onChange={event => changeColor(key,event.target.value)} /></label>)}</div></details>
          <details><summary>Animations</summary><Choice label="Motion style" value={settings.animation} onChange={value => update('animation',value)} options={[["none","No animation"],["fade","Fade in"],["float","Floating cards"],["glow","Glowing buttons"]]} /><small>Respects your device’s reduced-motion preference.</small></details>
          {selected && <button onClick={() => save(true)}>Save as a separate copy</button>}
          </details>
        </fieldset>
        {uploading && <p role="status">Preparing your picture…</p>}
      </aside>
      <main className="studio-preview" aria-label="Live website preview">
        <div className="studio-preview-toolbar"><div><strong>{name || 'Untitled theme'}</strong><span>Live preview · sample business</span></div><label className="studio-device-picker">Preview size<select aria-label="Preview size" value={phone ? 'phone' : 'desktop'} onChange={event => setPhone(event.target.value === 'phone')}><option value="desktop">Desktop</option><option value="phone">Phone</option></select></label></div>
        <div className="studio-preview-canvas"><iframe title="Live preview of your custom theme" srcDoc={html} sandbox="" className={phone ? 'is-phone' : ''} /></div>
      </main>
    </div>
  </div>;
}

function Choice({ label, value, options, onChange }) {
  return <label className="studio-control"><span>{label}</span><select value={value} onChange={event => onChange(event.target.value)}>{options.map(([key,text]) => <option key={key} value={key}>{text}</option>)}</select></label>;
}
function Slider({ label, value, min, max, unit = 'px', onChange }) {
  return <label className="studio-control studio-slider"><span>{label}<output>{value}{unit}</output></span><input type="range" min={min} max={max} value={value} onChange={event => onChange(Number(event.target.value))} /></label>;
}
