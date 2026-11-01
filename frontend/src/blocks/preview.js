import base from './templates/base.html?raw';
import baseCss from './templates/base.css?raw';
import proCss from './templates/pro-effects.css?raw';
import sceneCss from './scenes.css?raw';
import { sceneMarkup } from './scenes';
import businesses from './businesses.json';
import { THEMES, BLOCKS } from './catalog';
import { normalizeCustomStyle, fontFor, accentTextColor } from './customTheme';

const sections = import.meta.glob('./templates/sections/*.html', { query: '?raw', import: 'default', eager: true });
const styles = import.meta.glob('./templates/themes/*.css', { query: '?raw', import: 'default', eager: true });
const FONTS = 'https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Manrope:wght@400;500;600;700&family=Bricolage+Grotesque:wght@400;600&family=Instrument+Serif:ital@0;1&family=Yeseva+One&family=DM+Sans:wght@400;500;600&family=Cormorant+Garamond:ital,wght@0,500;1,400&family=Nunito+Sans:wght@400;600;800&family=Archivo+Black&display=swap';
export const FONT_STYLESHEET = FONTS.replace('&display=swap', '&family=Inter:wght@400;600;700&family=Playfair+Display:wght@400;600;700&family=Lora:wght@400;600;700&family=Merriweather:wght@400;700&family=Montserrat:wght@400;600;700&family=Poppins:wght@400;600;700&family=Outfit:wght@400;600;700&family=Space+Grotesk:wght@400;600;700&family=DM+Mono:wght@400;500&family=Caveat:wght@400;600;700&family=Pacifico&display=swap');

function escape(value) {
  return String(value ?? '').replace(/[&<>"']/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character]);
}
function replace(text, values) {
  return text.replace(/\{\{([^}]+)\}\}/g, (token, key) => key in values ? escape(values[key]) : token);
}

// All preview assets are bundled with this page: no backend or AI key required.
export function createPreview(themeId, blockId, fullSite = false, customization, layoutChoices = {}) {
  const theme = THEMES.find(item => item.id === themeId) || THEMES[0];
  const block = BLOCKS.find(item => item.id === blockId) || BLOCKS[0];
  const business = businesses[theme.id];
  const custom = normalizeCustomStyle(customization);
  const palette = theme.id === 'canvas' ? custom : business.palette;
  const customCss = theme.id === 'canvas' ? `:root{--font-display:${fontFor(custom.headingFont).css};--font-body:${fontFor(custom.bodyFont).css};--font-accent:${fontFor(custom.headingFont).css};--display-weight:${fontFor(custom.headingFont).weight};--on-accent:${accentTextColor(custom.accent)}}` : '';
  const chosen = { hero: 'hero-split', items: 'items-cards', story: 'story-quote', visit: 'visit-card', cta: 'cta-band' };
  const layouts = {
    noir: { hero: 'hero-giant', items: 'items-list', cta: 'cta-split' },
    bloom: { items: 'items-tilt' },
    zest: { hero: 'hero-giant', items: 'items-tilt', story: 'story-split', cta: 'cta-split' },
    blueprint: { hero: 'hero-giant', items: 'items-list', story: 'story-split', visit: 'visit-columns' },
    orbit: { story: 'story-split', visit: 'visit-columns', cta: 'cta-split' },
    forma: { story: 'story-split', visit: 'visit-columns', cta: 'cta-split' },
  };
  Object.assign(chosen, layouts[theme.id]);
  for (const [type, id] of Object.entries(layoutChoices)) {
    if (BLOCKS.some(candidate => candidate.id === id && candidate.type === type)) chosen[type] = id;
  }
  chosen[block.type] = block.id;
  const ids = fullSite ? ['hero', 'marquee', 'highlight', 'items', 'story', 'visit', 'cta'].map(type => chosen[type]).filter(Boolean) : [block.id];
  let html = base.replace('<!--sections-->', ids.map(id => sections[`./templates/sections/${id}.html`]).join('\n'));
  const scene = sceneMarkup(theme.id);
  if (scene) html = html.replace(/<header class="section hero[^"]*"[^>]*>/, opening => opening + '<div class="theme-scene">' + scene + '</div>');
  html = html.replace(/<!--items-->([\s\S]*?)<!--\/items-->/g, (_, row) => business.items.map((item, i) => replace(row, { 'item.name': item.name, 'item.price': item.price, 'item.note': item.note, i })).join(''));
  html = replace(html, { ...business.copy, ...business, theme: theme.id, fontsHref: FONT_STYLESHEET, ...palette });
  html = html.replace('<link rel="stylesheet" href="base.css">', `<style>${baseCss}</style>`)
    .replace('<link rel="stylesheet" href="theme.css">', `<style>${styles[`./templates/themes/${theme.id}.css`]}\n${sceneCss}\n${proCss}\n${customCss}</style>`)
    .replace(/<script\b[^>]*>[\s\S]*?<\/script\s*>/gi, '')
    .replaceAll('href="#order"', 'href="#visit"');
  // srcdoc otherwise resolves fragment links against the parent /blocks URL.
  return html.replace('<head>', '<head><base href="about:srcdoc">');
}
