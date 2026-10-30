const test = require('node:test');
const assert = require('node:assert');
const { runAgent } = require('../src/agent/loop');

// Fake Gemini model: replays scripted turns and records what the loop sent.
// A turn is either an array of function calls or a final text string.
function fakeModel(turns) {
  const sent = [];
  let i = 0;
  const respond = () => {
    const turn = turns[Math.min(i++, turns.length - 1)];
    const calls = Array.isArray(turn) ? turn : undefined;
    return {
      response: {
        functionCalls: () => calls,
        text: () => (calls ? '' : turn),
      },
    };
  };
  return {
    sent,
    startChat: () => ({
      sendMessage: async (payload) => {
        sent.push(payload);
        return respond();
      },
    }),
  };
}

const call = (name, args = {}) => ({ name, args });

test('returns tool errors to the model instead of throwing', async () => {
  const model = fakeModel([[call('read_file', { file_path: 'x' })], 'done']);
  const runTool = () => {
    throw new Error('boom');
  };

  const text = await runAgent(model, 'go', runTool);

  assert.strictEqual(text, 'done');
  const reply = model.sent[1];
  assert.match(reply[0].functionResponse.response.content, /^ERROR: boom/);
});

test('answers every function call in a turn', async () => {
  const model = fakeModel([[call('read_file'), call('run_command')], 'done']);
  const ran = [];
  const runTool = (c) => {
    ran.push(c.name);
    return 'ok';
  };

  await runAgent(model, 'go', runTool);

  assert.deepStrictEqual(ran, ['read_file', 'run_command']);
  assert.strictEqual(model.sent[1].length, 2);
  assert.strictEqual(model.sent[1][1].functionResponse.name, 'run_command');
});

test('stops after maxSteps', async () => {
  const model = fakeModel([[call('run_command')]]); // never stops calling tools
  const events = [];
  let ran = 0;

  await runAgent(model, 'go', () => ++ran && 'ok', (e) => events.push(e), { maxSteps: 3 });

  assert.strictEqual(ran, 3);
  const error = events.find((e) => e.type === 'error');
  assert.match(error.message, /step limit/);
  assert.strictEqual(events.at(-1).type, 'done');
});

test('stops when signal aborts', async () => {
  const model = fakeModel([[call('run_command')]]);
  const ctrl = new AbortController();
  let ran = 0;
  const runTool = () => {
    ran++;
    ctrl.abort();
    return 'ok';
  };

  await runAgent(model, 'go', runTool, () => {}, { signal: ctrl.signal });

  assert.strictEqual(ran, 1);
});
