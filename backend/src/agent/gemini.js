const googleAI = require('@google/generative-ai');

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

// options:
//   apiKey            — the Gemini API key (required)
//   tools             — tool declarations the model may call (optional)
//   systemInstruction — the model's rulebook (optional)
//   modelName         — which Gemini model (optional; GEMINI_MODEL env or DEFAULT_MODEL)
// genAIClass is only swapped out in tests.
function createModel(options, genAIClass) {
  if (!genAIClass) genAIClass = googleAI.GoogleGenerativeAI;
  const modelName = options.modelName || process.env.GEMINI_MODEL || DEFAULT_MODEL;

  const genAI = new genAIClass(options.apiKey);
  const config = { model: modelName };
  if (options.tools) config.tools = [{ functionDeclarations: options.tools }];
  if (options.systemInstruction) config.systemInstruction = options.systemInstruction;
  return genAI.getGenerativeModel(config);
}

// Rate limits (429) and overloaded servers (503) are temporary, so wait and
// try again: 800ms, 1.6s, 3.2s... Any other error is a real bug — fail fast.
function isTemporary(err) {
  return /\b(429|503)\b/.test(String(err && err.message));
}

function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// options:
//   retries    — how many times to try again (default 3)
//   baseMs     — first wait in milliseconds, doubles each time (default 800)
//   onFallback — called once if every retry failed; its result is returned (optional)
async function withRetry(fn, options) {
  if (!options) options = {};
  const retries = options.retries === undefined ? 3 : options.retries;
  const baseMs = options.baseMs === undefined ? 800 : options.baseMs;

  for (let attempt = 0; ; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (!isTemporary(err)) throw err;
      if (attempt >= retries) {
        if (options.onFallback) return options.onFallback();
        throw err;
      }
      await sleep(baseMs * 2 ** attempt);
    }
  }
}

module.exports = {
  createModel: createModel,
  withRetry: withRetry,
  SYSTEM_INSTRUCTION: SYSTEM_INSTRUCTION,
  DEFAULT_MODEL: DEFAULT_MODEL,
};
