const test = require('node:test');
const assert = require('node:assert');
const providers = require('../src/ai/providers');
const fromRequest = require('../src/ai/fromRequest');

const TOOLS = [
  { name: 'read_file', description: 'Read a file', parameters: { type: 'object', properties: { file_path: { type: 'string' } }, required: ['file_path'] } },
];

// ---------- fake SDK clients: they record what was sent and replay answers ----------

function fakeClaude(responses) {
  const sent = [];
  let i = 0;
  function create(body) {
    sent.push(JSON.parse(JSON.stringify(body)));
    return Promise.resolve(responses[Math.min(i++, responses.length - 1)]);
  }
  return { sent: sent, messages: { create: create }, beta: { messages: { create: create } } };
}

function fakeOpenAI(responses, transcript) {
  const sent = [];
  let i = 0;
  return {
    sent: sent,
    chat: { completions: { create: function (body) {
      sent.push(JSON.parse(JSON.stringify(body)));
      return Promise.resolve(responses[Math.min(i++, responses.length - 1)]);
    } } },
    audio: { transcriptions: { create: function (body) {
      sent.push({ transcription: body.model });
      return Promise.resolve({ text: transcript });
    } } },
  };
}

function fakeGemini(text) {
  const configs = [];
  const calls = [];
  return {
    configs: configs,
    calls: calls,
    getGenerativeModel: function (config) {
      configs.push(config);
      return {
        startChat: function () { return { sendMessage: function () { return Promise.resolve('chat'); } }; },
        generateContent: function (parts) {
          calls.push(parts);
          return Promise.resolve({ response: { text: function () { return text; } } });
        },
      };
    },
  };
}

// ---------- Claude ----------

test('claude: tools become input_schema tools and tool calls come back in loop shape', async () => {
  const client = fakeClaude([
    { stop_reason: 'tool_use', content: [
      { type: 'thinking', thinking: '', signature: 'sig' },
      { type: 'tool_use', id: 'tu_1', name: 'read_file', input: { file_path: 'a.html' } },
      { type: 'tool_use', id: 'tu_2', name: 'read_file', input: { file_path: 'b.css' } },
    ] },
    { stop_reason: 'end_turn', content: [{ type: 'text', text: '- Made it bigger' }] },
  ]);
  const ai = providers.createAI({ provider: 'claude', apiKey: 'k' }, client);
  const chat = ai.chatModel({ system: 'rules', tools: TOOLS }).startChat();

  const first = await chat.sendMessage('go');
  assert.deepStrictEqual(first.response.functionCalls(), [
    { name: 'read_file', args: { file_path: 'a.html' } },
    { name: 'read_file', args: { file_path: 'b.css' } },
  ]);
  assert.strictEqual(client.sent[0].tools[0].input_schema.properties.file_path.type, 'string');
  assert.strictEqual(client.sent[0].system, 'rules');

  const second = await chat.sendMessage([
    { functionResponse: { name: 'read_file', response: { content: 'A' } } },
    { functionResponse: { name: 'read_file', response: { content: 'B' } } },
  ]);
  assert.strictEqual(second.response.functionCalls(), undefined);
  assert.strictEqual(second.response.text(), '- Made it bigger');

  const messages = client.sent[1].messages;
  // The assistant turn is sent back unchanged (thinking block included).
  assert.strictEqual(messages[1].role, 'assistant');
  assert.strictEqual(messages[1].content[0].type, 'thinking');
  // Tool results go back in one user message, matched to the calls in order.
  assert.deepStrictEqual(messages[2].content.map(function (b) { return [b.tool_use_id, b.content]; }), [['tu_1', 'A'], ['tu_2', 'B']]);
});

test('claude: a refusal becomes a plain explanation instead of a crash', async () => {
  const client = fakeClaude([{ stop_reason: 'refusal', content: [] }]);
  const chat = providers.createAI({ provider: 'claude', apiKey: 'k' }, client).chatModel({ system: 's', tools: TOOLS }).startChat();
  const result = await chat.sendMessage('go');
  assert.strictEqual(result.response.functionCalls(), undefined);
  assert.match(result.response.text(), /declined/);
});

