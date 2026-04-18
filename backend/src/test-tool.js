require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');
const fs = require('fs');
const path = require('path');

const SANDBOX = path.join(__dirname, '..', 'sandbox');

// 1. Define the tool — describes what it does to Gemini
const readFileTool = {
  name: 'read_file',
  description: 'Reads the contents of a file from the repository.',
  parameters: {
    type: 'object',
    properties: {
      file_path: {
        type: 'string',
        description: 'Path to the file, relative to the repo root (e.g. "app.js")',
      },
    },
    required: ['file_path'],
  },
};

// 2. The actual function that runs when Gemini calls the tool
function readFile(args) {
  const fullPath = path.join(SANDBOX, args.file_path);
  return fs.readFileSync(fullPath, 'utf8');
}

async function runAgent() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
  const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash-lite',
    tools: [{ functionDeclarations: [readFileTool] }],
  });

  const chat = model.startChat();
  const userPrompt = 'What does the main function in app.js do? Read the file first.';
  console.log('USER:', userPrompt);

  // Send the initial prompt
  let result = await chat.sendMessage(userPrompt);
  let call = result.response.functionCalls()?.[0];

  // Loop while Gemini wants to call tools
  while (call) {
    console.log('\nAGENT wants to call:', call.name, call.args);
    const toolOutput = readFile(call.args);
    console.log('TOOL returned:', toolOutput.slice(0, 80) + '...');

    result = await chat.sendMessage([
      { functionResponse: { name: call.name, response: { content: toolOutput } } },
    ]);
    call = result.response.functionCalls()?.[0];
  }

  console.log('\nAGENT final answer:', result.response.text());
}

runAgent().catch(err => console.error('Error:', err.message));
