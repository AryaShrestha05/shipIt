const retry = require('../ai/retry');

// The agent loop — the "brain". Pure logic, no I/O.
//
// Caller provides:
//   model    — the AI's chat model (from ai.chatModel in src/ai/)
//   prompt   — the user's task description
//   runTool  — function that actually executes tool calls (from tools.js)
//   onEvent  — callback, called on every step (prompt, tool_call,
//              tool_result, error, done). Streams live updates to the browser.
//   options  — maxSteps: a cap on tool calls so a confused model can't loop
//              forever (default 25). signal: an AbortSignal so a closed
//              browser tab stops the run (optional).
async function runAgent(model, prompt, runTool, onEvent, options) {
  if (!onEvent) onEvent = function () {};
  if (!options) options = {};
  const maxSteps = options.maxSteps || 25;
  const signal = options.signal;

  function stopped() {
    return Boolean(signal && signal.aborted);
  }

  const chat = model.startChat();

  onEvent({ type: 'user_prompt', content: prompt });

  let result = await retry.withRetry(function () {
    return chat.sendMessage(prompt);
  });
  //gemini returns an array of the tools that it wants to run, or nothing.
  //|| [] turns "nothing" into an empty list so the loop just ends.
  let calls = result.response.functionCalls() || [];
  let step = 0;

  while (calls.length > 0) {
    if (stopped()) break;
    if (step >= maxSteps) {
      onEvent({ type: 'error', message: 'Stopped: hit the step limit (' + maxSteps + ')' });
      break;
    }

    // Gemini can ask for several tools in one turn; every one needs an answer.
    const responses = [];
    for (const call of calls) {
      if (step >= maxSteps || stopped()) break;
      step++;
      onEvent({ type: 'tool_call', step: step, name: call.name, args: call.args });

      let toolOutput;
      try {
        toolOutput = runTool(call);
      } catch (err) {
        toolOutput = 'ERROR: ' + err.message;
      }
      onEvent({ type: 'tool_result', step: step, name: call.name, output: toolOutput });

      responses.push({ functionResponse: { name: call.name, response: { content: toolOutput } } });
    }
    if (stopped()) break;

    result = await retry.withRetry(function () {
      return chat.sendMessage(responses);
    });
    calls = result.response.functionCalls() || [];
  }

  // After an early stop the last response is a tool request, not text.
  let finalText = '';
  if (calls.length === 0) finalText = result.response.text();
  onEvent({ type: 'done', text: finalText });
  return finalText;
}

module.exports = { runAgent: runAgent };
