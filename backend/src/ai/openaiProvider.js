const openaiSdk = require('openai');

// OpenAI, behind the same small interface as the other providers.

const DEFAULT_MODEL = 'gpt-5.5';
const TRANSCRIBE_MODEL = 'gpt-4o-mini-transcribe';

function create(options, client) {
  const model = options.model || DEFAULT_MODEL;
  if (!client) client = new openaiSdk.OpenAI({ apiKey: options.apiKey });

  function chatModel(chatOptions) {
    // Translate our tool list into OpenAI's format ({ type: 'function', function: {...} }).
    const tools = (chatOptions.tools || []).map(function (tool) {
      return { type: 'function', function: { name: tool.name, description: tool.description, parameters: tool.parameters } };
    });

    return {
      startChat: function () {
        const messages = [{ role: 'system', content: chatOptions.system }];
        let pendingIds = [];

        return {
          sendMessage: async function (input) {
            if (typeof input === 'string') {
              messages.push({ role: 'user', content: input });
            } else {
              input.forEach(function (part, i) {
                // Each tool result is matched to the call it answers by that call's id.
                messages.push({ role: 'tool', tool_call_id: pendingIds[i], content: String(part.functionResponse.response.content) });
              });
            }

            const body = { model: model, messages: messages.slice() };
            if (tools.length > 0) body.tools = tools;
            const completion = await client.chat.completions.create(body);
            // OpenAI can return several answers ("choices"); we always use the first.
            const message = completion.choices[0].message;
            messages.push(message);

            const toolCalls = message.tool_calls || [];
            pendingIds = toolCalls.map(function (call) { return call.id; });

            return {
              response: {
                functionCalls: function () {
                  if (toolCalls.length === 0) return undefined;
                  return toolCalls.map(function (call) {
                    let args = {};
                    try {
                      args = JSON.parse(call.function.arguments);
                    } catch (err) {
                      // Leave args empty; the tool will report what's missing.
                    }
                    return { name: call.function.name, args: args };
                  });
                },
                text: function () { return message.content || ''; },
              },
            };
          },
        };
      },
    };
  }

  async function extractJson(request) {
    const completion = await client.chat.completions.create({
      model: model,
      messages: [
        { role: 'system', content: request.system },
        {
          role: 'user',
          content: [
            { type: 'image_url', image_url: { url: 'data:' + request.mimeType + ';base64,' + request.imageBase64 } },
            { type: 'text', text: request.prompt },
          ],
        },
      ],
      // strict: OpenAI must return JSON that matches our schema exactly.
      response_format: { type: 'json_schema', json_schema: { name: 'result', schema: request.schema, strict: true } },
    });
    return JSON.parse(completion.choices[0].message.content);
  }

  async function transcribe(request) {
    // Turn the base64 text back into an audio file for OpenAI.
    const file = await openaiSdk.toFile(Buffer.from(request.audioBase64, 'base64'), 'clip.webm', { type: request.mimeType });
    const result = await client.audio.transcriptions.create({ file: file, model: TRANSCRIBE_MODEL });
    return result.text;
  }

  return {
    provider: 'openai',
    model: model,
    canTranscribe: true,
    chatModel: chatModel,
    extractJson: extractJson,
    transcribe: transcribe,
  };
}

module.exports = { create: create, DEFAULT_MODEL: DEFAULT_MODEL };
