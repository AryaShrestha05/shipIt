const test = require('node:test');
const assert = require('node:assert');
const fill = require('../src/templates/fill');

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
