const path = require('path');
const tools = require('./tools');
const gemini = require('./gemini');
const loop = require('./loop');

// Orchestrator: wires model + tools + loop for one agent run.
// Block 1 keeps it simple — uses the local sandbox folder.
// Block 2 will swap this for a fresh git clone per run.
const SANDBOX = path.join(__dirname, '..', '..', 'sandbox');

async function runOnce(prompt, onEvent) {
  const model = gemini.createModel({
    apiKey: process.env.GEMINI_API_KEY,
    tools: tools.toolDeclarations,
    systemInstruction: gemini.SYSTEM_INSTRUCTION,
  });
  const runTool = tools.createToolRunner(SANDBOX);
  return loop.runAgent(model, prompt, runTool, onEvent);
}

module.exports = { runOnce: runOnce };
