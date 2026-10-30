# ShipIt Pitch Demo Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A demo-ready ShipIt: qtzx-style landing → "try it" → editor where a photo becomes a templated bakery site, the user clicks elements and speaks changes as pins, presses Ship once, and ShipIt applies them, tests the site like a customer, fixes what it finds, and shows before/after plus a plain-English summary.

**Architecture:** Express backend owns everything that touches files or models: templates are filled deterministically into immutable per-run version folders (`workspaces/<runId>/v1`, `v2`, …) served at `/preview/...`; Gemini handles photo extraction, transcription, pin edits and QA fixes through the existing agent loop; Playwright runs QA. Every long operation streams Server-Sent Events, and every run's events are recorded so the frontend can replay a real run offline. The React editor drives a small state machine and reads the preview iframe's DOM directly (same origin via the Vite proxy) to pick elements.

**Tech Stack:** Node 25 (CommonJS, `node:test`), Express 5, `@google/generative-ai`, Playwright; React 19 + Vite 8 + Tailwind 4, Three.js / @react-three/fiber, GSAP, Lenis, Framer Motion, Vitest (+ jsdom); optional Electron.

**Spec:** `docs/superpowers/specs/2026-10-29-shipit-pitch-demo-design.md`

## Global Constraints

- Build done by **2026-11-04**; event 2026-11-07. Prefer reliability and polish over features.
- Model: `GEMINI_MODEL` env, default `gemini-2.5-flash`; fallback `gemini-2.5-flash-lite`. No Pro, no Ollama.
- Generated sites are frontend-only (plain HTML/CSS), no backend/db/deploy.
- No faked results: QA checks and fixes shown must really run. Replay only replays a real recorded run.
- Visual style: near-black `#0a0a0a`, serif display **Yeseva One**, sans **DM Sans** / **Geist**, lowercase terse copy, slow WebGL glow. Editor: same palette, calmer, the site is the focus.
- Editable template elements carry a stable `data-sid` attribute; agents must never remove or rename them.
- Preview updates only when Ship finishes (new version folder); never show a half-edited version.
- Voice uses `MediaRecorder` + Gemini transcription (not Web Speech API).
- **Working style:** implement one task at a time; after each task, stop and explain to the user in plain words what was built, which files, and how data flows, before starting the next.

## Review Focus

1. **A photo that isn't a menu (blurry, a selfie, no prices)** — extraction must still return a usable business object with defaults; the build never crashes. Test in Task 5.
2. **Clicking something that isn't editable (page background, whitespace, a child span)** — picker walks up to the nearest `[data-sid]`; if there is none the click does nothing. Test in Task 7.
3. **Ship pressed with zero pins, or pressed twice** — Ship is disabled with no pins and while shipping. Test in Task 6.
4. **Agent edit strips `data-sid` attributes** — ship prompt forbids it and QA has a check that fails if any `data-sid` from the previous version is missing, triggering a fix. Test in Tasks 9/10.
5. **Mic denied or transcription fails (e.g. offline)** — the pin falls back to a text field the user can type into; nothing is lost. Test in Task 8.

---

## File Structure

