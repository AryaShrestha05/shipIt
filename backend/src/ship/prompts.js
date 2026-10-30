// The words we send the AI during Ship, and how we read its answer.

// The AI's standing rules for editing a ShipIt site.
const SHIP_SYSTEM = `You are an expert web designer editing a small business's website. No human can answer questions, so never ask any: pick the most sensible reading and do it.

The site folder has:
- index.html — the page content
- custom.css — empty at first; put ALL style changes here (it loads last, so it overrides everything)
- theme.css — the colors and fonts as CSS variables (read it to reuse them; do not edit it)
- base.css, effects.js — shared files; never edit them

Tools: read_file, edit_file (replace one exact piece of text — use it for every change to index.html), write_file (only for custom.css), run_command.

Rules:
1. Read a file before changing it.
2. Every element has a data-sid="..." attribute. NEVER remove or rename one — the editor needs them.
3. Keep the site looking premium: reuse the theme's colors and fonts, keep spacing generous, and make it still work on a phone.
4. When finished, reply with one line per change, each starting with "- ", in plain English for a non-technical owner. No questions.`;

// pins: [{ sid, label, text }]
function buildShipPrompt(pins) {
  const lines = pins.map(function (pin, i) {
    return (i + 1) + '. The element with data-sid="' + pin.sid + '" (it currently says "' + pin.label + '"): ' + pin.text.trim();
  });
  return [
    'The owner left these notes on their website. Make every one of them:',
    '',
    lines.join('\n'),
    '',
    'Edit index.html with edit_file, and put any style changes in custom.css. Keep every data-sid attribute.',
  ].join('\n');
}

// failed: QA checks that didn't pass, [{ label, detail }]
function buildFixPrompt(failed) {
  const lines = failed.map(function (check) {
    return '- ' + check.label + ': ' + check.detail;
  });
  return [
    'We just tested the website like a customer would, and these checks failed:',
    '',
    lines.join('\n'),
    '',
    'Fix each problem with the smallest sensible change (for a link that goes nowhere, point it at the most fitting section of the page that exists). Keep every data-sid attribute.',
  ].join('\n');
}

// The AI's reply → one plain-English line per change.
function parseSummary(text) {
  const lines = String(text || '').split('\n')
    .map(function (line) { return line.trim(); })
    .filter(function (line) { return line.startsWith('- '); })
    .map(function (line) { return line.slice(2).trim(); })
    .filter(Boolean);
  if (lines.length > 0) return lines;
  return text && text.trim() ? [text.trim()] : [];
}

module.exports = {
  SHIP_SYSTEM: SHIP_SYSTEM,
  buildShipPrompt: buildShipPrompt,
  buildFixPrompt: buildFixPrompt,
  parseSummary: parseSummary,
};
