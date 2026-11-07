const test = require('node:test');
const assert = require('node:assert');
const extract = require('../src/vision/extract');

test('normalizeBusiness fills every field with a default when given nothing', () => {
  const business = extract.normalizeBusiness({});
  assert.strictEqual(business.name, 'Your business');
  assert.strictEqual(business.tagline, '');
  assert.strictEqual(business.vibe, 'warm');
  assert.deepStrictEqual(business.palette, { bg: '#f4ece1', ink: '#2e1f14', accent: '#b4532a' });
  assert.deepStrictEqual(business.items, []);
  assert.strictEqual(business.hours, '');
  assert.strictEqual(business.address, '');
  assert.deepStrictEqual(business.copy, {});
});

test('normalizeBusiness keeps at most 8 items and drops bad colors', () => {
  const items = [];
  for (let i = 0; i < 20; i++) items.push({ name: 'Item ' + i, price: 4, note: 'n' });
  const business = extract.normalizeBusiness({ items: items, palette: { bg: 'red', ink: '#111', accent: '#AABBCC' } });
  assert.strictEqual(business.items.length, 8);
  assert.deepStrictEqual(business.items[0], { name: 'Item 0', price: '$4', note: 'n' });
  assert.deepStrictEqual(business.palette, { bg: '#f4ece1', ink: '#111', accent: '#AABBCC' });
});

test('normalizeBusiness drops items without a name and unknown vibes', () => {
  const business = extract.normalizeBusiness({ vibe: 'spooky', items: [{ price: '$3' }, { name: '  Bagel ' }] });
  assert.strictEqual(business.vibe, 'warm');
  assert.deepStrictEqual(business.items, [{ name: 'Bagel', price: '', note: '' }]);
});

test('normalizeBusiness keeps only known wording keys', () => {
  const business = extract.normalizeBusiness({ copy: { ctaLabel: 'Order ahead', hack: '<script>', quote: 5 } });
  assert.deepStrictEqual(business.copy, { ctaLabel: 'Order ahead' });
});

test('normalizeBusiness never throws on garbage', () => {
  assert.strictEqual(extract.normalizeBusiness('garbage').name, 'Your business');
  assert.strictEqual(extract.normalizeBusiness(null).name, 'Your business');
  assert.deepStrictEqual(extract.normalizeBusiness({ items: 'lots', palette: 7, copy: [] }).items, []);
});

test('extractBusiness sends the photo and sentence to the AI and cleans the answer', async () => {
  let sent;
  const ai = {
    extractJson: function (request) {
      sent = request;
      return Promise.resolve({ name: "Rosie's", vibe: 'bold', items: [{ name: 'Bun', price: '$5', note: '' }] });
    },
  };
  const business = await extract.extractBusiness(ai, { imageBase64: 'AAA', mimeType: 'image/png', sentence: 'family bakery' });
  assert.strictEqual(business.name, "Rosie's");
  assert.strictEqual(business.vibe, 'bold');
  assert.strictEqual(sent.imageBase64, 'AAA');
  assert.strictEqual(sent.mimeType, 'image/png');
  assert.match(sent.prompt, /family bakery/);
  assert.strictEqual(sent.schema.type, 'object');
});

test('normalizeBusiness swaps a dark background with light text, so sites stay readable', () => {
  const business = extract.normalizeBusiness({ palette: { bg: '#332d29', ink: '#ededed', accent: '#e49141' } });
  assert.deepStrictEqual(business.palette, { bg: '#ededed', ink: '#332d29', accent: '#e49141' });
});

test('a bare number price gets a dollar sign; anything else is kept as written', () => {
  const business = extract.normalizeBusiness({ items: [
    { name: 'Egg Sandwich', price: '6', note: '' },
    { name: "Kelly's Toast", price: '8.5', note: '' },
    { name: 'Latte', price: '$5', note: '' },
    { name: 'Refill', price: 'Free', note: '' },
    { name: 'Cut', price: '', note: '' },
  ] });
  assert.deepStrictEqual(business.items.map(function (i) { return i.price; }), ['$6', '$8.50', '$5', 'Free', '']);
});

test('the AI is told not to invent hours or an address', () => {
  assert.match(extract.SYSTEM_PROMPT, /hours and address.*leave (it|them) empty/i);
});
