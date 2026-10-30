const test = require('node:test');
const assert = require('node:assert');
const prompts = require('../src/ship/prompts');

test('the ship prompt lists every note with its part, and the keep-the-tags rule', () => {
  const prompt = prompts.buildShipPrompt([
    { sid: 'hero-title', label: "Rosie's Bakery", text: 'make it bigger' },
    { sid: 'cta-order', label: 'Order ahead', text: 'make it green' },
  ]);
  assert.match(prompt, /1\. .*data-sid="hero-title".*Rosie's Bakery.*make it bigger/);
  assert.match(prompt, /2\. .*data-sid="cta-order".*Order ahead.*make it green/);
  assert.match(prompt, /data-sid/i);
  assert.match(prompt, /custom\.css/);
});

test('the fix prompt names each failed check and what was wrong', () => {
  const prompt = prompts.buildFixPrompt([
    { id: 'links', label: 'every button and link goes somewhere', ok: false, detail: '"Order ahead" points to #order, which does not exist' },
  ]);
  assert.match(prompt, /every button and link goes somewhere/);
  assert.match(prompt, /#order/);
});

test('parseSummary keeps the "- " lines, or the whole text if there are none', () => {
  assert.deepStrictEqual(prompts.parseSummary('Done!\n- Made the title bigger\n-   Linked the order button  \n'), ['Made the title bigger', 'Linked the order button']);
  assert.deepStrictEqual(prompts.parseSummary('  Changed the color.  '), ['Changed the color.']);
  assert.deepStrictEqual(prompts.parseSummary(''), []);
});
