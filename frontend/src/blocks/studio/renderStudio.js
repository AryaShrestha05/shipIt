import { createPreview } from '../preview';
import { normalizeStudioTheme } from './themeModel';
import { accentTextColor } from '../customTheme';
import { backgroundCss } from './backgroundStyle';

export function createStudioPreview(input) {
  const theme = normalizeStudioTheme(input);
  const colors = theme[theme.mode];
  const hero = { split: 'hero-split', centered: 'hero-centered', editorial: 'hero-giant' }[theme.layout];
  const items = { cards: 'items-cards', list: 'items-list', stickers: 'items-tilt' }[theme.items];
  const html = createPreview('canvas', hero, true, { ...colors, headingFont: theme.headingFont, bodyFont: theme.bodyFont }, { items });
  const buttonRadius = { pill: '999px', rounded: '12px', square: '0' }[theme.buttonShape];
  const button = {
    filled: `background:var(--accent);color:${accentTextColor(colors.accent)}`,
    outline: 'background:transparent;color:var(--accent)',
    soft: 'background:color-mix(in srgb,var(--accent) 15%,var(--paper));color:var(--text)',
  }[theme.buttonStyle];
  const shadow = theme.cardDesign === 'elevated' ? '0 14px 35px -18px color-mix(in srgb,var(--text) 35%,transparent)' : 'none';
  const card = theme.cardDesign === 'glass' ? 'background:color-mix(in srgb,var(--surface) 65%,transparent);backdrop-filter:blur(18px)' : theme.cardDesign === 'outlined' ? 'background:transparent' : 'background:var(--surface)';
  const background = backgroundCss(theme);
  const animation = {
    none: '*,*::before,*::after{animation:none!important;transition:none!important}',
    fade: '.hero{animation:studio-enter .9s ease both}',
    float: '.hero-card,.sticker,.card-grid>li{animation:studio-float 5s ease-in-out infinite alternate}',
    glow: '.btn-accent{animation:studio-glow 3s ease-in-out infinite alternate}',
  }[theme.animation];
  const css = `<style>
    :root{color-scheme:${theme.mode};--surface:${colors.surface};--line:${colors.border};--radius:${theme.radius}px;--studio-gap:${theme.gap}px}
    body{font-size:${theme.bodySize}px}
    .hero .aurora{display:none}
    .hero .hero-title{font-size:clamp(30px,8vw,${theme.headingSize}px);line-height:1.05}
    .hero .lede{font-size:${theme.bodySize + 2}px}
    .h2,.story-big,.quote,.visit-big{font-size:clamp(26px,5vw,${Math.round(theme.headingSize * .65)}px)}
    .item-name,.list-name,.sticker-name{font-size:${Math.round(theme.bodySize * 1.45)}px}
    .section{padding-block:${theme.spacing}px}.hero{padding-inline:24px;border-radius:${theme.radius}px}
    .card-grid,.sticker-row,.hero-split,.visit-grid,.visit-columns,.story-split{gap:var(--studio-gap)}
    .card-grid,.sticker-row{display:grid;grid-template-columns:repeat(${theme.columns},minmax(0,1fr))}
    .card-grid>li,.card-grid>li:nth-child(4n+1),.card-grid>li:nth-child(4n+2){grid-column:auto}
    .core,.sticker,.sticker:nth-child(even),.sticker:nth-child(3n){${card};box-shadow:${shadow};border:${theme.borderWidth}px solid var(--line);border-radius:${theme.radius}px}
    .shell{padding:0;background:transparent;box-shadow:none;border-radius:${theme.radius}px}
    .sticker,.sticker:nth-child(even),.sticker:nth-child(3n){transform:none}
    .nav{border:${theme.borderWidth}px solid var(--line);box-shadow:none}
    .btn{border-radius:${buttonRadius};font-size:${Math.max(12, theme.bodySize - 2)}px}
    .btn-ink,.btn-accent{${button};border:${Math.max(1, theme.borderWidth)}px solid var(--accent)}
    .btn-icon{border-radius:${buttonRadius}}
    ${background}
    @keyframes studio-enter{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
    @keyframes studio-float{to{transform:translateY(-10px)}}
    @keyframes studio-glow{to{box-shadow:0 0 28px color-mix(in srgb,var(--accent) 50%,transparent)}}
    ${animation}
    @media(max-width:767px){.card-grid,.sticker-row{grid-template-columns:1fr}.section{padding-block:${Math.min(theme.spacing, 72)}px}.hero{padding-inline:16px}.hero .hero-title{font-size:clamp(30px,10vw,${Math.min(theme.headingSize, 80)}px)}}
    @media(prefers-reduced-motion:reduce){*,*::before,*::after{animation:none!important;transition:none!important}}
  </style>`;
  return html.replace('</head>', css + '</head>');
}
