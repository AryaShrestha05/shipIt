import { FONT_OPTIONS } from '../customTheme.js';
import { BACKGROUND_TYPES, PATTERNS, TEXTURES, WALLPAPERS } from './backgroundOptions.js';

export const STUDIO_PRESETS = ['minimalist', 'pastel', 'modern', 'colorful'];
export const LIGHT_COLORS = { bg: '#f7f7f2', ink: '#242823', accent: '#476447', surface: '#ffffff', border: '#d8ddd4' };
export const DARK_COLORS = { bg: '#131620', ink: '#f3f4fa', accent: '#b4a0ff', surface: '#202535', border: '#41495f' };
const choice = (value, options, fallback) => options.includes(value) ? value : fallback;
const number = (value, fallback, min, max) => typeof value === 'number' && Number.isFinite(value) ? Math.round(Math.min(max, Math.max(min, value))) : fallback;
const color = (value, fallback) => typeof value === 'string' && /^#[a-f0-9]{6}$/i.test(value) ? value.toLowerCase() : fallback;

export function safeImage(value) {
  return typeof value === 'string' && value.length <= 1800000 && /^data:image\/(png|jpeg|webp);base64,[a-z0-9+/=]+$/i.test(value) ? value : '';
}
function palette(value, fallback) {
  return Object.fromEntries(Object.entries(fallback).map(([key, initial]) => [key, color(value?.[key], initial)]));
}
function blendHex(base, accent) {
  return '#' + [1,3,5].map(offset => Math.round(parseInt(base.slice(offset,offset+2),16)*.78 + parseInt(accent.slice(offset,offset+2),16)*.22).toString(16).padStart(2,'0')).join('');
}
export function normalizeStudioTheme(input = {}) {
  const value = input && typeof input === 'object' ? input : {};
  // Old v1 saves only stored a palette-based two-stop gradient. Keep its look
  // when loading it into the expanded background editor.
  const legacyGradient = value.background === 'gradient' && value.gradientFrom === undefined && value.gradientTo === undefined;
  const activePalette = palette(value.mode === 'dark' ? value.dark : value.light, value.mode === 'dark' ? DARK_COLORS : LIGHT_COLORS);
  return {
    mode: choice(value.mode, ['light', 'dark'], 'light'),
    light: palette(value.light, LIGHT_COLORS), dark: palette(value.dark, DARK_COLORS),
    headingFont: choice(value.headingFont, FONT_OPTIONS.map(font => font.id), 'bricolage'),
    bodyFont: choice(value.bodyFont, FONT_OPTIONS.map(font => font.id), 'manrope'),
    headingSize: number(value.headingSize, 88, 36, 144), bodySize: number(value.bodySize, 16, 12, 24),
    layout: choice(value.layout, ['split', 'centered', 'editorial'], 'split'),
    items: choice(value.items, ['cards', 'list', 'stickers'], 'cards'), columns: number(value.columns, 2, 1, 3),
    spacing: number(value.spacing, 88, 24, 160), gap: number(value.gap, 20, 8, 48),
    radius: number(value.radius, 24, 0, 48), borderWidth: number(value.borderWidth, 1, 0, 4),
    buttonStyle: choice(value.buttonStyle, ['filled', 'outline', 'soft'], 'filled'),
    buttonShape: choice(value.buttonShape, ['pill', 'rounded', 'square'], 'pill'),
    cardDesign: choice(value.cardDesign, ['elevated', 'outlined', 'glass', 'flat'], 'elevated'),
    animation: choice(value.animation, ['none', 'fade', 'float', 'glow'], 'none'),
    background: choice(value.background, BACKGROUND_TYPES.map(([id]) => id), 'solid'),
    backgroundScope: choice(value.backgroundScope, ['hero', 'page'], 'hero'),
    backgroundUseTheme: value.backgroundUseTheme !== false,
    backgroundColor: color(value.backgroundColor, LIGHT_COLORS.bg),
    gradientType: choice(value.gradientType, ['linear', 'radial', 'conic'], 'linear'),
    gradientFrom: color(value.gradientFrom, legacyGradient ? activePalette.bg : value.mode === 'dark' ? '#111c40' : '#ece0ff'), gradientMiddle: color(value.gradientMiddle, value.mode === 'dark' ? '#3955a3' : '#f9d5e6'), gradientTo: color(value.gradientTo, legacyGradient ? blendHex(activePalette.bg,activePalette.accent) : value.mode === 'dark' ? '#58b69b' : '#b9c8f6'),
    gradientThree: legacyGradient && value.gradientThree === undefined ? false : value.gradientThree !== false, gradientAngle: number(value.gradientAngle, 135, 0, 360), gradientStop: number(value.gradientStop, 50, 10, 90),
    pattern: choice(value.pattern, PATTERNS.map(([id]) => id), 'dots'), patternColor: color(value.patternColor, '#657363'),
    patternScale: number(value.patternScale, 32, 8, 128), patternOpacity: number(value.patternOpacity, 20, 5, 100), patternAngle: number(value.patternAngle, 45, 0, 180),
    texture: choice(value.texture, TEXTURES.map(([id]) => id), 'paper'), textureScale: number(value.textureScale, 24, 8, 80), textureOpacity: number(value.textureOpacity, 20, 5, 80),
    wallpaper: choice(value.wallpaper, WALLPAPERS.map(([id]) => id), 'dunes'),
    image: safeImage(value.image), imageName: typeof value.imageName === 'string' ? value.imageName.slice(0, 120) : '',
    imagePosition: choice(value.imagePosition, ['center', 'top', 'bottom', 'left', 'right', 'left top', 'right top', 'left bottom', 'right bottom'], 'center'),
    imageFit: choice(value.imageFit, ['cover', 'contain', 'tile'], 'cover'), imageTileSize: number(value.imageTileSize, 240, 40, 600),
    backgroundAttachment: choice(value.backgroundAttachment, ['scroll', 'fixed'], 'scroll'),
    overlayUseTheme: value.overlayUseTheme !== false, overlayColor: color(value.overlayColor, '#131620'),
    overlay: number(value.overlay, 65, 0, 95),
  };
}
export function studioPreset(name) {
  const presets = {
    minimalist: { radius: 4, cardDesign: 'flat', borderWidth: 1, spacing: 96, headingFont: 'manrope', buttonShape: 'square' },
    pastel: { light: { bg: '#fbf0f5', ink: '#493a55', accent: '#925d90', surface: '#fff9fc', border: '#e8cddd' }, headingFont: 'fraunces', radius: 36, cardDesign: 'elevated', background: 'gradient', gradientFrom: '#ece0ff', gradientMiddle: '#f9d5e6', gradientTo: '#b9c8f6', layout: 'centered', animation: 'float' },
    modern: { mode: 'dark', headingFont: 'bricolage', buttonStyle: 'filled', cardDesign: 'glass', background: 'gradient', gradientFrom: '#111c40', gradientMiddle: '#3955a3', gradientTo: '#58b69b', layout: 'split', animation: 'glow' },
    colorful: { light: { bg: '#fff5cd', ink: '#332347', accent: '#8c36b5', surface: '#ffe2c4', border: '#d49ab7' }, headingFont: 'archivo', radius: 12, borderWidth: 2, background: 'gradient', gradientFrom: '#ffefb0', gradientMiddle: '#ffc4cb', gradientTo: '#d0bafa', items: 'stickers', animation: 'fade' },
  };
  return normalizeStudioTheme(presets[name] || presets.minimalist);
}

