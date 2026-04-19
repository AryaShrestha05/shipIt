// The agent loop — the "brain". Pure logic, no I/O.
//
// Caller provides:
//   model    — a Gemini model (from gemini.js)
//   prompt   — the user's task description
//   runTool  — function that actually executes tool calls (from tools.js)
//   onEvent  — optional callback, called on every step (prompt, tool_call,
//              tool_result, done). Used to log to console during dev, or to
//              stream live updates to the browser later.
async function runAgent({ model, prompt, runTool, onEvent = () => {} }) {
  const chat = model.startChat();

  onEvent({ type: 'user_prompt', content: prompt });

  let result = await chat.sendMessage(prompt);
  let call = result.response.functionCalls()?.[0];
  let step = 1;

  while (call) {
    onEvent({ type: 'tool_call', step, name: call.name, args: call.args });

    const toolOutput = runTool(call);
    onEvent({ type: 'tool_result', step, name: call.name, output: toolOutput });

    result = await chat.sendMessage([
      { functionResponse: { name: call.name, response: { content: toolOutput } } },
    ]);
    call = result.response.functionCalls()?.[0];
    step++;
  }

  const finalText = result.response.text();
  onEvent({ type: 'done', text: finalText });
  return finalText;
}

module.exports = { runAgent };
