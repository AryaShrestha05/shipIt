# ShipIt

From prompt to pull request, autonomously. ShipIt reads your repo, writes the code, runs the tests, debugs its own failures, and ships a PR.

---

## Architecture — file-to-file flow

Two halves: an **Express backend** that runs the agent loop, and a **React frontend** that visualizes it.

### High-level diagram

```
┌──────────────────────────── BROWSER ────────────────────────────┐
│                                                                 │
│   main.jsx ──► App.jsx ──► <Router>                             │
│                              ├── /        → routes/Landing.jsx  │
│                              └── /agent   → routes/Agent.jsx    │
│                                                  │              │
│                              ┌───────────────────┼───────────┐  │
│                              ▼          ▼        ▼           ▼  │
│                          RunSpec    Pipeline   Stream   RightPanel
│                          (inputs)   (phases)  (events)  (details) │
│                                                                 │
└──────────────────────────────┬──────────────────────────────────┘
                               │  POST /api/run  (Server-Sent Events)
                               ▼
┌──────────────────────────── BACKEND ────────────────────────────┐
│                                                                 │
│   index.js  (Express boot, CORS, /health)                       │
│       │                                                         │
│       └─► routes/run.js   ── opens SSE stream ──┐               │
│                                                 │               │
│                        ┌────────────────────────┘               │
│                        ▼                                        │
│              agent/runner.js   (orchestrator)                   │
│                  │     │     │                                  │
│         ┌────────┘     │     └────────┐                         │
│         ▼              ▼              ▼                         │
│   agent/gemini.js  agent/tools.js  agent/loop.js                │
│   (LLM model)      (read/write/    (chat ↔ tool calls,          │
│                     run_command)    emits events)               │
│                        │                                        │
│                        ▼                                        │
│                   sandbox/   (target filesystem)                │
│                                                                 │
│   github/client.js  (clone, push, PR — wired in next)           │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Request lifecycle

```
user clicks Run
    │
    ▼
Agent.jsx run()  ──fetch──►  POST /api/run  { prompt }
                                    │
                                    ▼
                            routes/run.js
                            res.setHeader('text/event-stream')
                                    │
                                    ▼
                            runner.runOnce({ prompt, onEvent })
                                    │
                                    ├─ createModel(GEMINI_API_KEY)      ◄── gemini.js
                                    ├─ createToolRunner(SANDBOX)        ◄── tools.js
                                    └─ runAgent({ model, runTool, … })  ◄── loop.js
                                                │
                                                ▼
                                    ┌───────────────────────────┐
                                    │  while (functionCall):    │
                                    │    onEvent(tool_call)     │ ──► SSE ──► Stream.jsx
                                    │    output = runTool(call) │
                                    │    onEvent(tool_result)   │ ──► SSE ──► Stream.jsx
                                    │    chat.send(output)      │
                                    │  onEvent(done)            │ ──► SSE ──► Stream.jsx
                                    └───────────────────────────┘
```

---

## Backend — request → agent → response

**`backend/src/index.js`** — entry point. Boots Express, mounts CORS + JSON middleware, exposes `/health`, delegates `/api/*` to `routes/run.js`.

**`backend/src/routes/run.js`** — the only real endpoint, `POST /api/run`. Doesn't return JSON; flips the response into **Server-Sent Events** mode (because runs take 30–90s) and forwards each event to the browser via a `send()` callback. Calls `runner.runOnce({ prompt, onEvent: send })`.

**`backend/src/agent/runner.js`** — the orchestrator. Wires three things together:
- `gemini.createModel()` → the LLM
- `tools.createToolRunner(SANDBOX)` → the "hands"
- `loop.runAgent({ model, prompt, runTool, onEvent })` → the brain

Currently points at `backend/sandbox/` (a tiny `app.js` for testing). The runner is the seam where a fresh git clone gets swapped in later.

**`backend/src/agent/gemini.js`** — thin wrapper around `GoogleGenerativeAI`. Builds a model with tool declarations attached. Isolated so providers/models can be swapped without touching the loop.

**`backend/src/agent/tools.js`** — two exports:
1. `toolDeclarations` — JSON schemas Gemini sees (`read_file`, `write_file`, `run_command`).
2. `createToolRunner(rootPath)` — factory that closes over a directory and returns a dispatcher. Factory pattern so the same tools can target the sandbox now and a cloned repo later.

**`backend/src/agent/loop.js`** — pure logic, no I/O. `runAgent()` starts a chat, sends the prompt, then loops: while Gemini returns a `functionCall`, hand it to `runTool`, ship the result back, repeat. Emits `user_prompt` → `tool_call` → `tool_result` → `done` through `onEvent`, which `routes/run.js` pipes to SSE.

**`backend/src/github/client.js`** — sits on the side, not yet wired into the runner. Has `cloneRepo`, `pushBranch`, `createPR` ready for when block 2 connects real repos and PR creation.

---

## Frontend — landing → agent console

**`frontend/src/main.jsx`** — mounts `<App>` inside `<BrowserRouter>`.

**`frontend/src/App.jsx`** — two routes: `/` → `Landing`, `/agent` → `Agent`.

**`routes/Landing.jsx`** — marketing page. Composes `Nav`, `Hero` (with a Three.js `components/landing/Scene.jsx` galaxy), `Metrics`, `HowItWorks`, `Phases`, `CTA`, `Footer`. Uses primitives (`Btn`, `Tag`, `Card`), `Icon`, the `Reveal` scroll-in wrapper, and `hooks/useSmoothScroll`. Every CTA links to `/agent`.

**`routes/Agent.jsx`** — the console. Owns run state (`events`, `running`, `done`) and lays out four panels:

```
┌──────────────────── TopBar ────────────────────┐
├──────────┬──────────────────────────┬──────────┤
│          │       Pipeline           │          │
│ RunSpec  │  (phase nodes)           │ RightPanel
│  repo    ├──────────────────────────┤  details │
│  prompt  │       Stream             │  for     │
│  Run     │  (live event feed)       │  current │
│  Reset   │                          │  phase   │
└──────────┴──────────────────────────┴──────────┘
```

Each event in the stream renders through one of the `components/events/Event*.jsx` (Phase, Tool, Diff, Test, Log, PR) based on its type.

---

## The gap that's still open

The backend streams real Gemini tool calls over SSE; `Agent.jsx` currently fakes it with a canned `TIMELINE` from `data/timeline.js` replayed via `setTimeout`. Wiring `run()` to `fetch('/api/run')` + an SSE reader, and mapping backend event types (`tool_call`, `tool_result`, `done`) to the frontend's event renderers, is the bridge that closes the loop.

```
[ runner.js ──► SSE ] ────?────► [ Agent.jsx run() ]
       built                          still mocked
```
