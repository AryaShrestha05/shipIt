const Anthropic = require('@anthropic-ai/sdk');

// Claude, behind the same small interface as the other providers.
// The agent loop speaks "Gemini chat" (sendMessage → functionCalls()/text()),
// so this file translates both ways.

const DEFAULT_MODEL = 'claude-opus-5-5';

// Models that support server-side refusal fallbacks: if Claude declines a
// request, the API re-runs it on a suitable model instead of failing.
const FALLBACK_MODELS = ['claude-opus-5-5', 'claude-opus-5', 'claude-fable-5-1', 'claude-sonnet-5-5'];

function create(options, client) {
  const model = options.model || DEFAULT_MODEL;
  if (!client) client = new Anthropic({ apiKey: options.apiKey });
  const useFallbacks = FALLBACK_MODELS.includes(model);

  // One request to Claude, with the settings every call shares.
  function send(body) {
    body.model = model;
    body.max_tokens = 16000;
    body.output_config = Object.assign({ effort: 'medium' }, body.output_config);
    if (useFallbacks) {
      body.betas = ['server-side-fallback-2026-07-01'];
      body.fallbacks = 'default';
      return client.beta.messages.create(body);
    }
    return client.messages.create(body);
  }

  function textOf(response) {
    return response.content
      .filter(function (block) { return block.type === 'text'; })
      .map(function (block) { return block.text; })
      .join('');
  }

  function chatModel(chatOptions) {
    // Translate our tool list into Claude's format (input_schema instead of parameters).
    const tools = (chatOptions.tools || []).map(function (tool) {
      return { name: tool.name, description: tool.description, input_schema: tool.parameters };
    });

    return {
      startChat: function () {
        const messages = [];
        let pendingIds = []; // ids of the tool calls we still owe answers for, in order

        return {
          sendMessage: async function (input) {
            if (typeof input === 'string') {
              messages.push({ role: 'user', content: input });
            } else {
              // Tool results come back in the same order the calls were made.
              const results = input.map(function (part, i) {
                return { type: 'tool_result', tool_use_id: pendingIds[i], content: String(part.functionResponse.response.content) };
              });
              messages.push({ role: 'user', content: results });
            }

            const body = { system: chatOptions.system, messages: messages.slice() };
            if (tools.length > 0) body.tools = tools;
            const response = await send(body);
            // Send Claude's turn back exactly as it came (thinking blocks included).
            messages.push({ role: 'assistant', content: response.content });

            // Claude's reply is a list of blocks (text, thinking, tool requests). Keep only the tool requests.
            const toolUses = response.content.filter(function (block) { return block.type === 'tool_use'; });
            pendingIds = toolUses.map(function (block) { return block.id; });
            // Claude's safety check can decline a request; we turn that into a friendly message below.
            const refused = response.stop_reason === 'refusal';

            return {
              response: {
                // These two functions make Claude's reply look like Gemini's, which is what agent/loop.js reads.
                functionCalls: function () {
                  if (refused || toolUses.length === 0) return undefined;
                  return toolUses.map(function (block) { return { name: block.name, args: block.input }; });
                },
                text: function () {
                  if (refused) return 'The AI declined this request. Try wording the change differently.';
                  return textOf(response);
                },
              },
            };
          },
        };
      },
    };
  }

  async function extractJson(request) {
    const response = await send({
      system: request.system,
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: request.mimeType, data: request.imageBase64 } },
          { type: 'text', text: request.prompt },
        ],
      }],
      output_config: { format: { type: 'json_schema', schema: request.schema } },
    });
    if (response.stop_reason === 'refusal') throw new Error('The AI declined to read this photo.');
    return JSON.parse(textOf(response));
  }

  async function transcribe() {
    throw new Error('Claude cannot listen to audio — type the change instead, or use a Gemini or OpenAI key for voice.');
  }

  return {
    provider: 'claude',
    model: model,
    canTranscribe: false,
    chatModel: chatModel,
    extractJson: extractJson,
    transcribe: transcribe,
  };
}

module.exports = { create: create, DEFAULT_MODEL: DEFAULT_MODEL };
