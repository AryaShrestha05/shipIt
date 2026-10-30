const test = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const fill = require('../src/templates/fill');
const sample = require('../src/templates/sample');

const TEMPLATE = [
  '<style>:root{--bg:{{bg}};--ink:{{ink}};--accent:{{accent}}}</style>',
  '<h1 data-sid="hero-title">{{name}}</h1>',
  '<p data-sid="hero-tagline">{{tagline}}</p>',
  '<ul><!--items--><li data-sid="item-{{i}}">{{item.name}} {{item.price}} {{item.note}}</li><!--/items--></ul>',
  '<p data-sid="hours">{{hours}}</p><p data-sid="address">{{address}}</p>',
].join('\n');

function business(items) {
  return {
    name: "Rosie's Bakery",
    tagline: 'Baked at dawn',
    vibe: 'warm',
    palette: { bg: '#f6f1ea', ink: '#3b2a1a', accent: '#b5562b' },
    items: items,
    hours: 'Tue–Sun 7am–3pm',
    address: '12 Main St',
  };
}

const THREE_ITEMS = [
  { name: 'Croissant', price: '$4', note: 'butter' },
  { name: 'Sourdough', price: '$9', note: 'daily' },
  { name: 'Cookie', price: '$3', note: '' },
];

test('fills the business name and leaves no placeholders', () => {
  const html = fill.fillTemplate(TEMPLATE, business(THREE_ITEMS));
  assert.ok(html.includes('Rosie&#39;s Bakery'));
  assert.ok(!html.includes('{{'));
});

test('repeats the item row once per item with numbered ids', () => {
  const html = fill.fillTemplate(TEMPLATE, business(THREE_ITEMS));
  assert.strictEqual((html.match(/data-sid="item-\d+"/g) || []).length, 3);
  assert.ok(html.includes('data-sid="item-0"'));
  assert.ok(html.includes('data-sid="item-2"'));
  assert.ok(html.includes('Sourdough $9 daily'));
});

test('escapes HTML in business fields', () => {
  const b = business([]);
  b.name = '<script>alert(1)</script>';
  const html = fill.fillTemplate(TEMPLATE, b);
  assert.ok(html.includes('&lt;script&gt;'));
  assert.ok(!html.includes('<script>'));
});

test('zero items leaves the menu empty without crashing', () => {
  const html = fill.fillTemplate(TEMPLATE, business([]));
  assert.ok(html.includes('<ul></ul>'));
});

test('pickTemplate chooses atelier for a minimal vibe and hearth otherwise', () => {
  assert.strictEqual(fill.pickTemplate({ vibe: 'minimal' }), 'atelier');
  assert.strictEqual(fill.pickTemplate({ vibe: 'warm' }), 'hearth');
  assert.strictEqual(fill.pickTemplate({}), 'hearth');
});

for (const id of fill.TEMPLATE_IDS) {
  test('real template "' + id + '" fills cleanly with unique data-sids', () => {
    const file = path.join(fill.TEMPLATES_DIR, id, 'index.html');
    const html = fill.fillTemplate(fs.readFileSync(file, 'utf8'), sample.SAMPLE_BUSINESS);
    assert.ok(!html.includes('{{'), 'leftover placeholder');
    const sids = (html.match(/data-sid="([^"]+)"/g) || []);
    assert.ok(sids.length >= 10, 'expected at least 10 editable elements');
    assert.strictEqual(new Set(sids).size, sids.length, 'duplicate data-sid');
    assert.ok(fs.existsSync(path.join(fill.TEMPLATES_DIR, id, 'styles.css')));
  });
}

test('hearth ships with the dead "order ahead" link QA is meant to find', () => {
  const html = fs.readFileSync(path.join(fill.TEMPLATES_DIR, 'hearth', 'index.html'), 'utf8');
  assert.ok(html.includes('href="#order"'));
  assert.ok(!html.includes('id="order"'));
});
