# ShipIt — Innovation Challenge Demo Design

**Date:** 2026-10-29 · **Event:** Marist Innovation Challenge, Software track, Nov 7 2026 9:00 am · **Build done by:** Nov 4 (leaves 3 days to rehearse)

## Intent

Win as much prize money as possible at a 4-minute pitch competition (judged on Feasibility, Originality, Market Potential, Pitch Persuasiveness; theme "improving quality of life"). The pitch thesis: AI models keep getting better, but **the human is the bottleneck** — today you prompt, wait, say "change this", wait, repeat. ShipIt lets a non-technical person (e.g. a bakery owner) get a premium website by **pointing at it and speaking**, then pressing **Ship once**.

The demo is the product. Nothing after Nov 7 matters: no accounts, no scaling, no roadmap work.

## Goals

1. A premium, qtzx.dev-style **landing page** with a **"try it →"** that transitions into the editor.
2. The **editor** runs this exact flow, live, in about 4 minutes:
   1. **Photo in** — drop a photo of a menu/storefront + one sentence. ShipIt extracts business name, items, prices, colors, vibe.
   2. **Live build** — site appears section by section (~60–90 s) with a status line of what the agent is doing.
   3. **Click & speak** — click any element on the site, hold mic, speak a change. Each becomes a numbered pin. Nothing is applied yet. (The "lean forward" moment.)
   4. **Ship once** — all pins applied in one run. Then ShipIt **tests the site like a customer** (clicks every link/button, checks phone size), visibly catches a problem, fixes it, retests.
   5. **Before / after** — drag slider of before vs after, plus a plain-English "what I changed and tested" card.
3. Everything feels premium: judges should remember the polish.
4. Optional last step: wrap in **Electron** so it runs as a desktop app.

## Non-goals

- Backend, database, auth or deployment for the *generated* sites (they are frontend-only).
- Hosting/publishing generated sites, GitHub PRs for them, multi-user anything.
- Life after the event (retention, pricing, scale).
- Talking about models/tech stack in the product UI.

## Anti-goals (failure even if it "works")

- Generated sites that look generic / AI-made.
- A demo that can fail in front of judges with no fallback.
- Faked results: the QA checks, fixes, and changes shown must actually happen. We may *choose* a demo case that reliably triggers a catch, but not script the output.
- Cluttered editor chrome competing with the site.

## Constraints

- Builder is the user (beginner, doesn't know Electron) plus Claude; ~6 days.
- Build on the existing repo: `frontend/` (React 19 + Vite + Tailwind 4, Three.js via @react-three/fiber, GSAP, Lenis already installed) and `backend/` (Express 5, SSE streaming at `POST /api/run`, Gemini agent loop in `src/agent/`). Keep SSE as the live-update channel.
- LLM provider stays **Gemini** (key already in `backend/.env`).
- Must run offline-tolerant enough for a venue: a pre-recorded backup video of the full flow is required.

## Decided by the user

- Audience: beginners — small business owners, portfolio sites. Demo persona: a bakery.
- USP is the interaction model: **point + speak, batch the changes, Ship once** — plus self-testing and the before/after summary.
- Both **photo input** and **voice comments** are in.
- **Visual style:** qtzx.dev — near-black `#0a0a0a`, giant serif display (Yeseva One–style) + clean sans (DM Sans / Geist), lowercase terse copy, slow WebGL shader glow, intro animation, autoplay demo video, one-line proof stats. Use **Three.js, Framer Motion, GSAP** ("modern").
- **Editor:** same dark style but **calmer**; the generated site is the focus, chrome stays quiet.
- **Generated sites come from 2–3 premium templates** designed up front, which the agent fills from the photo and then edits from the pins. The agent edits real template code.
- Landing first → "try it" → editor. Electron only as an optional final wrap; Chrome `--app` mode is the fallback.
- **Self-test catch is reliable, not luck:** at least one template ships with a real, small defect (e.g. an "Order" button with a dead link) that the Playwright QA genuinely finds and the agent genuinely fixes. The pitch frames it honestly as "it tests the whole site", not "it caught its own mistake".
- **In-app replay fallback:** every real run records its SSE event stream plus workspace snapshots. If the network or the model fails on stage, the presenter can replay a real recorded run inside the app (no switching to a video). Build this into the event layer from day one. The backup video still exists as a last resort.
- **Demo gets ~2 minutes of the 4:** the photo build is started just before the pitch begins (or pre-staged), the photo step is shown briefly, and click & speak → Ship → self-test → before/after happen live.
- **Cost: free or near-free.** Premium look comes from the templates, not the model, so a cheap model is enough.

## Claude's calls (overridable)

- **Replace** the current galaxy landing page with the new qtzx-style one (reuse Three.js setup).
- **Templates are plain HTML/CSS** (one folder each) with stable `data-sid` ids on editable elements, so a click maps to an exact source location with no build step. Element picking is our own lightweight picker injected into the preview iframe — inspired by React Grab, not dependent on it (React Grab needs a React dev build).
- **Per-run workspace:** each run copies the chosen template into a fresh folder (e.g. `backend/workspaces/<runId>/`), served statically by the backend and shown in an iframe. This replaces editing `backend/sandbox/` directly.
- **Template choice:** the vision step picks the best of the 2–3 templates from the photo's vibe.
- **Photo extraction:** Gemini vision returns structured JSON (name, tagline, items+prices, palette, vibe) → used to fill the template.
- **Voice:** record with `MediaRecorder`, transcribe via Gemini audio (not the browser Web Speech API, which does not work inside Electron). Transcript is shown on the pin and editable before Ship.
- **Ship:** one agent run receives all pins as a list of `{sid, selector context, instruction}` and edits the workspace files.
- **Self-test:** Playwright (headless Chromium) on the workspace: click every link/button, check for broken anchors/console errors, desktop + phone viewport screenshots. Failures go back to the agent to fix, then retest; each step streams as an event.
- **Before/after:** Playwright screenshots of the page before and after Ship.
- **Model:** Gemini **2.5 Flash** on the existing key (free tier assumed; tier unknown) for vision, audio and edits — not Pro (free-tier limits too tight). Retry with backoff on 429s and fall back to `2.5-flash-lite`. Model name in config. **Not Ollama:** local models on a laptop are slow and weak at multi-step tool use, vision and audio — too risky on stage. If free-tier limits bite in rehearsal, enabling billing on Flash costs very little per run.
- **Preview updates only at the end of Ship:** the agent edits a staging copy; the iframe swaps to the result when QA passes, while the checklist animates. "Before" = the site after the photo build, before Ship.
- **Template fill is deterministic** (photo JSON → template slots in code, no LLM editing) so the build step is fast and reliable; the LLM is used for photo extraction, voice transcription, pin edits and QA fixes.
- **Agent hardening** (needed for a reliable demo): tool errors returned to the model instead of crashing the run, a max-step limit, handle multiple function calls per turn, stop the run when the client disconnects, keep file paths inside the workspace.

## Left to the builder

Exact template designs, animation details, component structure, event names on the SSE stream, summary card copy, and how the landing page's demo video is produced (screen recording of a real run).

## Deliverables by Nov 4

1. Landing page (qtzx style) with demo video + "try it →" transition.
2. Editor with the 5-step flow working end to end on the bakery example.
3. 2–3 templates.
4. Recorded backup video of the full flow.
5. (Optional) Electron wrap.
