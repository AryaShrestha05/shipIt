const test = require('node:test');
const assert = require('node:assert');
const prompts = require('../src/ship/prompts');

const PAGE = { html: '<h1 data-sid="hero-title">Rosie\'s Bakery</h1>', themeCss: ':root { --font-display: Fraunces; }' };

test('the ship prompt lists every note with its part, and includes the page', () => {
  const prompt = prompts.buildShipPrompt([
    { sid: 'hero-title', label: "Rosie's Bakery", text: 'make it bigger' },
    { sid: 'cta-order', label: 'Order ahead', text: 'make it green' },
  ], PAGE);
  assert.match(prompt, /1\. .*data-sid="hero-title".*Rosie's Bakery.*make it bigger/);
  assert.match(prompt, /2\. .*data-sid="cta-order".*Order ahead.*make it green/);
  assert.ok(prompt.includes(PAGE.html), 'the page is in the prompt');
  assert.ok(prompt.includes('--font-display'), 'the theme is in the prompt');
});

test('the fix prompt names each failed check and includes the current page', () => {
  const prompt = prompts.buildFixPrompt([
    { id: 'links', label: 'every button and link goes somewhere', ok: false, detail: '"Order ahead" points to #order, which does not exist' },
  ], PAGE);
  assert.match(prompt, /every button and link goes somewhere/);
  assert.match(prompt, /#order/);
  assert.ok(prompt.includes(PAGE.html));
});

test('the rules explain the edit plan and protect the name tags', () => {
  assert.match(prompts.SHIP_SYSTEM, /find/);
  assert.match(prompts.SHIP_SYSTEM, /exactly once/);
  assert.match(prompts.SHIP_SYSTEM, /data-sid/);
  assert.match(prompts.SHIP_SYSTEM, /css/);
});
