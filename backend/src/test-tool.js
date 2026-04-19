// Local tester: runs the agent on the sandbox folder and logs every step.
// This is NOT the Express server. Run directly with `node src/test-tool.js`
// to try things without a frontend.
require('dotenv').config();
const path = require('path');
const util = require('util');

const { toolDeclarations, createToolRunner } = require('./agent/tools');
const { createModel } = require('./agent/gemini');
const { runAgent } = require('./agent/loop');

const SANDBOX = path.join(__dirname, '..', 'sandbox');

function show(label, obj) {
  console.log(`\n${'═'.repeat(60)}`);
  console.log(`🔍 ${label}`);
  console.log('═'.repeat(60));
  console.log(util.inspect(obj, { depth: 4, colors: true, maxStringLength: 200 }));
}

// Turn structured agent events into pretty console output
function logEvent(event) {
  if (event.type === 'user_prompt') {
    show('USER PROMPT', event.content);
  } else if (event.type === 'tool_call') {
    show(`Step ${event.step} — CALL ${event.name}`, event.args);
  } else if (event.type === 'tool_result') {
    show(`Step ${event.step} — RESULT`, event.output);
  } else if (event.type === 'done') {
    show('AGENT DONE — final answer', event.text);
  }
}

async function main() {
  const model = createModel({
    apiKey: process.env.GEMINI_API_KEY,
    tools: toolDeclarations,
  });

  const runTool = createToolRunner(SANDBOX);

  await runAgent({
    model,
    prompt:
      'In app.js, change main() so it greets two users: "Arya" and "Sam". Then run the file with "node app.js" to verify it works. If it fails, fix it and re-run.',
    runTool,
    onEvent: logEvent,
  });
}

main().catch(err => console.error('Error:', err.message));
