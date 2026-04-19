const { GoogleGenerativeAI } = require('@google/generative-ai');

// Creates a Gemini model configured with the given tools.
// Separated from the loop so later we could swap models (2.5 vs 3.x) or
// swap providers entirely without touching the agent logic.
function createModel({ apiKey, tools, modelName = 'gemini-2.5-flash-lite' }) {
  const genAI = new GoogleGenerativeAI(apiKey);
  return genAI.getGenerativeModel({
    model: modelName,
    tools: [{ functionDeclarations: tools }],
  });
}

module.exports = { createModel };
