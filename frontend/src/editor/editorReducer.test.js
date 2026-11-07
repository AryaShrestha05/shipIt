import { describe, expect, test } from 'vitest';
import { canShip, editorReducer, initialState } from './editorReducer';

function run(actions) {
  let state = initialState;
  for (const action of actions) state = editorReducer(state, action);
  return state;
}

function event(e) {
  return { type: 'SSE_EVENT', event: e };
}

describe('editorReducer', function () {
  test('starting a build moves to the building screen and clears old errors', function () {
    const state = run([{ type: 'BUILD_START' }]);
    expect(state.stage).toBe('building');
    expect(state.error).toBe(null);
  });

  test('build events fill in the run, the business, status lines, then the site', function () {
    const state = run([
      { type: 'BUILD_START' },
      event({ type: 'run', runId: 'ab12cd34' }),
      event({ type: 'status', message: 'reading your photo' }),
      event({ type: 'extracted', business: { name: 'Rosie' } }),
      event({ type: 'built', previewUrl: '/preview/ab12cd34/v1/index.html', layout: {} }),
    ]);
    expect(state.stage).toBe('editing');
    expect(state.runId).toBe('ab12cd34');
    expect(state.version).toBe(1);
    expect(state.business.name).toBe('Rosie');
    expect(state.previewUrl).toBe('/preview/ab12cd34/v1/index.html');
    expect(state.statusLines).toEqual(['reading your photo']);
  });

  test('an error while building goes back to the photo screen with the message', function () {
    const state = run([{ type: 'BUILD_START' }, event({ type: 'error', message: 'quota' })]);
    expect(state.stage).toBe('photo');
    expect(state.error).toBe('quota');
  });

  test('pins can be added, written and removed', function () {
    let state = run([{ type: 'BUILD_START' }, event({ type: 'built', previewUrl: '/x' })]);
    state = editorReducer(state, { type: 'ADD_PIN', sid: 'hero-title', rect: { x: 1, y: 2, width: 3, height: 4 }, label: 'Title' });
    const id = state.pins[0].id;
    state = editorReducer(state, { type: 'UPDATE_PIN', id: id, text: 'make it bigger' });
    expect(state.pins[0]).toMatchObject({ sid: 'hero-title', label: 'Title', text: 'make it bigger' });
    state = editorReducer(state, { type: 'REMOVE_PIN', id: id });
    expect(state.pins).toEqual([]);
  });

  // A site that is built and has one written note, ready to ship.
  const READY = [
    { type: 'BUILD_START' },
    event({ type: 'run', runId: 'ab12cd34' }),
    event({ type: 'built', previewUrl: '/preview/ab12cd34/v1/index.html', layout: {} }),
    { type: 'ADD_PIN', sid: 'hero-title', rect: {}, label: 'Rosie' },
  ];

  const SHIPPED = event({
    type: 'shipped',
    version: 2,
    previewUrl: '/preview/ab12cd34/v2/index.html',
    beforeUrl: '/preview/ab12cd34/v1/index.html',
    shots: { before: '/b.png', after: '/a.png', phone: '/p.png' },
    summary: { changes: ['Made the title bigger'], tests: [{ id: 'links', label: 'links', ok: true }] },
  });

  test('shipping collects live lines and keeps only the latest result per check', function () {
    const state = run(READY.concat([
      { type: 'SHIP_START' },
      event({ type: 'status', message: 'applying your 1 change' }),
      event({ type: 'step', message: 'made 1 edit' }),
      event({ type: 'qa_check', round: 0, check: { id: 'links', label: 'links', ok: false, detail: '#order' } }),
      event({ type: 'qa_fix', round: 1, message: 'found: links — fixing it' }),
      event({ type: 'qa_check', round: 1, check: { id: 'links', label: 'links', ok: true, detail: '' } }),
    ]));
    expect(state.stage).toBe('shipping');
    expect(state.shipLog).toEqual(['applying your 1 change', 'made 1 edit', 'found: links — fixing it']);
    expect(state.checks).toEqual([{ id: 'links', label: 'links', ok: true, detail: '' }]);
    expect(state.fixRound).toBe(1);
  });

  test('a shipped event shows the result and moves the editor to the new version', function () {
    const state = run(READY.concat([{ type: 'SHIP_START' }, SHIPPED]));
    expect(state.stage).toBe('done');
    expect(state.version).toBe(2);
    expect(state.previewUrl).toBe('/preview/ab12cd34/v2/index.html');
    expect(state.result.summary.changes).toEqual(['Made the title bigger']);
  });

  test('continuing after a ship clears the notes and the last ship', function () {
    const state = run(READY.concat([{ type: 'SHIP_START' }, SHIPPED, { type: 'CONTINUE_EDITING' }]));
    expect(state.stage).toBe('editing');
    expect(state.pins).toEqual([]);
    expect(state.result).toBe(null);
    expect(state.shipLog).toEqual([]);
    expect(state.version).toBe(2);
  });

  test('an error while shipping goes back to editing and keeps the notes', function () {
    const state = run(READY.concat([{ type: 'SHIP_START' }, event({ type: 'error', message: 'AI busy' })]));
    expect(state.stage).toBe('editing');
    expect(state.error).toBe('AI busy');
    expect(state.pins.length).toBe(1);
  });

  test('a replayed ship shows its notes and plays like a live ship', function () {
    const state = run([
      { type: 'BUILD_START' },
      event({ type: 'run', runId: 'ab12cd34' }),
      event({ type: 'built', previewUrl: '/preview/ab12cd34/v1/index.html', layout: {} }),
      event({ type: 'replay_ship', pins: [{ sid: 'hero-title', label: 'Rosie', text: 'make it bigger' }] }),
    ]);
    // First the notes are shown, like the owner just left them...
    expect(state.stage).toBe('editing');
    expect(state.pins.map(function (p) { return p.text; })).toEqual(['make it bigger']);
  });

  test('a replay presses Ship after showing the notes', function () {
    const state = run([
      event({ type: 'run', runId: 'ab12cd34' }),
      event({ type: 'built', previewUrl: '/preview/ab12cd34/v1/index.html', layout: {} }),
      event({ type: 'replay_ship', pins: [{ sid: 'hero-title', label: 'Rosie', text: 'make it bigger' }] }),
      event({ type: 'replay_shipping' }),
      event({ type: 'status', message: 'applying your 1 change' }),
    ]);
    // ...then Ship runs as if pressed.
    expect(state.stage).toBe('shipping');
    expect(state.pins.map(function (p) { return p.text; })).toEqual(['make it bigger']);
    expect(state.shipLog).toEqual(['applying your 1 change']);
  });

  test('the next replayed ship starts from the finished one', function () {
    const state = run(READY.concat([
      { type: 'SHIP_START' },
      SHIPPED,
      event({ type: 'replay_ship', pins: [{ sid: 'cta-order', label: 'Order', text: 'make it green' }] }),
    ]));
    expect(state.stage).toBe('editing');
    expect(state.result).toBe(null);
    expect(state.pins.length).toBe(1);
  });

  test('RESET starts over from the photo screen', function () {
    const state = run([{ type: 'BUILD_START' }, event({ type: 'built', previewUrl: '/x' }), { type: 'RESET' }]);
    expect(state).toEqual(initialState);
  });
});

