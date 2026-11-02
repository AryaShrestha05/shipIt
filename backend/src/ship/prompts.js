// The words we send the AI during Ship.
//
// Ship makes one AI call per round: we send the whole page, and the AI
// answers with an edit plan (see edits.js). No back-and-forth with tools,
// so it's fast, cheap, and works on small models like Claude Haiku.

const SHIP_SYSTEM = `You are an expert web designer editing a small business's website. No human can answer questions, so pick the most sensible reading of each note and do it.

You get the page's index.html and its theme (CSS variables for colors and fonts). Answer with an edit plan in JSON:
- "changes": one short line per change, in plain English for a non-technical owner (e.g. "Made the title bigger").
- "edits": changes to index.html. Each has "find" (text copied EXACTLY from the page, long enough to appear exactly once) and "replace" (what it becomes). Use these for words, links and structure.
- "css": style changes (sizes, colors, spacing, fonts) as plain CSS. It is added to custom.css, which loads last and overrides everything. Target elements by their data-sid, e.g. [data-sid="hero-title"] { font-size: 120px; }. Use "" if there are none.

Rules:
1. Every element has a data-sid="..." attribute. NEVER remove or rename one. An edit that does will be thrown away.
2. Keep the site looking premium: reuse the theme's CSS variables (var(--accent), var(--ink), var(--font-display), ...), keep spacing generous, and make sure it still works on a phone.
3. Keep "find" short but unique: one tag or one line, not the whole section.`;

// The page, as the AI sees it.
function pageBlock(page) {
  return [
    'The theme (theme.css):',
    '```css',
    page.themeCss,
    '```',
    '',
    'The page (index.html):',
    '```html',
    page.html,
    '```',
  ].join('\n');
}

// pins: [{ sid, label, text }]   page: { html, themeCss }
function buildShipPrompt(pins, page) {
  const lines = pins.map(function (pin, i) {
    // e.g. 1. The element with data-sid="hero-title" (it currently says "Rosie's"): make it bigger
    return (i + 1) + '. The element with data-sid="' + pin.sid + '" (it currently says "' + pin.label + '"): ' + pin.text.trim();
  });
  return [
    'The owner left these notes on their website. Make every one of them:',
    '',
    lines.join('\n'),
    '',
    pageBlock(page),
  ].join('\n');
}

// failed: QA checks that didn't pass, [{ label, detail }]   page: the page as it is now
function buildFixPrompt(failed, page) {
  const lines = failed.map(function (check) {
    return '- ' + check.label + ': ' + check.detail;
  });
  return [
    'We just tested the website like a customer would, and these checks failed:',
    '',
    lines.join('\n'),
    '',
    'Fix each problem with the smallest sensible change (for a link that goes nowhere, point it at the most fitting section of the page that exists).',
    '',
    pageBlock(page),
  ].join('\n');
}

module.exports = {
  SHIP_SYSTEM: SHIP_SYSTEM,
  buildShipPrompt: buildShipPrompt,
  buildFixPrompt: buildFixPrompt,
};
