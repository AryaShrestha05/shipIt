const googleAI = require('@google/generative-ai');
const gemini = require('../agent/gemini');

// Gemini, behind the same small interface as the other providers.
// The agent loop was written for Gemini's chat, so chat needs no translation.

function create(options, client) {
  const model = options.model || gemini.DEFAULT_MODEL;
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
      generationConfig: { responseMimeType: 'application/json' },
    });
    const result = await gemini.withRetry(function () {
      return jsonModel.generateContent([
        { inlineData: { mimeType: request.mimeType, data: request.imageBase64 } },
        { text: request.prompt + '\n\nReply with JSON matching this schema:\n' + JSON.stringify(request.schema) },
      ]);
    });
    return JSON.parse(result.response.text());
  }

  async function transcribe(request) {
    const plain = client.getGenerativeModel({ model: model });
    const result = await gemini.withRetry(function () {
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
