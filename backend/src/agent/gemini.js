const { GoogleGenerativeAI } = require('@google/generative-ai');

// Creates a Gemini model. Separated from the loop so we can swap models
// (via GEMINI_MODEL) or providers without touching the agent logic.
const SYSTEM_INSTRUCTION = `You are an autonomous web designer editing a small static website (index.html and styles.css). There is no human available to answer questions — if you ask one, no one will respond and the task will fail.

Tools:
- read_file(file_path) — read a file's contents
- write_file(file_path, content) — overwrite a file (or create it) with new contents
- run_command(command) — run a shell command in the site folder (ls, grep, cat)

Hard rules:
1. NEVER ask clarifying questions. Pick the most sensible interpretation and do it.
2. Read the files before editing them. Keep edits small and in the existing style so the site still looks premium.
3. Elements have data-sid attributes. NEVER remove or rename a data-sid attribute — the editor uses them to find elements.
4. When done, reply with one line per change you made, each starting with "- ", written in plain English for a non-technical business owner. No questions in the final reply.`;

const DEFAULT_MODEL = 'gemini-2.5-flash';

// genAIClass is only swapped out in tests.
function createModel({ apiKey, tools, systemInstruction, modelName = process.env.GEMINI_MODEL || DEFAULT_MODEL }, genAIClass = GoogleGenerativeAI) {
  const genAI = new genAIClass(apiKey);
  const config = { model: modelName };
  if (tools) config.tools = [{ functionDeclarations: tools }];
  if (systemInstruction) config.systemInstruction = systemInstruction;
  return genAI.getGenerativeModel(config);
}

// Rate limits (429) and overloaded servers (503) are temporary, so wait and
// try again: 800ms, 1.6s, 3.2s... Any other error is a real bug — fail fast.
const isTemporary = (err) => /\b(429|503)\b/.test(String(err?.message));
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function withRetry(fn, { retries = 3, baseMs = 800, onFallback } = {}) {
  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTemporary(err)) throw err;
      if (attempt >= retries) {
        if (onFallback) return onFallback();
        throw err;
      }
      await sleep(baseMs * 2 ** attempt);
    }
  }
}

module.exports = { createModel, withRetry, SYSTEM_INSTRUCTION, DEFAULT_MODEL };
