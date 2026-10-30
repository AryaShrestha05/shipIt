// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, test } from 'vitest';
import { attachPicker, drawPins, findSidElement } from './picker';

beforeEach(function () {
  document.body.innerHTML =
    '<h1 data-sid="hero-title"><span id="word">Rosie\'s</span>   Bakery</h1>' +
    '<a data-sid="cta-order" href="#order" id="link">Order ahead</a>' +
    '<p id="plain">no tag here</p>';
});

// Each test's picker is removed afterwards so tests can't affect each other.
let cleanup = null;
afterEach(function () {
  if (cleanup) cleanup();
  cleanup = null;
});

function click(el) {
  const e = new MouseEvent('click', { bubbles: true, cancelable: true });
  el.dispatchEvent(e);
  return e;
}

describe('findSidElement', function () {
  test('walks up from a child to the nearest tagged element', function () {
    expect(findSidElement(document.getElementById('word')).dataset.sid).toBe('hero-title');
  });

  test('returns null when nothing above is tagged', function () {
    expect(findSidElement(document.getElementById('plain'))).toBe(null);
    expect(findSidElement(document.body)).toBe(null);
  });
});

describe('attachPicker', function () {
  test('clicking inside a tagged element picks it, with a short readable label', function () {
    const picks = [];
    cleanup = attachPicker(document, { onPick: function (pick) { picks.push(pick); } });
    click(document.getElementById('word'));
    expect(picks.length).toBe(1);
    expect(picks[0].sid).toBe('hero-title');
    expect(picks[0].label).toBe("Rosie's Bakery");
  });

  test('clicking the page background picks nothing', function () {
    const picks = [];
    cleanup = attachPicker(document, { onPick: function (pick) { picks.push(pick); } });
    click(document.body);
    click(document.getElementById('plain'));
    expect(picks).toEqual([]);
  });

  test('clicking a link picks it instead of following it', function () {
    cleanup = attachPicker(document, { onPick: function () {} });
    const e = click(document.getElementById('link'));
    expect(e.defaultPrevented).toBe(true);
  });

  test('after detach, clicks pick nothing and the hover box is gone', function () {
    const picks = [];
    const detach = attachPicker(document, { onPick: function (pick) { picks.push(pick); } });
    detach();
    click(document.getElementById('word'));
    expect(picks).toEqual([]);
    expect(document.querySelector('[data-shipit-ui]')).toBe(null);
  });
});

describe('drawPins', function () {
  test('draws one numbered marker per pin, and redraws instead of piling up', function () {
    drawPins(document, [{ id: 7, sid: 'hero-title' }, { id: 9, sid: 'cta-order' }]);
    drawPins(document, [{ id: 7, sid: 'hero-title' }, { id: 9, sid: 'cta-order' }]);
    const markers = document.querySelectorAll('.shipit-pin');
    expect(Array.from(markers).map(function (m) { return m.textContent; })).toEqual(['1', '2']);
  });

  test('skips pins whose element is no longer on the page', function () {
    drawPins(document, [{ id: 1, sid: 'gone' }]);
    expect(document.querySelectorAll('.shipit-pin').length).toBe(0);
  });
});