export const THEME_STORAGE_KEY = 'shipit.theme-studio.v1';
const DRAFT_STORAGE_KEY = 'shipit.theme-studio.draft.v1';
export function readStudioDraft(storage) {
  const raw = storage.getItem(DRAFT_STORAGE_KEY);
  if (!raw) return null;
  const draft = JSON.parse(raw);
  if (draft.version !== 1 || typeof draft.name !== 'string' || !draft.settings) return null;
  return { activeId: typeof draft.activeId === 'string' ? draft.activeId : null, name: draft.name.slice(0, 60), settings: normalizeStudioTheme(draft.settings) };
}
export function saveStudioDraft(storage, draft) {
  if (!draft) return storage.removeItem(DRAFT_STORAGE_KEY);
  storage.setItem(DRAFT_STORAGE_KEY, JSON.stringify({ version: 1, ...draft, settings: normalizeStudioTheme(draft.settings) }));
}
export function readThemeLibrary(storage) {
  const raw = storage.getItem(THEME_STORAGE_KEY);
  if (!raw) return { themes: [], activeId: null };
  const parsed = JSON.parse(raw);
  if (parsed.version !== 1 || !Array.isArray(parsed.themes)) throw new Error('Saved themes could not be read. Your stored data has not been changed.');
  const themes = parsed.themes.filter(theme => theme && typeof theme.id === 'string' && typeof theme.name === 'string').map(theme => ({ id: theme.id, name: theme.name.slice(0, 60), settings: normalizeStudioTheme(theme.settings) }));
  return { themes, activeId: themes.some(theme => theme.id === parsed.activeId) ? parsed.activeId : null };
}
export function saveThemeLibrary(storage, library) {
  storage.setItem(THEME_STORAGE_KEY, JSON.stringify({ version: 1, themes: library.themes, activeId: library.activeId }));
}
export function upsertTheme(library, entry) {
  const name = entry.name?.trim();
  if (!name) throw new Error('Give your theme a name before saving.');
  const saved = { id: entry.id, name: name.slice(0, 60), settings: normalizeStudioTheme(entry.settings) };
  return { activeId: saved.id, themes: [...library.themes.filter(theme => theme.id !== saved.id), saved] };
}