test('claude: refusal fallbacks are on for opus 5.5 and left off for haiku', async () => {
  const client = fakeClaude([{ stop_reason: 'end_turn', content: [{ type: 'text', text: 'ok' }] }]);
  await providers.createAI({ provider: 'claude', apiKey: 'k' }, client).chatModel({ system: 's', tools: TOOLS }).startChat().sendMessage('go');
  await providers.createAI({ provider: 'claude', apiKey: 'k', model: 'claude-haiku-5-5' }, client).chatModel({ system: 's', tools: TOOLS }).startChat().sendMessage('go');
  assert.strictEqual(client.sent[0].model, 'claude-opus-5-5');
  assert.strictEqual(client.sent[0].fallbacks, 'default');
  assert.deepStrictEqual(client.sent[0].betas, ['server-side-fallback-2026-07-01']);
  assert.strictEqual(client.sent[1].fallbacks, undefined);
});

test('claude: extractJson sends the image and a JSON schema, and parses the answer', async () => {
  const client = fakeClaude([{ stop_reason: 'end_turn', content: [{ type: 'text', text: '{"name":"Rosie"}' }] }]);
  const ai = providers.createAI({ provider: 'claude', apiKey: 'k' }, client);
  const result = await ai.extractJson({ system: 's', prompt: 'read it', imageBase64: 'AAA', mimeType: 'image/png', schema: { type: 'object' } });
  assert.deepStrictEqual(result, { name: 'Rosie' });
  const content = client.sent[0].messages[0].content;
  assert.deepStrictEqual(content[0].source, { type: 'base64', media_type: 'image/png', data: 'AAA' });
  assert.deepStrictEqual(client.sent[0].output_config.format, { type: 'json_schema', schema: { type: 'object' } });
});

test('claude: cannot transcribe, and says to type instead', async () => {
  const ai = providers.createAI({ provider: 'claude', apiKey: 'k' }, fakeClaude([]));
  assert.strictEqual(ai.canTranscribe, false);
  await assert.rejects(ai.transcribe({ audioBase64: 'AAA', mimeType: 'audio/webm' }), /type/i);
});

// ---------- OpenAI ----------

test('openai: tools become functions and tool replies are matched to call ids', async () => {
  const client = fakeOpenAI([
    { choices: [{ message: { role: 'assistant', content: null, tool_calls: [
      { id: 'call_1', type: 'function', function: { name: 'read_file', arguments: '{"file_path":"a.html"}' } },
    ] } }] },
    { choices: [{ message: { role: 'assistant', content: '- Done' } }] },
  ]);
  const chat = providers.createAI({ provider: 'openai', apiKey: 'k' }, client).chatModel({ system: 'rules', tools: TOOLS }).startChat();

  const first = await chat.sendMessage('go');
  assert.deepStrictEqual(first.response.functionCalls(), [{ name: 'read_file', args: { file_path: 'a.html' } }]);
  assert.strictEqual(client.sent[0].tools[0].type, 'function');
  assert.strictEqual(client.sent[0].messages[0].role, 'system');

  const second = await chat.sendMessage([{ functionResponse: { name: 'read_file', response: { content: 'A' } } }]);
  assert.strictEqual(second.response.text(), '- Done');
  const last = client.sent[1].messages[client.sent[1].messages.length - 1];
  assert.deepStrictEqual([last.role, last.tool_call_id, last.content], ['tool', 'call_1', 'A']);
});

test('openai: extractJson sends a data URL image and a strict JSON schema', async () => {
  const client = fakeOpenAI([{ choices: [{ message: { content: '{"name":"Nova"}' } }] }]);
  const ai = providers.createAI({ provider: 'openai', apiKey: 'k' }, client);
  const result = await ai.extractJson({ system: 's', prompt: 'p', imageBase64: 'AAA', mimeType: 'image/jpeg', schema: { type: 'object' } });
  assert.deepStrictEqual(result, { name: 'Nova' });
  const user = client.sent[0].messages[1].content;
  assert.strictEqual(user[0].image_url.url, 'data:image/jpeg;base64,AAA');
  assert.strictEqual(client.sent[0].response_format.type, 'json_schema');
});

