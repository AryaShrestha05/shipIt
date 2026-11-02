const fs = require('fs');
const path = require('path');

// Ship asks the AI for an "edit plan" in one answer, instead of letting it
// read and write files step by step. This file is the shape of that plan and
// the careful code that applies it.
//
// A plan:
//   {
//     changes: ['Made the title bigger'],                  — plain English, for the owner
//     edits:   [{ find: '<exact text>', replace: '...' }], — changes to index.html
//     css:     '.hero-title { font-size: 120px; }'         — added to custom.css
//   }

// The JSON shape the AI must answer in (every field required, nothing extra).
const PLAN_SCHEMA = {
  type: 'object',
  properties: {
    changes: { type: 'array', items: { type: 'string' } },
    edits: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          find: { type: 'string' },
          replace: { type: 'string' },
        },
        required: ['find', 'replace'],
        additionalProperties: false,
      },
    },
    css: { type: 'string' },
  },
  required: ['changes', 'edits', 'css'],
  additionalProperties: false,
};

// How many times `part` appears in `text`.
function countOf(text, part) {
  return text.split(part).length - 1;
}

// Applies a plan to the site in `dir`. Each edit is checked on its own, and a
// bad one is skipped (with a reason) instead of breaking the page:
//   - its `find` text must appear exactly once
//   - it must not remove any of the expected data-sid name tags
// Returns { applied, skipped: [{ find, reason }], cssAdded }.
function applyEdits(dir, plan, expectedSids) {
  const htmlPath = path.join(dir, 'index.html');
  let html = fs.readFileSync(htmlPath, 'utf8');
  let applied = 0;
  const skipped = [];

  for (const edit of plan.edits || []) {
    const find = String(edit.find || '');
    const count = find ? countOf(html, find) : 0;
    if (count === 0) {
      skipped.push({ find: find, reason: 'not found' });
      continue;
    }
    if (count > 1) {
      skipped.push({ find: find, reason: 'found ' + count + ' times' });
      continue;
    }
    const next = html.replace(find, function () { return String(edit.replace || ''); });
    // Every name tag must still be there after the edit.
    const lost = expectedSids.filter(function (sid) { return !next.includes('data-sid="' + sid + '"'); });
    if (lost.length > 0) {
      skipped.push({ find: find, reason: 'would remove a name tag' });
      continue;
    }
    html = next;
    applied++;
  }
  fs.writeFileSync(htmlPath, html, 'utf8');

  // Style changes go at the end of custom.css (it loads last, so it wins).
  // Anything that could break out of a stylesheet is refused.
  let cssAdded = false;
  const css = String(plan.css || '').trim();
  if (css && !/<\/?(style|script)/i.test(css)) {
    fs.appendFileSync(path.join(dir, 'custom.css'), '\n' + css + '\n', 'utf8');
    cssAdded = true;
  }

  return { applied: applied, skipped: skipped, cssAdded: cssAdded };
}

module.exports = { PLAN_SCHEMA: PLAN_SCHEMA, applyEdits: applyEdits };
