import { useState } from 'react';
import { FONT_OPTIONS, STYLE_PRESETS, DEFAULT_STYLE, normalizeCustomStyle, fontFor, contrastRatio, accentTextColor } from './customTheme';
import { FONT_STYLESHEET } from './preview';

export default function CustomThemeControls({ applied, onGenerate }) {
  const [draft, setDraft] = useState(applied);
  const [generated, setGenerated] = useState(false);
  const style = normalizeCustomStyle(draft);
  const pending = JSON.stringify(style) !== JSON.stringify(applied);
  const update = (key, value) => setDraft(previous => ({ ...previous, [key]: value }));

  function generate(event) {
    event.preventDefault();
    onGenerate(style);
    setGenerated(true);
  }
  function reset() {
    const initial = normalizeCustomStyle(DEFAULT_STYLE);
    setDraft(initial); onGenerate(initial); setGenerated(false);
  }

  return (
    <section className="blocks-custom-panel" aria-labelledby="custom-theme-heading">
      <link rel="stylesheet" href={FONT_STYLESHEET} />
      <div className="blocks-custom-intro">
        <div><p className="blocks-label">canvas / make it yours</p><h2 id="custom-theme-heading">Start with your style.</h2></div>
        <p>Pick your fonts and palette. We’ll apply them to every Canvas template. No AI key needed.</p>
      </div>
      <form onSubmit={generate}>
        <div className="blocks-custom-settings">
          <fieldset className="blocks-preset-picker"><legend>Start from a preset, or mix your own</legend>
            {STYLE_PRESETS.map(preset => <button key={preset.id} type="button" className="blocks-chip" aria-pressed={JSON.stringify(normalizeCustomStyle(preset)) === JSON.stringify(style)} onClick={() => setDraft(normalizeCustomStyle(preset))}>{preset.name}</button>)}
          </fieldset>
          <div className="blocks-font-inputs">
            <label htmlFor="canvas-heading-font">Heading font<select id="canvas-heading-font" value={style.headingFont} onChange={event => update('headingFont', event.target.value)}>{FONT_OPTIONS.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}</select></label>
            <label htmlFor="canvas-body-font">Body font<select id="canvas-body-font" value={style.bodyFont} onChange={event => update('bodyFont', event.target.value)}>{FONT_OPTIONS.map(font => <option key={font.id} value={font.id}>{font.name}</option>)}</select></label>
          </div>
          <div className="blocks-color-inputs">
            {[['bg', 'Background'], ['ink', 'Text'], ['accent', 'Accent & buttons']].map(([key, label]) => <label key={key} htmlFor={'canvas-' + key}><span>{label}</span><span className="blocks-color-control"><input id={'canvas-' + key} type="color" value={style[key]} onChange={event => update(key, event.target.value)} /><span>{style[key]}</span></span></label>)}
          </div>
          {contrastRatio(style.bg, style.ink) < 4.5 && <p className="blocks-contrast-warning" role="status">Your text and background are similar. Try more contrast to make small text easier to read.</p>}
          <div className="blocks-custom-actions"><button type="submit" className="blocks-generate">Generate templates ↗</button><button type="button" className="blocks-chip" onClick={reset}>Reset</button></div>
          <p className="blocks-custom-status" role="status">{pending ? 'Your style is ready. Press Generate templates to update the gallery.' : generated ? 'Templates generated with your fonts and colors. Explore them below.' : 'Warm, Minimal and Coastal are now starting styles in one theme.'}</p>
        </div>
        <div className="blocks-style-sample" aria-label="Preview of your chosen fonts and colors" style={{ background: style.bg, color: style.ink, fontFamily: fontFor(style.bodyFont).css }}>
          <span className="blocks-style-eyebrow">YOUR BUSINESS / YOUR STYLE</span>
          <h3 style={{ fontFamily: fontFor(style.headingFont).css, fontWeight: fontFor(style.headingFont).weight }}>A little more<br />like you.</h3>
          <p>A welcoming space for your story, your work, and the things you make.</p>
          <span className="blocks-style-cta" style={{ background: style.accent, color: accentTextColor(style.accent) }}>Discover more ↗</span>
          <small>Style preview · generate to apply below</small>
        </div>
      </form>
    </section>
  );
}
