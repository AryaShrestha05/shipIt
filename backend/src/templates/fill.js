const path = require('path');

// Fills a website template with a business's details. No AI here on purpose:
// plain text replacement is instant and gives the same result every time.
//
// Template rules:
//   {{name}} {{tagline}} {{hours}} {{address}}  — business details
//   {{bg}} {{ink}} {{accent}}                   — colors (used in a <style> block)
//   <!--items--> ... <!--/items-->              — one menu row, repeated per item.
//     Inside it: {{item.name}} {{item.price}} {{item.note}} and {{i}} (0, 1, 2...)

const TEMPLATES_DIR = path.join(__dirname, '..', '..', 'templates');
const TEMPLATE_IDS = ['hearth', 'atelier'];

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

function fillItems(html, items) {
  const start = html.indexOf('<!--items-->');
  const end = html.indexOf('<!--/items-->');
  if (start === -1 || end === -1) return html;

  const row = html.slice(start + '<!--items-->'.length, end);
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
  return html.slice(0, start) + rows + html.slice(end + '<!--/items-->'.length);
}

function fillTemplate(html, business) {
  const palette = business.palette || {};
  const withItems = fillItems(html, business.items || []);
  return replaceAll(withItems, {
    name: business.name,
    tagline: business.tagline,
    hours: business.hours,
    address: business.address,
    bg: palette.bg,
    ink: palette.ink,
    accent: palette.accent,
  });
}

function pickTemplate(business) {
  if (business.vibe === 'minimal') return 'atelier';
  return 'hearth';
}

module.exports = {
  TEMPLATES_DIR: TEMPLATES_DIR,
  TEMPLATE_IDS: TEMPLATE_IDS,
  escapeHtml: escapeHtml,
  fillTemplate: fillTemplate,
  pickTemplate: pickTemplate,
};
