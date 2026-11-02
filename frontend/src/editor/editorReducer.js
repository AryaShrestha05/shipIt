// The editor's memory: which screen we're on and everything we know so far.
//
// Screens ("stages") go in this order:
//   photo → building → editing → shipping → done → (back to editing)
//
// React calls editorReducer(state, action) whenever something happens, and
// shows whatever state comes back. Nothing here talks to the server, so it's
// easy to test.

export const initialState = {
  stage: 'photo',
  runId: null,
  version: 0,
  previewUrl: null,
  business: null,
  statusLines: [],
  pins: [],
  shipLog: [], // live lines while shipping: "applying your 2 changes", "made 3 edits", ...
  checks: [], // the latest result of each customer test, e.g. { id: 'links', ok: true, ... }
  fixRound: 0, // how many times Ship has gone back to fix something
  result: null, // the 'shipped' event: summary, before/after screenshots
  error: null,
  replay: null,
};

let nextPinId = 1;

// A copy of `state` with some fields changed (state itself is never edited).
function change(state, fields) {
  return Object.assign({}, state, fields);
}

// A check's latest result replaces its older one (a fix round re-runs every check).
function withCheck(checks, check) {
  const others = checks.filter(function (old) { return old.id !== check.id; });
  const at = checks.findIndex(function (old) { return old.id === check.id; });
  if (at === -1) return checks.concat([check]);
  others.splice(at, 0, check); // keep it in the same place in the list
  return others;
}

// Live events from POST /api/ship (see backend/src/ship/ship.js).
function onShipEvent(state, event) {
  if (event.type === 'status' || event.type === 'step' || event.type === 'warning' || event.type === 'qa_fix') {
    const fields = { shipLog: state.shipLog.concat([event.message]) };
    if (event.type === 'qa_fix') fields.fixRound = event.round;
    return change(state, fields);
  }
  if (event.type === 'qa_check') return change(state, { checks: withCheck(state.checks, event.check) });
  if (event.type === 'shipped') {
    return change(state, { stage: 'done', result: event, version: event.version, previewUrl: event.previewUrl });
  }
  if (event.type === 'error') {
    // Nothing was lost: go back to the notes so the owner can try again.
    return change(state, { stage: 'editing', error: event.message });
  }
  return state;
}

// A replay (backend/src/routes/replay.js) starts each recorded ship with its
// notes. They become pins, and the ship plays out like a live one.
function onReplayShip(state, event) {
  const pins = event.pins.map(function (note) {
    return { id: nextPinId++, sid: note.sid, rect: null, label: note.label, text: note.text, status: 'draft' };
  });
  return change(state, { stage: 'shipping', pins: pins, error: null, shipLog: [], checks: [], fixRound: 0, result: null });
}

// One live event from the server (see backend/src/routes/build.js).
function onServerEvent(state, event) {
  if (event.type === 'replay_ship') return onReplayShip(state, event);
  if (state.stage === 'shipping') return onShipEvent(state, event);
  if (event.type === 'run') return change(state, { runId: event.runId });
  if (event.type === 'status') return change(state, { statusLines: state.statusLines.concat([event.message]) });
  if (event.type === 'extracted') return change(state, { business: event.business });
  if (event.type === 'built') {
    return change(state, { stage: 'editing', version: 1, previewUrl: event.previewUrl });
  }
  if (event.type === 'error') {
    // A failed build goes back to the photo screen so the user can try again.
    const stage = state.stage === 'building' ? 'photo' : state.stage;
    return change(state, { stage: stage, error: event.message });
  }
  return state;
}

export function editorReducer(state, action) {
  if (action.type === 'BUILD_START') {
    // A new build: forget everything from before and show the building screen.
    return change(initialState, { stage: 'building' });
  }
  if (action.type === 'SSE_EVENT') {
    return onServerEvent(state, action.event);
  }
  if (action.type === 'ADD_PIN') {
    // nextPinId++ uses the current number, then adds 1 for next time.
    const pin = { id: nextPinId++, sid: action.sid, rect: action.rect, label: action.label, text: '', status: 'draft' };
    // concat makes a NEW list with the pin added. React only notices changes when it gets a new object.
    return change(state, { pins: state.pins.concat([pin]) });
  }
  if (action.type === 'UPDATE_PIN') {
    const pins = state.pins.map(function (pin) {
      if (pin.id !== action.id) return pin;
      const updated = change(pin, {});
      if (action.text !== undefined) updated.text = action.text;
      if (action.status !== undefined) updated.status = action.status;
      return updated;
    });
    return change(state, { pins: pins });
  }
  if (action.type === 'REMOVE_PIN') {
    return change(state, { pins: state.pins.filter(function (pin) { return pin.id !== action.id; }) });
  }
  if (action.type === 'SHIP_START') {
    return change(state, { stage: 'shipping', error: null, shipLog: [], checks: [], fixRound: 0, result: null });
  }
  if (action.type === 'CONTINUE_EDITING') {
    return change(state, { stage: 'editing', pins: [], result: null, shipLog: [], checks: [], fixRound: 0 });
  }
  if (action.type === 'RESET') {
    return initialState;
  }
  return state;
}

// Ship is only allowed while editing, with at least one pin, and every pin
// says what to change.
export function canShip(state) {
  if (state.stage !== 'editing' || state.pins.length === 0) return false;
  // every = true only if this is true for every single pin.
  return state.pins.every(function (pin) { return pin.text.trim() !== ''; });
}
