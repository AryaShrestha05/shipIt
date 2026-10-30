const fs = require('fs');
const path = require('path');
const fill = require('./fill');

// Builds a website out of hand-made sections.
//
// A "layout" says which theme and which sections, in order:
//   { theme: 'hearth', sections: ['hero-split', 'marquee', 'items-cards', ...] }
//
// Files (in backend/templates/):
//   base.html            — the page shell: <head>, nav, footer, <!--sections--> slot
//   sections/<id>.html   — one file per section variant, e.g. hero-split.html
//   base.css             — styles for every section, using theme tokens only
//   themes/<theme>.css   — fonts, colors, corners, texture
//   effects.js           — the motion (letter reveals, marquee, spotlight, tilt)

const TEMPLATES_DIR = fill.TEMPLATES_DIR;
const SECTIONS_DIR = path.join(TEMPLATES_DIR, 'sections');

const THEMES = {
  hearth: {
    fonts: 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..700;1,9..144,300..500&family=Manrope:wght@400;500;600&display=swap',
  },
  atelier: {
    fonts: 'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,300..700&family=Instrument+Serif:ital@0;1&display=swap',
  },
  noir: {
    fonts: 'https://fonts.googleapis.com/css2?family=Yeseva+One&family=DM+Sans:ital,opsz,wght@0,9..40,400..600;1,9..40,400&display=swap',
  },
};

// Every section variant on disk, e.g. ['cta-band', 'hero-centered', ...]
// Read once when the server starts: every .html file in templates/sections is one section.
const SECTION_IDS = fs.readdirSync(SECTIONS_DIR)
  .filter(function (file) { return file.endsWith('.html'); })
  .map(function (file) { return file.replace('.html', ''); })
  .sort();

// 'hero-split' -> 'hero'
function sectionType(id) {
  return id.split('-')[0];
}

function composeSite(layout, business) {
  let theme = layout.theme;
  if (!THEMES[theme]) theme = 'hearth';

  // Keep known sections only, and at most one of each type, so data-sid
  // name tags never repeat on a page.
  const usedTypes = {};
  let sectionsHtml = '';
  for (const id of layout.sections || []) {
    if (!SECTION_IDS.includes(id)) continue;
    const type = sectionType(id);
    if (usedTypes[type]) continue;
    usedTypes[type] = true;
    sectionsHtml += fs.readFileSync(path.join(SECTIONS_DIR, id + '.html'), 'utf8') + '\n';
  }

  const base = fs.readFileSync(path.join(TEMPLATES_DIR, 'base.html'), 'utf8');
  const page = base
    // Put the sections into the page shell, then fill in the theme name and font link.
    .replace('<!--sections-->', sectionsHtml)
    .split('{{theme}}').join(theme)
    .split('{{fontsHref}}').join(THEMES[theme].fonts);

  // Last step: fill in the business's name, items, colors and wording.
  return fill.fillTemplate(page, business);
}

// A tiny repeatable random number generator: the same seed always gives the
// same sequence, so the same business always gets the same site.
function seededRandom(text) {
  let seed = 0;
  for (let i = 0; i < text.length; i++) {
    // Turn the name into a number. >>> 0 keeps it a positive whole number.
    seed = (seed * 31 + text.charCodeAt(i)) >>> 0;
  }
  return function () {
    seed = (seed + 0x6d2b79f5) >>> 0;
    let t = seed;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickVariant(type, random) {
  // Every variant of one kind, e.g. all the hero-… sections.
  const options = SECTION_IDS.filter(function (id) { return sectionType(id) === type; });
  return options[Math.floor(random() * options.length)];
}

function pickLayout(business) {
  const random = seededRandom(String(business.name || ''));

  let theme = 'hearth';
  if (business.vibe === 'minimal') theme = 'atelier';
  if (business.vibe === 'bold') theme = 'noir';

  const sections = [pickVariant('hero', random)];
  // About 60% of sites get the scrolling marquee.
  if (random() < 0.6) sections.push('marquee');

  // The highlight goes before or after the items, or is left out.
  const highlight = random();
  if (highlight < 0.35) sections.push(pickVariant('highlight', random));
  sections.push(pickVariant('items', random));
  if (highlight >= 0.35 && highlight < 0.7) sections.push(pickVariant('highlight', random));

  if (random() < 0.75) sections.push(pickVariant('story', random));
  sections.push(pickVariant('visit', random));
  sections.push(pickVariant('cta', random));

  return { theme: theme, sections: sections };
}

// The static files a composed site needs next to its index.html.
function siteFiles(theme) {
  if (!THEMES[theme]) theme = 'hearth';
  return [
    { from: path.join(TEMPLATES_DIR, 'base.css'), to: 'base.css' },
    { from: path.join(TEMPLATES_DIR, 'themes', theme + '.css'), to: 'theme.css' },
    { from: path.join(TEMPLATES_DIR, 'effects.js'), to: 'effects.js' },
  ];
}

// Writes a finished site into a folder: index.html, the three site files,
// an empty custom.css (Ship puts style changes there, so the shared
// stylesheets are never rewritten), and layout.json (so we always know which
// sections a site was built from).
function writeSite(dir, layout, business) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'index.html'), composeSite(layout, business), 'utf8');
  for (const file of siteFiles(layout.theme)) {
    // Copy the shared css/js files next to index.html.
    fs.copyFileSync(file.from, path.join(dir, file.to));
  }
  fs.writeFileSync(path.join(dir, 'custom.css'), '/* Changes made with ShipIt go here. */\n', 'utf8');
  fs.writeFileSync(path.join(dir, 'layout.json'), JSON.stringify(layout, null, 2), 'utf8');
}

module.exports = {
  THEMES: THEMES,
  SECTION_IDS: SECTION_IDS,
  composeSite: composeSite,
  pickLayout: pickLayout,
  siteFiles: siteFiles,
  writeSite: writeSite,
};
