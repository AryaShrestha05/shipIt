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
