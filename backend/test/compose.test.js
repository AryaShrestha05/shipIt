const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const compose = require('../src/templates/compose');
const sample = require('../src/templates/sample');

function sids(html) {
  return html.match(/data-sid="([^"]+)"/g) || [];
}

test('composes the chosen sections in order into one page', () => {
  const html = compose.composeSite({ theme: 'hearth', sections: ['hero-split', 'items-cards'] }, sample.SAMPLE_BUSINESS);
  assert.ok(html.indexOf('data-sid="hero-title"') < html.indexOf('data-sid="item-0"'));
  assert.ok(html.includes("Rosie&#39;s Bakery"));
  assert.ok(!html.includes('{{'));
  assert.ok(!html.includes('<!--sections-->'));
});

test('skips unknown sections and falls back to hearth for an unknown theme', () => {
  const html = compose.composeSite({ theme: 'nope', sections: ['hero-giant', 'made-up'] }, sample.SAMPLE_BUSINESS);
  assert.ok(html.includes('data-sid="hero-title"'));
  assert.ok(html.includes(compose.THEMES.hearth.fonts));
});

test('keeps only the first section of each type', () => {
  const html = compose.composeSite({ theme: 'atelier', sections: ['hero-split', 'hero-giant'] }, sample.SAMPLE_BUSINESS);
  assert.strictEqual((html.match(/data-sid="hero-title"/g) || []).length, 1);
});

test('there are at least 14 section variants across 7 types', () => {
  const types = new Set(compose.SECTION_IDS.map(function (id) { return id.split('-')[0]; }));
  assert.ok(compose.SECTION_IDS.length >= 14, 'only ' + compose.SECTION_IDS.length);
  assert.ok(types.size >= 7);
});

for (const id of compose.SECTION_IDS) {
  test('section "' + id + '" composes cleanly for a salon', () => {
    const html = compose.composeSite({ theme: 'noir', sections: [id] }, sample.SAMPLE_SALON);
    assert.ok(!html.includes('{{'), 'leftover placeholder');
    const all = sids(html);
    assert.strictEqual(new Set(all).size, all.length, 'duplicate data-sid');
    const lower = html.toLowerCase();
    for (const word of ['bak', 'oven', 'croissant', 'flour', 'the menu']) {
      assert.ok(!lower.includes(word), 'found "' + word + '"');
    }
  });
}

test('pickLayout is the same for the same business', () => {
  const a = compose.pickLayout(sample.SAMPLE_BUSINESS);
  const b = compose.pickLayout(sample.SAMPLE_BUSINESS);
  assert.deepStrictEqual(a, b);
});

test('pickLayout gives different businesses different layouts', () => {
  const names = ['Ada', 'Bloom', 'Crumb', 'Dune', 'Ember', 'Fern', 'Grove', 'Hive', 'Iris', 'Juniper'];
  const seen = new Set();
  for (const name of names) {
    seen.add(JSON.stringify(compose.pickLayout({ name: name, vibe: 'warm' }).sections));
  }
  assert.ok(seen.size >= 4, 'only ' + seen.size + ' different layouts');
});

test('pickLayout follows the vibe and a sensible order', () => {
  assert.strictEqual(compose.pickLayout({ name: 'x', vibe: 'minimal' }).theme, 'atelier');
  assert.strictEqual(compose.pickLayout({ name: 'x', vibe: 'bold' }).theme, 'noir');
  assert.strictEqual(compose.pickLayout({ name: 'x', vibe: 'warm' }).theme, 'hearth');
  const layout = compose.pickLayout({ name: 'x' });
  assert.match(layout.sections[0], /^hero-/);
  assert.ok(layout.sections.some(function (s) { return s.startsWith('items-'); }));
  assert.ok(layout.sections.some(function (s) { return s.startsWith('visit-'); }));
  assert.match(layout.sections[layout.sections.length - 1], /^cta-/);
});

test('a full picked layout has unique data-sids and at least 10 of them', () => {
  const html = compose.composeSite(compose.pickLayout(sample.SAMPLE_BUSINESS), sample.SAMPLE_BUSINESS);
  const all = sids(html);
  assert.ok(all.length >= 10);
  assert.strictEqual(new Set(all).size, all.length);
});

test('every site has the planted dead "#order" link for QA to find', () => {
  const html = compose.composeSite(compose.pickLayout(sample.SAMPLE_SALON), sample.SAMPLE_SALON);
  assert.ok(html.includes('href="#order"'));
  assert.ok(!html.includes('id="order"'));
});

for (const theme of Object.keys(compose.THEMES)) {
  test('site files exist for theme "' + theme + '"', () => {
    const files = compose.siteFiles(theme);
    assert.deepStrictEqual(files.map(function (f) { return f.to; }).sort(), ['base.css', 'effects.js', 'theme.css']);
    for (const f of files) assert.ok(fs.existsSync(f.from), f.from);
  });
}
