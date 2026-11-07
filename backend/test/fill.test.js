const test = require('node:test');
const assert = require('node:assert');
const fill = require('../src/site/fill');

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

test('fills every item list on the page', () => {
  const html = fill.fillTemplate('<!--items-->[{{item.name}}]<!--/items--> <!--items-->({{i}})<!--/items-->', business(THREE_ITEMS));
  assert.strictEqual(html, '[Croissant][Sourdough][Cookie] (0)(1)(2)');
});

test('zero items leaves the menu empty without crashing', () => {
  const html = fill.fillTemplate(TEMPLATE, business([]));
  assert.ok(html.includes('<ul></ul>'));
});

test('fills the business-specific wording from business.copy', () => {
  const b = business([]);
  b.copy = { itemsTitle: 'Our services' };
  const html = fill.fillTemplate('<h2>{{itemsTitle}}</h2>', b);
  assert.strictEqual(html, '<h2>Our services</h2>');
});

test('missing wording falls back to neutral defaults', () => {
  const html = fill.fillTemplate('<h2>{{itemsTitle}}</h2><a>{{ctaLabel}}</a>', business([]));
  assert.ok(!html.includes('{{'));
  assert.strictEqual(html, '<h2>' + fill.DEFAULT_COPY.itemsTitle + '</h2><a>' + fill.DEFAULT_COPY.ctaLabel + '</a>');
});

test('button text is dark on a light accent and white on a dark one', () => {
  const page = '<style>:root{--on-accent-auto:{{onAccent}}}</style>';
  const light = fill.fillTemplate(page, { name: 'A', palette: { bg: '#fff', ink: '#000', accent: '#E8C67B' } });
  const dark = fill.fillTemplate(page, { name: 'A', palette: { bg: '#fff', ink: '#000', accent: '#2a3d2f' } });
  assert.ok(light.includes('--on-accent-auto:#1a1714'), light);
  assert.ok(dark.includes('--on-accent-auto:#ffffff'), dark);
});

test('the page shell uses the automatic button text color unless a theme sets its own', () => {
  const css = require('fs').readFileSync(require('path').join(fill.TEMPLATES_DIR, 'base.css'), 'utf8');
  assert.ok(css.includes('--on-accent: var(--on-accent-auto, #fff)'));
  const shell = require('fs').readFileSync(require('path').join(fill.TEMPLATES_DIR, 'base.html'), 'utf8');
  assert.ok(shell.includes('--on-accent-auto:{{onAccent}}'));
});

test('every theme that sets its own accent also sets readable text for it', () => {
  const fs = require('fs');
  const path = require('path');
  const dir = path.join(fill.TEMPLATES_DIR, 'themes');
  for (const file of fs.readdirSync(dir)) {
    const css = fs.readFileSync(path.join(dir, file), 'utf8');
    if (/--accent\s*:/.test(css)) assert.ok(/--on-accent\s*:/.test(css), file + ' sets --accent but not --on-accent');
  }
});

test('missing hours and address say "coming soon" instead of leaving an empty box', () => {
  const page = '<p>{{hours}}</p><p>{{address}}</p>';
  const html = fill.fillTemplate(page, { name: 'A', hours: '', address: '' });
  assert.strictEqual(html, '<p>Hours coming soon</p><p>Address coming soon</p>');
  const real = fill.fillTemplate(page, { name: 'A', hours: 'Tue–Sun 7–3', address: '1 Main St' });
  assert.strictEqual(real, '<p>Tue–Sun 7–3</p><p>1 Main St</p>');
});