```
backend/
  src/index.js                     modify: mount new routers, static /preview, 15mb json
  src/agent/loop.js                modify: tool errors, multi-call, maxSteps, abort
  src/agent/tools.js               modify: paths confined to root
  src/agent/gemini.js              modify: env model, generic createModel, withRetry
  src/templates/fill.js            create: deterministic template filling (pure)
  src/workspace/workspace.js       create: runIds, version folders
  src/vision/extract.js            create: photo -> Business JSON
  src/voice/transcribe.js          create: audio -> text
  src/qa/runQa.js                  create: Playwright checks + screenshots
  src/ship/prompts.js              create: ship/fix prompts + summary parsing (pure)
  src/ship/ship.js                 create: ship orchestration
  src/runs/recorder.js             create: record/replay SSE events
  src/routes/sse.js                create: openSse(res) helper
  src/routes/build.js              create: POST /api/build
  src/routes/transcribe.js         create: POST /api/transcribe
  src/routes/ship.js               create: POST /api/ship
  src/routes/replay.js             create: GET /api/replay/:runId/:phase
  src/agent/runner.js, src/routes/run.js, sandbox/   delete (Task 10)
  templates/hearth/{index.html,styles.css}   create (warm rustic, has the dead "order" link)
  templates/atelier/{index.html,styles.css}  create (modern minimal)
  test/*.test.js                   create
  workspaces/, recordings/         runtime, gitignored
frontend/
  src/App.jsx                      modify: / and /try routes
  src/lib/sse.js                   create: parseSseChunk + streamSse
  src/editor/editorReducer.js      create: editor state machine (pure)
  src/editor/api.js                create: build/ship/transcribe/replay calls
  src/routes/Editor.jsx            create: editor page
  src/editor/PhotoDrop.jsx, BuildStatus.jsx, SitePreview.jsx, PinLayer.jsx,
             VoiceButton.jsx, useRecorder.js, picker.js, ShipPanel.jsx,
             BeforeAfter.jsx, SummaryCard.jsx      create
  src/routes/Landing.jsx           rewrite (Task 13)
  src/components/landing/GlowShader.jsx, IntroLoader.jsx   create (Task 13)
  src/routes/Agent.jsx, components/{Pipeline,Stream,RightPanel,RunSpec}.jsx,
    components/events/*, data/{timeline,nodes}.js           delete (Task 6)
  electron/main.cjs                create (Task 14, optional)
```

### Event contract (SSE `data:` JSON lines, used by Tasks 5, 6, 10, 11, 12)

| type | fields | phase |
|---|---|---|
| `status` | `text` | build, ship |
| `extracted` | `business` | build |
| `built` | `runId, version, previewUrl` | build |
| `tool_call` / `tool_result` | as today in `loop.js` | ship |
| `qa_check` | `id, label, ok, detail` | ship |
| `qa_fix` | `text` | ship |
| `shipped` | `runId, version, previewUrl, beforeShot, afterShot, summary: {changes: string[], tests: {label, ok}[]}` | ship |
| `error` | `message` | any |

`Business` = `{ name: string, tagline: string, vibe: 'warm'|'minimal', palette: { bg, ink, accent } (hex), items: {name, price, note}[] (max 8), hours: string, address: string }`

---

### Task 1: Harden the agent loop and tools

**Files:**
- Modify: `backend/src/agent/loop.js`, `backend/src/agent/tools.js`, `backend/package.json` (add `"test": "node --test"`)
- Test: `backend/test/loop.test.js`, `backend/test/tools.test.js`

**Interfaces:**
- Produces: `runAgent(model, prompt, runTool, onEvent = () => {}, { maxSteps = 25, signal } = {}) -> Promise<string>` (positional, matching current style). `createToolRunner(rootPath) -> (call) => string` — never throws for tool failures; returns `"ERROR: <message>"`.

- [ ] **Step 1: Write failing tests** with a fake model (`startChat()` returns `{ sendMessage }` scripted from an array of responses, each `{ response: { functionCalls: () => [...]|undefined, text: () => '...' } }`):
  - `returns tool errors to the model instead of throwing`: `runTool` throws → run completes, the next `sendMessage` payload contains a `functionResponse` whose `response.content` starts with `"ERROR:"`.
  - `answers every function call in a turn`: model returns 2 calls in one turn → `runTool` called twice, next `sendMessage` receives an array of 2 `functionResponse` parts.
  - `stops after maxSteps`: model always returns a call → with `maxSteps: 3`, resolves and emits `{type:'error', message: /step limit/}` then `done`.
  - `stops when signal aborts`: abort before 2nd step → no further `runTool` calls.
  - tools: `read_file('../../etc/passwd')` returns string starting `"ERROR:"`; `read_file('missing.txt')` returns `"ERROR:"…`; `write_file('a/b.txt')` then `read_file('a/b.txt')` round-trips.