test('openai: transcribes audio', async () => {
  const client = fakeOpenAI([], 'make it bigger');
  const ai = providers.createAI({ provider: 'openai', apiKey: 'k' }, client);
  assert.strictEqual(ai.canTranscribe, true);
  assert.strictEqual(await ai.transcribe({ audioBase64: Buffer.from('x').toString('base64'), mimeType: 'audio/webm' }), 'make it bigger');
});

// ---------- Gemini ----------

test('gemini: chat model gets the tools and rules', () => {
  const client = fakeGemini('');
  providers.createAI({ provider: 'gemini', apiKey: 'k' }, client).chatModel({ system: 'rules', tools: TOOLS });
  assert.strictEqual(client.configs[0].model, 'gemini-2.5-flash');
  assert.strictEqual(client.configs[0].systemInstruction, 'rules');
  assert.deepStrictEqual(client.configs[0].tools, [{ functionDeclarations: TOOLS }]);
});

test('gemini: extractJson asks for JSON and sends the image inline', async () => {
  const client = fakeGemini('{"name":"Rosie"}');
  const ai = providers.createAI({ provider: 'gemini', apiKey: 'k' }, client);
  const result = await ai.extractJson({ system: 's', prompt: 'p', imageBase64: 'AAA', mimeType: 'image/png', schema: { type: 'object' } });
  assert.deepStrictEqual(result, { name: 'Rosie' });
  assert.strictEqual(client.configs[0].generationConfig.responseMimeType, 'application/json');
  assert.deepStrictEqual(client.calls[0][0], { inlineData: { mimeType: 'image/png', data: 'AAA' } });
});

test('gemini: extractJson enforces the schema, minus the parts Gemini rejects', async () => {
  const client = fakeGemini('{}');
  const schema = { type: 'object', properties: { a: { type: 'object', properties: { b: { type: 'string' } }, additionalProperties: false } }, additionalProperties: false };
  await providers.createAI({ provider: 'gemini', apiKey: 'k' }, client).extractJson({ system: 's', prompt: 'p', imageBase64: 'A', mimeType: 'image/png', schema: schema });
  assert.deepStrictEqual(client.configs[0].generationConfig.responseSchema, { type: 'object', properties: { a: { type: 'object', properties: { b: { type: 'string' } } } } });
  assert.strictEqual(schema.additionalProperties, false); // the caller's schema is left alone
});

test('gemini: transcribes audio', async () => {
  const ai = providers.createAI({ provider: 'gemini', apiKey: 'k' }, fakeGemini('  make it bigger \n'));
  assert.strictEqual(await ai.transcribe({ audioBase64: 'AAA', mimeType: 'audio/webm' }), 'make it bigger');
});

// ---------- choosing a provider ----------

test('unknown providers are refused', () => {
  assert.throws(function () { providers.createAI({ provider: 'nope', apiKey: 'k' }); }, /Unknown AI provider/);
});

test('aiFromRequest uses the key and model from the request headers', () => {
  const headers = { 'x-shipit-provider': 'openai', 'x-shipit-key': 'sk-test', 'x-shipit-model': 'gpt-5.4-mini' };
  const ai = fromRequest.aiFromRequest({ get: function (name) { return headers[name.toLowerCase()]; } });
  assert.strictEqual(ai.provider, 'openai');
  assert.strictEqual(ai.model, 'gpt-5.4-mini');
});

test('aiFromRequest falls back to the server Gemini key, and fails clearly without any key', () => {
  const noHeaders = { get: function () { return undefined; } };
  const saved = process.env.GEMINI_API_KEY;

  process.env.GEMINI_API_KEY = 'server-key';
  assert.strictEqual(fromRequest.aiFromRequest(noHeaders).provider, 'gemini');

  delete process.env.GEMINI_API_KEY;
  assert.throws(function () { fromRequest.aiFromRequest(noHeaders); }, fromRequest.NoKeyError);

  if (saved !== undefined) process.env.GEMINI_API_KEY = saved;
});