describe('canShip', function () {
  const editing = run([{ type: 'BUILD_START' }, event({ type: 'built', previewUrl: '/x' })]);

  test('is false with no pins', function () {
    expect(canShip(editing)).toBe(false);
  });

  test('is false while a pin has no text yet', function () {
    const state = editorReducer(editing, { type: 'ADD_PIN', sid: 'a', rect: {}, label: 'A' });
    expect(canShip(state)).toBe(false);
  });

  test('is true with a written pin, and false again once shipping', function () {
    let state = editorReducer(editing, { type: 'ADD_PIN', sid: 'a', rect: {}, label: 'A' });
    state = editorReducer(state, { type: 'UPDATE_PIN', id: state.pins[0].id, text: 'bigger' });
    expect(canShip(state)).toBe(true);
    state = editorReducer(state, { type: 'SHIP_START' });
    expect(canShip(state)).toBe(false);
  });
});

describe('a ship that stops without finishing', function () {
  test('goes back to the notes with a message instead of spinning forever', function () {
    const state = run([{ type: 'SHIP_START' }, { type: 'SHIP_ENDED' }]);
    expect(state.stage).toBe('editing');
    expect(state.error).toMatch(/stopped/i);
  });

  test('after a finished ship, the end of the stream changes nothing', function () {
    const done = run([{ type: 'SHIP_START' }, event({ type: 'shipped', version: 2, previewUrl: '/p/v2', summary: { changes: [], tests: [] } })]);
    expect(editorReducer(done, { type: 'SHIP_ENDED' })).toBe(done);
  });
});
