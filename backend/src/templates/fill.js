const path = require('path');

// Fills a website template with a business's details. No AI here on purpose:
// plain text replacement is instant and gives the same result every time.
//
// Template rules:
//   {{name}} {{tagline}} {{hours}} {{address}}  — business details
//   {{bg}} {{ink}} {{accent}}                   — colors (used in a <style> block)
//   <!--items--> ... <!--/items-->              — one row, repeated per item.
//     Inside it: {{item.name}} {{item.price}} {{item.note}} and {{i}} (0, 1, 2...)
//   {{heroEyebrow}} {{itemsTitle}} ...          — wording that depends on the kind
//     of business ("What we're baking" vs "Our services"). Comes from
//     business.copy; anything missing uses DEFAULT_COPY.

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');

// Neutral wording that fits any small business, used when business.copy
// doesn't say otherwise.
const DEFAULT_COPY = {
  heroEyebrow: 'Locally owned',
  heroCta: 'See what we offer',
  ctaLabel: 'Get in touch',
  itemsNav: 'Offerings',
  itemsEyebrow: 'What we do',
  itemsTitle: 'What we offer',
  itemsSub: 'Everything we make, in one place.',
  closingTitle: "We'd love to see you.",
  highlightLabel: 'Open',
  highlightNote: 'Stop by and say hello.',
  quote: 'We do one thing, and we do it with care.',
  visitTitle: 'Come visit',
  footerNote: 'Thank you for supporting local.',
};

// Turns characters that mean something in HTML into safe text, so a business
// name like "<script>" shows up as words instead of running as code.
function escapeHtml(value) {
  return String(value === undefined || value === null ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Replaces every {{key}} in text with the matching value from values.
function replaceAll(text, values) {
  let result = text;
  for (const key of Object.keys(values)) {
    result = result.split('{{' + key + '}}').join(escapeHtml(values[key]));
  }
  return result;
}

// A page can have several item lists (e.g. a menu and a scrolling marquee),
// so keep filling <!--items--> blocks until none are left.
function fillItems(html, items) {
  let result = html;
  for (;;) {
    const start = result.indexOf('<!--items-->');
    const end = result.indexOf('<!--/items-->', start);
    if (start === -1 || end === -1) return result;

    const row = result.slice(start + '<!--items-->'.length, end);
    let rows = '';
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      rows += replaceAll(row, {
        'item.name': item.name,
        'item.price': item.price,
        'item.note': item.note,
        i: i,
      });
    }
    result = result.slice(0, start) + rows + result.slice(end + '<!--/items-->'.length);
  }
}

function fillTemplate(html, business) {
  const palette = business.palette || {};
  const copy = business.copy || {};
  const withItems = fillItems(html, business.items || []);

  const values = {};
  for (const key of Object.keys(DEFAULT_COPY)) {
    values[key] = copy[key] || DEFAULT_COPY[key];
  }
  const withCopy = replaceAll(withItems, values);

  return replaceAll(withCopy, {
    name: business.name,
    tagline: business.tagline,
    hours: business.hours,
    address: business.address,
    bg: palette.bg,
    ink: palette.ink,
    accent: palette.accent,
  });
}

module.exports = {
  TEMPLATES_DIR: TEMPLATES_DIR,
  DEFAULT_COPY: DEFAULT_COPY,
  escapeHtml: escapeHtml,
  fillTemplate: fillTemplate,
};
