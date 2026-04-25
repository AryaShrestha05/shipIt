const path = require('path');
const { toolDeclarations, createToolRunner } = require('./tools');
const { createModel } = require('./gemini');
const { runAgent } = require('./loop');

// Orchestrator: wires model + tools + loop for one agent run.
// Block 1 keeps it simple — uses the local sandbox folder.
// Block 2 will swap this for a fresh git clone per run.
const SANDBOX = path.join(__dirname, '..', '..', 'sandbox');

async function runOnce({ prompt, onEvent }) {
  const model = createModel({
    apiKey: process.env.GEMINI_API_KEY,
    tools: toolDeclarations,
  });
  const runTool = createToolRunner(SANDBOX);
  return runAgent({ model, prompt, runTool, onEvent });
}

module.exports = { runOnce };
