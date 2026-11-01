export const FONT_OPTIONS = [
  { id: 'fraunces', name: 'Fraunces · editorial serif', css: "'Fraunces', Georgia, serif", weight: 400 },
  { id: 'bricolage', name: 'Bricolage Grotesque · bold modern', css: "'Bricolage Grotesque', system-ui, sans-serif", weight: 600 },
  { id: 'nunito', name: 'Nunito Sans · soft and rounded', css: "'Nunito Sans', system-ui, sans-serif", weight: 800 },
  { id: 'manrope', name: 'Manrope · clean and simple', css: "'Manrope', system-ui, sans-serif", weight: 600 },
  { id: 'dm-sans', name: 'DM Sans · everyday sans', css: "'DM Sans', system-ui, sans-serif", weight: 600 },
  { id: 'instrument', name: 'Instrument Serif · elegant serif', css: "'Instrument Serif', Georgia, serif", weight: 400 },
  { id: 'yeseva', name: 'Yeseva One · statement serif', css: "'Yeseva One', Georgia, serif", weight: 400 },
  { id: 'archivo', name: 'Archivo Black · heavy display', css: "'Archivo Black', Impact, sans-serif", weight: 400 },
  { id: 'inter', name: 'Inter · crisp interface', css: "'Inter', system-ui, sans-serif", weight: 600 },
  { id: 'playfair', name: 'Playfair Display · classic editorial', css: "'Playfair Display', Georgia, serif", weight: 600 },
  { id: 'lora', name: 'Lora · warm book serif', css: "'Lora', Georgia, serif", weight: 600 },
  { id: 'merriweather', name: 'Merriweather · readable serif', css: "'Merriweather', Georgia, serif", weight: 700 },
  { id: 'cormorant', name: 'Cormorant Garamond · refined serif', css: "'Cormorant Garamond', Georgia, serif", weight: 500 },
  { id: 'montserrat', name: 'Montserrat · geometric', css: "'Montserrat', system-ui, sans-serif", weight: 600 },
  { id: 'poppins', name: 'Poppins · friendly geometric', css: "'Poppins', system-ui, sans-serif", weight: 600 },
  { id: 'outfit', name: 'Outfit · contemporary', css: "'Outfit', system-ui, sans-serif", weight: 600 },
  { id: 'space', name: 'Space Grotesk · creative tech', css: "'Space Grotesk', system-ui, sans-serif", weight: 600 },
  { id: 'dm-mono', name: 'DM Mono · technical monospace', css: "'DM Mono', monospace", weight: 500 },
  { id: 'caveat', name: 'Caveat · handwritten', css: "'Caveat', cursive", weight: 600 },
  { id: 'pacifico', name: 'Pacifico · flowing script', css: "'Pacifico', cursive", weight: 400 },
];

// The former three themes are now convenient starting styles within Canvas.
export const STYLE_PRESETS = [
  { id: 'warm', name: 'Warm', headingFont: 'fraunces', bodyFont: 'manrope', bg: '#f4ece1', ink: '#2e1f14', accent: '#b4532a' },
  { id: 'minimal', name: 'Minimal', headingFont: 'bricolage', bodyFont: 'dm-sans', bg: '#fbfaf8', ink: '#1d2421', accent: '#5f7a6a' },
  { id: 'coastal', name: 'Coastal', headingFont: 'nunito', bodyFont: 'nunito', bg: '#edf7fc', ink: '#173d59', accent: '#176387' },
];
export const DEFAULT_STYLE = STYLE_PRESETS[0];
export function fontFor(id) { return FONT_OPTIONS.find(font => font.id === id) || FONT_OPTIONS[0]; }

export function normalizeCustomStyle(value) {
  const input = value && typeof value === 'object' ? value : {};
  const result = {};
  for (const key of ['headingFont', 'bodyFont']) {
    result[key] = FONT_OPTIONS.some(font => font.id === input[key]) ? input[key] : DEFAULT_STYLE[key];
  }
  for (const key of ['bg', 'ink', 'accent']) {
    result[key] = typeof input[key] === 'string' && /^#[0-9a-f]{6}$/i.test(input[key]) ? input[key].toLowerCase() : DEFAULT_STYLE[key];
  }
  return result;
}

function luminance(hex) {
  const channels = hex.slice(1).match(/../g).map(value => parseInt(value, 16) / 255).map(value => value <= .04045 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return channels[0] * .2126 + channels[1] * .7152 + channels[2] * .0722;
}
export function contrastRatio(first, second) {
  const a = luminance(first), b = luminance(second);
  return (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
}
export function accentTextColor(accent) {
  return contrastRatio(accent, '#ffffff') >= contrastRatio(accent, '#111111') ? '#ffffff' : '#111111';
}