- [ ] **Step 2: Run** `cd backend && npm test` → FAIL.
- [ ] **Step 3: Implement.** In `tools.js` add `resolveInside(root, p)` (`path.resolve`, reject if result isn't `root` or under `root + path.sep`) and wrap dispatch in try/catch returning `ERROR: ${err.message}`. In `loop.js` loop over all `functionCalls()`, build one array of `functionResponse` parts, increment step per call, check `signal?.aborted` and `maxSteps` before each turn.
- [ ] **Step 4: Run** `npm test` → PASS.
- [ ] **Step 5: Commit** `feat(agent): survive tool errors, multi-call turns, step limit, abort`.

### Task 2: Model config and retry

**Files:**
- Modify: `backend/src/agent/gemini.js`
- Test: `backend/test/gemini.test.js`

**Interfaces:**
- Produces: `createModel({ apiKey, tools, systemInstruction, modelName = process.env.GEMINI_MODEL || 'gemini-2.5-flash' })` (tools and systemInstruction optional, so vision/voice can reuse it); `SYSTEM_INSTRUCTION` exported; `withRetry(fn, { retries = 3, baseMs = 800, onFallback } = {}) -> Promise` — retries when the error message contains `429` or `503`, exponential backoff; on final failure calls `onFallback()` once if given and returns its result.

- [ ] **Step 1: Failing tests:** `withRetry` resolves after two 429 failures (fn called 3×, use `baseMs: 1`); does not retry a 400; calls `onFallback` after exhausting retries; `createModel` without `tools` doesn't pass a `tools` key (inspect via a stubbed `GoogleGenerativeAI` passed as optional 2nd arg `genAIClass`).
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** in `gemini.js`, and wrap each `chat.sendMessage` in `loop.js` with `withRetry` (retry only, no fallback inside a chat). Update `SYSTEM_INSTRUCTION`: workspace is a static HTML/CSS site; never remove or rename `data-sid` attributes; final reply is one line per change starting with `- `.
- [ ] **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(agent): configurable model and retry with fallback`.

### Task 3: Templates and deterministic fill

**Files:**
- Create: `backend/templates/hearth/index.html`, `styles.css`; `backend/templates/atelier/index.html`, `styles.css`; `backend/src/templates/fill.js`
- Test: `backend/test/fill.test.js`

**Interfaces:**
- Produces: `fillTemplate(html: string, business: Business) -> string`; `TEMPLATE_IDS = ['hearth', 'atelier']`; `pickTemplate(business) -> 'hearth'|'atelier'` (`vibe === 'minimal'` → atelier, else hearth).

Template rules: slots are `{{name}}`, `{{tagline}}`, `{{hours}}`, `{{address}}`, CSS vars `{{bg}} {{ink}} {{accent}}` in a `<style>:root{...}</style>` block; menu items live between `<!--items-->` and `<!--/items-->` with one prototype row using `{{item.name}} {{item.price}} {{item.note}}` and `data-sid="item-{{i}}"`. Every editable element (nav, hero title, tagline, each menu row, buttons, hours, footer) has a unique `data-sid`. **hearth** includes a nav/hero button `<a data-sid="cta-order" href="#order">order ahead</a>` with **no** `#order` section — the real defect QA finds. Design both to premium quality (use the `high-end-visual-design` skill): hearth = warm, serif, cream/brown; atelier = minimal, lots of whitespace. Photos: CSS gradients or bundled royalty-free images in the template folder.

- [ ] **Step 1: Failing tests:** filled output contains `business.name`, no leftover `{{`; 3 items → exactly 3 `data-sid="item-0|1|2"` rows; HTML in business fields is escaped (`<script>` → `&lt;script&gt;`); 0 items → items block empty, no crash; `pickTemplate({vibe:'minimal'}) === 'atelier'`; both real template files fill without leftover `{{` and every `data-sid` is unique.
- [ ] **Step 2: Run** → FAIL.
- [ ] **Step 3: Implement** `fill.js` (string replacement + escape; repeat the prototype row per item) and the two templates.
- [ ] **Step 4: Run** → PASS. Then open both filled templates in a browser at 1440px and 390px and check they look premium.
- [ ] **Step 5: Commit** `feat(templates): hearth and atelier templates with deterministic fill`.

### Task 4: Workspaces and preview serving

**Files:**
- Create: `backend/src/workspace/workspace.js`
- Modify: `backend/src/index.js` (static `app.use('/preview', express.static(WORKSPACES_DIR))`, json limit `15mb`), `.gitignore` (`backend/workspaces/`, `backend/recordings/`)
- Test: `backend/test/workspace.test.js`

**Interfaces:**
- Produces: `WORKSPACES_DIR` (env `SHIPIT_WORKSPACES` or `backend/workspaces`); `createRun() -> runId` (`crypto.randomUUID().slice(0,8)`); `writeVersion(runId, version: number, files: {[name]: string}) -> dir`; `copyVersion(runId, from, to) -> dir`; `versionDir(runId, v)`; `latestVersion(runId) -> number`; `previewUrl(runId, v) -> '/preview/<runId>/v<v>/index.html'`.

- [ ] **Step 1: Failing tests** (temp dir via env): write v1, copy to v2, editing v2 leaves v1 unchanged; `latestVersion` returns 2; `previewUrl('ab12', 2) === '/preview/ab12/v2/index.html'`; `versionDir` rejects a runId containing `..`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement** with `fs.cpSync(..., {recursive:true})`. **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(workspace): immutable per-run version folders served at /preview`.

### Task 5: Photo → site build endpoint (with recording)

**Files:**
- Create: `backend/src/vision/extract.js`, `backend/src/runs/recorder.js`, `backend/src/routes/sse.js`, `backend/src/routes/build.js`
- Modify: `backend/src/index.js` (mount build router)
- Test: `backend/test/extract.test.js`, `backend/test/recorder.test.js`, `backend/test/build.test.js`

**Interfaces:**
- Consumes: `createModel`, `withRetry` (Task 2); `fillTemplate`, `pickTemplate` (Task 3); workspace fns (Task 4).
- Produces:
  - `normalizeBusiness(raw: unknown) -> Business` (pure; defaults: name `"your bakery"`, tagline `""`, vibe `'warm'`, palette hearth defaults, items `[]`, prices kept as strings, max 8 items, hex colors validated).
  - `extractBusiness(model, { imageBase64, mimeType, sentence }) -> Promise<Business>` — asks for JSON only (`generationConfig.responseMimeType = 'application/json'`), then `normalizeBusiness`.
  - `openSse(res) -> { send(event), signal }` (headers from today's `run.js`; `signal` is an `AbortSignal` aborted on `res.on('close')`, so a closed browser tab stops the run); `createRecorder(runId, phase) -> { record(event), save() }` writing `recordings/<runId>/<phase>.json` as `[{t: msSinceStart, event}]`; `loadRecording(runId, phase)`.
  - `POST /api/build` body `{ imageBase64, mimeType, sentence }` → SSE: `status` ("reading your photo"), `extracted`, `status` ("building your site"), `built`. Snapshots: on `built`, copy `v1` into `recordings/<runId>/v1`.
  - `createBuildRouter({ extract = extractBusiness } = {})` so tests inject a fake extractor.

- [ ] **Step 1: Failing tests:** `normalizeBusiness({})` returns full defaults; `normalizeBusiness({items: 20 items, palette:{bg:'red'}})` → 8 items, default bg; `normalizeBusiness('garbage')` doesn't throw (Review Focus 1). Recorder: record 2 events, save, load → same events with increasing `t`. Build route (supertest-free: start app on port 0, `fetch`, read body text): with a fake extractor emits `extracted` then `built` with a `previewUrl` whose file exists; missing `imageBase64` → 400; extractor throws → stream contains `error`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual check:** `curl` the endpoint with a real bakery menu photo (base64) and open the `previewUrl`.
- [ ] **Step 6: Commit** `feat(build): photo to filled template with recorded SSE stream`.

### Task 6: Editor shell — photo drop, live build status, preview

**Files:**
- Create: `frontend/src/lib/sse.js`, `frontend/src/editor/editorReducer.js`, `frontend/src/editor/api.js`, `frontend/src/routes/Editor.jsx`, `frontend/src/editor/PhotoDrop.jsx`, `BuildStatus.jsx`, `SitePreview.jsx`
- Modify: `frontend/src/App.jsx` (`/try` → Editor; `/agent` → `<Navigate to="/try">`), `frontend/vite.config.js` (proxy `/preview` and `/recordings` too; vitest `environment: 'jsdom'`), `frontend/package.json` (devDeps `vitest`, `jsdom`; `"test": "vitest run"`; dep `framer-motion`)
- Delete: `routes/Agent.jsx`, `components/{Pipeline,Stream,RightPanel,RunSpec}.jsx`, `components/events/`, `data/timeline.js`, `data/nodes.js` (keep `TopBar`, primitives, `Icon` if still used)
- Test: `frontend/src/lib/sse.test.js`, `frontend/src/editor/editorReducer.test.js`

**Interfaces:**
- Produces:
  - `parseSseChunk(buffer: string) -> { events: object[], rest: string }` (logic lifted from today's `Agent.jsx`); `streamSse(url, { method='POST', body, signal, onEvent }) -> Promise<void>`.
  - `api.build({ imageBase64, mimeType, sentence }, onEvent, signal)`, `api.ship(...)`, `api.transcribe(...)`, `api.replay(runId, phase, onEvent, signal)` — all go through `streamSse` / `fetch`.
  - `initialState = { stage: 'photo', runId: null, version: 0, previewUrl: null, business: null, statusLines: [], pins: [], qa: [], result: null, error: null, replay: null }`; `editorReducer(state, action)`; stages `'photo' → 'building' → 'editing' → 'shipping' → 'done'` (`'done'` → `'editing'` on `CONTINUE_EDITING`). Actions: `BUILD_START`, `SSE_EVENT {event}`, `ADD_PIN {sid, rect, label}`, `UPDATE_PIN {id, text, status}`, `REMOVE_PIN {id}`, `SHIP_START`, `CONTINUE_EDITING`, `RESET`. Selector `canShip(state)` = `stage === 'editing' && pins.length > 0 && pins.every(p => p.text.trim())`.

Layout (calm dark): thin top bar, site preview iframe centered and large (rounded frame, subtle shadow), a narrow right rail for status / pins / ship. Use Framer Motion for stage transitions.

- [ ] **Step 1: Failing tests:** `parseSseChunk('data: {"a":1}\n\ndata: {"b"')` → 1 event, rest `'data: {"b"'`; ignores non-`data:` lines and bad JSON. Reducer: `built` event → stage `editing`, `previewUrl` set; `error` during building → stage `photo` with `error`; `canShip` false with 0 pins, false while `shipping`, true with 1 pin with text (Review Focus 3).
- [ ] **Step 2: Run** `cd frontend && npm test` → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual check:** `npm run dev` in both; at `/try` drop a photo + sentence → status lines stream → site appears in the iframe.
- [ ] **Step 6: Commit** `feat(editor): photo drop, live build status, site preview`.

### Task 7: Click-to-pin picker

**Files:**
- Create: `frontend/src/editor/picker.js`, `frontend/src/editor/PinLayer.jsx`
- Modify: `frontend/src/editor/SitePreview.jsx`, `frontend/src/routes/Editor.jsx`
- Test: `frontend/src/editor/picker.test.js`

**Interfaces:**
- Produces: `findSidElement(target: Element) -> Element|null` (nearest ancestor-or-self with `data-sid`, stops at `body`); `attachPicker(iframeDoc, { onHover(el|null), onPick({ sid, rect, label }) }) -> detach()` — hover draws an outline, click is `preventDefault`ed (links don't navigate) and picks; `label` = first 40 chars of `textContent`. Pins render as numbered dots positioned from `rect` (iframe coordinates + iframe offset), with an editable text bubble; clicking an already-pinned `sid` focuses that pin instead of adding another.

- [ ] **Step 1: Failing tests (jsdom):** clicking a `<span>` inside `<h1 data-sid="hero-title">` picks `hero-title`; clicking `body` picks nothing (Review Focus 2); link click is prevented; `detach()` removes listeners (a later click picks nothing).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual check:** hover outlines, click adds pin 1, 2; typed text saved; Ship enables.
- [ ] **Step 6: Commit** `feat(editor): click elements to drop numbered pins`.

### Task 8: Voice on pins

**Files:**
- Create: `backend/src/voice/transcribe.js`, `backend/src/routes/transcribe.js`, `frontend/src/editor/useRecorder.js`, `frontend/src/editor/VoiceButton.jsx`
- Modify: `backend/src/index.js`, `frontend/src/editor/PinLayer.jsx`
- Test: `backend/test/transcribe.test.js`, `frontend/src/editor/useRecorder.test.js`

**Interfaces:**
- Produces: `transcribe(model, { audioBase64, mimeType }) -> Promise<string>`; `POST /api/transcribe` `{ audioBase64, mimeType }` → `200 {text}` | `400 {error}` (missing/empty audio) | `502 {error}` (model failed); `createTranscribeRouter({ transcribeFn })`. `useRecorder() -> { state: 'idle'|'recording'|'busy'|'error', start(), stop() -> Promise<{base64, mimeType}|null>, error }`. VoiceButton is hold-to-talk; on success fills the pin text (still editable); on any failure shows "couldn't hear that — type it instead" and focuses the text field.

- [ ] **Step 1: Failing tests:** route: empty audio → 400; `transcribeFn` throws → 502 with message; success → `{text}`. Hook (jsdom, stub `navigator.mediaDevices.getUserMedia` rejecting): `start()` → `state === 'error'` (Review Focus 5).
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual check:** hold mic on a pin, say "make this bigger", text appears.
- [ ] **Step 6: Commit** `feat(voice): hold-to-talk pin notes via Gemini transcription`.

### Task 9: QA runner

**Files:**
- Create: `backend/src/qa/runQa.js`, `backend/test/fixtures/broken/index.html`, `backend/test/fixtures/clean/index.html`
- Modify: `backend/package.json` (dep `playwright`; run `npx playwright install chromium`)
- Test: `backend/test/qa.test.js`

**Interfaces:**
- Produces: `runQa({ url, expectedSids = [], shotsDir }) -> Promise<{ checks: Check[], shots: { desktop, phone } }>` with `Check = { id, label, ok, detail }`. Check ids and labels (plain English, shown on stage):
  - `links` — "every button and link goes somewhere" (each `a[href^="#"]` target id exists; no empty `href`)
  - `console` — "no errors when the page loads"
  - `phone` — "fits on a phone screen" (390×844: `scrollWidth <= 390`)
  - `images` — "all images load"
  - `sids` — "nothing editable went missing" (every `expectedSids` present; Review Focus 4)
  Screenshots: 1440×900 desktop and 390×844 phone PNGs into `shotsDir`. Reuse one browser per call; close it in `finally`.

- [ ] **Step 1: Failing tests** (serve fixtures via `file://` URL): `broken` (dead `#order` link, 600px-wide element) → `links.ok === false` with `detail` naming `#order`, `phone.ok === false`; `clean` → all ok; `expectedSids: ['gone']` → `sids.ok === false`; both screenshot files exist.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Commit** `feat(qa): playwright customer-style checks with screenshots`.

### Task 10: Ship endpoint

**Files:**
- Create: `backend/src/ship/prompts.js`, `backend/src/ship/ship.js`, `backend/src/routes/ship.js`
- Modify: `backend/src/index.js`
- Delete: `backend/src/agent/runner.js`, `backend/src/routes/run.js`, `backend/sandbox/`
- Test: `backend/test/prompts.test.js`, `backend/test/ship.test.js`

**Interfaces:**
- Consumes: `runAgent` (Task 1), `createModel`/`withRetry`/`SYSTEM_INSTRUCTION` (Task 2), workspace fns (Task 4), `openSse`/`createRecorder` (Task 5), `runQa` (Task 9).
- Produces:
  - `buildShipPrompt(pins: {sid, text, label}[]) -> string` — numbered list "1. element `data-sid="<sid>"` (currently "<label>"): <text>"; plus rules: edit only `index.html`/`styles.css`, keep every `data-sid`.
  - `buildFixPrompt(failed: Check[]) -> string`; `parseSummary(text) -> string[]` (lines starting `- `, trimmed; fallback `[text.trim()]` if none).
  - `shipRun({ runId, pins, onEvent, signal, model, qa = runQa, agent = runAgent }) -> Promise<ShippedEvent>`:
    1. `from = latestVersion(runId)`, `to = from + 1`, `copyVersion`; collect `expectedSids` from `from`'s `index.html`.
    2. `status` "applying your N changes"; `agent(model, buildShipPrompt(pins), createToolRunner(versionDir(runId,to)), onEvent, { signal })`.
    3. `status` "testing your site like a customer"; `qa(...)` on `http://localhost:${PORT}${previewUrl(runId,to)}`; emit each `qa_check`.
    4. Up to **2** fix rounds: if any failed → `qa_fix` "found: <label> — fixing it", run agent with `buildFixPrompt`, re-run QA, emit checks again.
    5. Before shot = desktop shot of `from` (taken at step 1), after shot = final desktop shot; emit `shipped` with summary `{ changes: parseSummary(agentText), tests: final checks }`.
  - `POST /api/ship` `{ runId, pins }` → SSE; 400 if `pins` empty or runId unknown; 409 if a ship for this runId is already running (Review Focus 3). Records `recordings/<runId>/ship-<to>.json` and snapshots `v<to>` + shots into `recordings/<runId>/`.

- [ ] **Step 1: Failing tests:** prompts: ship prompt contains every sid and the "keep every data-sid" rule; `parseSummary("- a\n- b")` → `['a','b']`. `shipRun` with fake `agent` (writes a file into the new version) and fake `qa` (fails `links` first call, passes second): emits `qa_check` ok:false, `qa_fix`, then ok:true, `shipped.version === 2`, v1 file unchanged; fake qa failing forever → stops after 2 fix rounds and still emits `shipped` with the failed check listed. Route: empty pins → 400; concurrent second request → 409.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual check (real model):** build the hearth bakery, ship 2 pins, confirm QA catches `#order`, fix lands, v2 previews correctly.
- [ ] **Step 6: Commit** `feat(ship): apply all pins, customer-style QA with fix loop`.

### Task 11: Ship UI — checklist, before/after, summary

**Files:**
- Create: `frontend/src/editor/ShipPanel.jsx`, `BeforeAfter.jsx`, `SummaryCard.jsx`
- Modify: `frontend/src/editor/editorReducer.js`, `frontend/src/routes/Editor.jsx`
- Test: `frontend/src/editor/editorReducer.test.js` (extend)

**Interfaces:**
- Consumes: `api.ship({runId, pins}, onEvent, signal)` and the event contract.
- Produces reducer behavior: `SHIP_START` → stage `shipping`, `qa = []`; `qa_check` upserts by `id` (latest result wins, keeps order); `qa_fix` appends a status line; `shipped` → stage `done`, `previewUrl`/`version` updated, `result = { beforeShot, afterShot, summary }`, pins cleared; `error` during shipping → stage `editing`, pins kept, previous `previewUrl` kept.
  ShipPanel: animated checklist (pending spinner → ✓ / ✗ then ✓ after fix, GSAP or Framer). BeforeAfter: drag slider over the two screenshots. SummaryCard: "what I changed" (`summary.changes`) and "what I tested" (`summary.tests`).

- [ ] **Step 1: Failing tests:** `qa_check` for `links` false then true → one entry, ok true; `shipped` clears pins and sets `result`; `error` while shipping keeps pins and old `previewUrl`.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual check:** full flow end to end on the bakery photo, timed; target ≤ 2 minutes from pins to summary.
- [ ] **Step 6: Commit** `feat(editor): ship checklist, before/after slider, summary card`.

### Task 12: Replay fallback

**Files:**
- Create: `backend/src/routes/replay.js`
- Modify: `backend/src/index.js` (static `/recordings`), `frontend/src/editor/api.js`, `frontend/src/routes/Editor.jsx`
- Test: `backend/test/replay.test.js`

**Interfaces:**
- Produces: `GET /api/replay/:runId/:phase?speed=1` → SSE re-emitting the recorded events with the original gaps (each gap capped at 1500 ms, divided by `speed`), rewriting `previewUrl`/shot paths from `/preview/<runId>/…` to `/recordings/<runId>/…`; 404 if no recording. `GET /api/recordings` → `[{ runId, phases }]`.
  Frontend: env `VITE_DEMO_RUN_ID`; pressing **Shift+R** toggles replay mode (small dot in the top bar, visible only to the presenter). In replay mode `build` and `ship` call `api.replay` for `build` and the latest `ship-*` phase; picking, pins and typed text still work normally.

- [ ] **Step 1: Failing tests:** saved recording with 3 events replays all 3 in order; paths rewritten to `/recordings/`; unknown run → 404.
- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** **Step 4: Run** → PASS.
- [ ] **Step 5: Manual check:** record a real run, stop the backend's internet (or unset `GEMINI_API_KEY`), Shift+R, run the whole demo from the recording.
- [ ] **Step 6: Commit** `feat(replay): replay a real recorded run when offline`.

### Task 13: qtzx-style landing page

**Files:**
- Rewrite: `frontend/src/routes/Landing.jsx`
- Create: `frontend/src/components/landing/GlowShader.jsx`, `IntroLoader.jsx`
- Delete: `frontend/src/components/landing/Scene.jsx` (galaxy) and landing-only components no longer used
- Modify: `frontend/index.html` (Google Fonts: Yeseva One, DM Sans, Geist), `frontend/src/index.css` (tokens)

**Interfaces:**
- Consumes: `hooks/useSmoothScroll` (Lenis), GSAP ScrollTrigger, Framer Motion, @react-three/fiber.
- Content (exact copy): title `SHIP IT.`; line `point at your website. say what to change. press ship once.`; proof lines `photo → site in 90s` · `tested before you see it`; CTA `try it →`. Sections: hero (GlowShader full-bleed, IntroLoader on first load ≤ 1.2 s), demo video (autoplay, muted, loop; `public/demo.mp4`, recorded in Task 11 manual check), how it works (photo · point & speak · ship once — three short beats), closing CTA. "try it →" plays a Framer Motion page transition into `/try`.
  Use the `design-taste-frontend` / `high-end-visual-design` skills. Respect `prefers-reduced-motion` (no shader animation, no intro).

- [ ] **Step 1: Build it.** (Visual task: no unit tests.)
- [ ] **Step 2: Verify:** `npm run build` succeeds; `npm run lint` clean; screenshots at 1440px and 390px look right; no horizontal scroll at 390px; "try it →" lands on `/try`.
- [ ] **Step 3: Commit** `feat(landing): qtzx-style landing with shader hero and demo video`.

### Task 14 (optional): Electron wrap

**Files:**
- Create: `frontend/electron/main.cjs`
- Modify: `frontend/package.json` (devDep `electron`; script `"app": "electron electron/main.cjs"`)

**Interfaces:**
- `main.cjs` opens one `BrowserWindow` (1440×900, `backgroundColor: '#0a0a0a'`, `titleBarStyle: 'hiddenInset'`) loading `process.env.SHIPIT_URL || 'http://localhost:5173'`; grants the `media` permission for the mic via `session.setPermissionRequestHandler`.

- [ ] **Step 1: Build it.** **Step 2: Verify:** with backend + vite running, `npm run app` opens the landing; mic works on a pin; full flow runs. Fallback if not: `open -na "Google Chrome" --args --app=http://localhost:5173`.
- [ ] **Step 3: Commit** `feat(app): electron desktop wrap`.

### After the code (not tasks)

Record the backup video of a full real run; record the replay run used by `VITE_DEMO_RUN_ID`; rehearse the 4-minute pitch with the demo at ~2 minutes.
