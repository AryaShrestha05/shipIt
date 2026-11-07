const fill = require('../site/fill');

// Turns a photo of a menu, sign or storefront into the business info a site
// is built from:
//
//   { name, tagline, vibe, palette: { bg, ink, accent }, items: [...],
//     hours, address, copy: { ctaLabel, closingTitle, ... } }
//
// The AI reads the photo. normalizeBusiness() then cleans up whatever came
// back, because AI answers are sometimes missing fields or slightly wrong.

const VIBES = ['warm', 'minimal', 'bold'];
const DEFAULT_PALETTE = { bg: '#f4ece1', ink: '#2e1f14', accent: '#b4532a' };
const MAX_ITEMS = 8;
const COPY_KEYS = Object.keys(fill.DEFAULT_COPY);

// The shape we ask the AI to fill. Every field is required and nothing
// extra is allowed, because OpenAI's strict mode insists on that.
function stringFields(keys) {
  const properties = {};
  for (const key of keys) properties[key] = { type: 'string' };
  return { type: 'object', properties: properties, required: keys, additionalProperties: false };
}

// The exact shape we ask the AI to fill in; it must answer with JSON like this.
const BUSINESS_SCHEMA = {
  type: 'object',
  properties: {
    name: { type: 'string' },
    tagline: { type: 'string' },
    vibe: { type: 'string', enum: VIBES },
    palette: stringFields(['bg', 'ink', 'accent']),
    items: { type: 'array', items: stringFields(['name', 'price', 'note']) },
    hours: { type: 'string' },
    address: { type: 'string' },
    copy: stringFields(COPY_KEYS),
  },
  required: ['name', 'tagline', 'vibe', 'palette', 'items', 'hours', 'address', 'copy'],
  additionalProperties: false,
};

const SYSTEM = [
  'You read photos of small businesses (menus, signs, storefronts, price lists)',
  'and write the content for their website.',
  'Copy names and prices exactly as they appear. Do not invent prices.',
  'hours and address: copy them exactly if the photo shows them; if not, leave them empty. Never guess facts a customer would rely on.',
  'For the wording (tagline, copy), if something is not in the photo, write a short, honest line that fits the business.',
  'palette: three hex colors (#rrggbb) taken from the photo — bg is a light background, ink is dark text, accent is the brand color.',
  'vibe: warm (cozy, handmade), minimal (calm, modern) or bold (dark, dramatic).',
  'copy: short website wording in the voice of this business, a few words each.',
].join('\n');

function text(value) {
  if (typeof value === 'string') return value.trim();
  if (typeof value === 'number') return String(value);
  return '';
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function color(value, fallback) {
  // A regular expression: does it look like #abc or #aabbcc? (i = upper or lower case)
  if (typeof value === 'string' && /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)) return value;
  return fallback;
}

// 0 (black) to 255 (white), roughly how bright a hex color looks.
function brightness(hex) {
  let digits = hex.slice(1);
  if (digits.length === 3) digits = digits[0] + digits[0] + digits[1] + digits[1] + digits[2] + digits[2];
  // Hex color → red, green, blue numbers from 0 to 255. parseInt(..., 16) reads base-16.
  const r = parseInt(digits.slice(0, 2), 16);
  const g = parseInt(digits.slice(2, 4), 16);
  const b = parseInt(digits.slice(4, 6), 16);
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

// Menus often print just "6" or "8.5". On a website that reads better as
// "$6" and "$8.50". Anything else ("$5", "Free", "from 40") stays as written.
function formatPrice(price) {
  if (!/^\d+(\.\d+)?$/.test(price)) return price;
  if (price.includes('.')) return '$' + Number(price).toFixed(2);
  return '$' + price;
}

function normalizeBusiness(raw) {
  // If the AI sent something that isn't an object, start from empty so nothing crashes.
  if (!isObject(raw)) raw = {};

  let palette = raw.palette;
  if (!isObject(palette)) palette = {};

  const items = [];
  if (Array.isArray(raw.items)) {
    for (const item of raw.items) {
      // Skip broken items or items with no name (continue = go to the next one).
      if (!isObject(item) || !text(item.name)) continue;
      items.push({ name: text(item.name), price: formatPrice(text(item.price)), note: text(item.note) });
      // Stop at 8 items so the menu stays tidy (break = leave the loop).
      if (items.length === MAX_ITEMS) break;
    }
  }

  // Only the wording keys the templates know about; empty ones fall back
  // to the template's default wording.
  const copy = {};
  if (isObject(raw.copy)) {
    for (const key of COPY_KEYS) {
      if (typeof raw.copy[key] === 'string' && raw.copy[key].trim()) copy[key] = raw.copy[key].trim();
    }
  }

  let bg = color(palette.bg, DEFAULT_PALETTE.bg);
  let ink = color(palette.ink, DEFAULT_PALETTE.ink);
  // A dark chalkboard photo gives a dark background, but the themes are made
  // for light backgrounds with dark text. Swap them if they're the wrong way round.
  if (brightness(bg) < brightness(ink)) {
    const darker = bg;
    bg = ink;
    ink = darker;
  }

  return {
    name: text(raw.name) || 'Your business',
    tagline: text(raw.tagline),
    // a ? b : c means "if a, then b, otherwise c".
    vibe: VIBES.includes(raw.vibe) ? raw.vibe : 'warm',
    palette: {
      bg: bg,
      ink: ink,
      accent: color(palette.accent, DEFAULT_PALETTE.accent),
    },
    items: items,
    hours: text(raw.hours),
    address: text(raw.address),
    copy: copy,
  };
}

// request: { imageBase64, mimeType, sentence }
// sentence is optional — one line the owner types, like "family bakery since 1987".
async function extractBusiness(ai, request) {
  let prompt = 'Read this photo and write the website content for this business.';
  if (request.sentence) prompt += '\nThe owner says: ' + request.sentence;

  // Ask the AI to read the photo and fill in BUSINESS_SCHEMA.
  const raw = await ai.extractJson({
    system: SYSTEM,
    prompt: prompt,
    imageBase64: request.imageBase64,
    mimeType: request.mimeType,
    schema: BUSINESS_SCHEMA,
  });
  return normalizeBusiness(raw);
}

module.exports = {
  BUSINESS_SCHEMA: BUSINESS_SCHEMA,
  SYSTEM_PROMPT: SYSTEM,
  normalizeBusiness: normalizeBusiness,
  extractBusiness: extractBusiness,
};
