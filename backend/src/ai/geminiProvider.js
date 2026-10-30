const googleAI = require('@google/generative-ai');
const retry = require('./retry');

const DEFAULT_MODEL = 'gemini-2.5-flash';

// Gemini, behind the same small interface as the other providers.
// The agent loop was written for Gemini's chat, so chat needs no translation.

// Gemini's schema format is the same as JSON Schema except it rejects
// "additionalProperties", so we make a copy without it.
function geminiSchema(schema) {
  if (Array.isArray(schema)) return schema.map(geminiSchema);
  if (schema === null || typeof schema !== 'object') return schema;
  const copy = {};
  for (const key of Object.keys(schema)) {
    if (key === 'additionalProperties') continue;
    copy[key] = geminiSchema(schema[key]);
  }
  return copy;
}

function create(options, client) {
  const model = options.model || DEFAULT_MODEL;
  if (!client) client = new googleAI.GoogleGenerativeAI(options.apiKey);

  function chatModel(chatOptions) {
    const config = { model: model, systemInstruction: chatOptions.system };
    // Some providers reject an empty tool list, so only send tools if there are any.
    if (chatOptions.tools && chatOptions.tools.length > 0) config.tools = [{ functionDeclarations: chatOptions.tools }];
    return client.getGenerativeModel(config);
  }

  async function extractJson(request) {
    const jsonModel = client.getGenerativeModel({
      model: model,
      systemInstruction: request.system,
      // responseSchema makes Gemini stick to the shape instead of just trying to.
      generationConfig: { responseMimeType: 'application/json', responseSchema: geminiSchema(request.schema) },
    });
    const result = await retry.withRetry(function () {
      return jsonModel.generateContent([
        // The photo travels inside the request as base64 text.
        { inlineData: { mimeType: request.mimeType, data: request.imageBase64 } },
        { text: request.prompt + '\n\nReply with JSON matching this schema:\n' + JSON.stringify(request.schema) },
      ]);
    });
    // The AI answers with JSON text; JSON.parse turns it into a JavaScript object.
    return JSON.parse(result.response.text());
  }

  async function transcribe(request) {
    const plain = client.getGenerativeModel({ model: model });
    const result = await retry.withRetry(function () {
      return plain.generateContent([
        { inlineData: { mimeType: request.mimeType, data: request.audioBase64 } },
        { text: 'Write down exactly what is said in this recording. Reply with the words only.' },
      ]);
    });
    return result.response.text().trim();
  }

  return {
    provider: 'gemini',
    model: model,
    canTranscribe: true,
    chatModel: chatModel,
    extractJson: extractJson,
    transcribe: transcribe,
  };
}

module.exports = { create: create };
