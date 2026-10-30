# ShipIt

**Point at your website. Say what to change. Press Ship once.**

ShipIt is our entry for the **Marist Innovation Challenge (Software track)**. A small business owner, like a bakery, drops in a photo of their menu, and ShipIt builds them a premium-looking website. They then click on anything on the site, *say* what they want changed, and press **Ship** once. ShipIt makes all the changes, tests the site like a customer would, fixes anything broken, and shows a before/after with a plain-English summary.

| Date | What |
|---|---|
| **Nov 1, 11:59 pm** | Submission form due (one per team, list every member) |
| **Nov 4, 11 am, Room 2006** | Workshop — bring a draft |
| **Nov 4** | All features built |
| **Nov 7, 9 am** | Pitch day: 4 minutes, business casual |

> 📄 Full design: [`docs/superpowers/specs/2026-10-29-shipit-pitch-demo-design.md`](docs/superpowers/specs/2026-10-29-shipit-pitch-demo-design.md)
> 🗺️ Build plan (14 features): [`docs/superpowers/plans/2026-10-29-shipit-pitch-demo.md`](docs/superpowers/plans/2026-10-29-shipit-pitch-demo.md)

---

## The pitch in one breath

AI models keep getting smarter, but **people are now the bottleneck**: you type a prompt, wait, type "change this", wait, again and again. Tools like Lovable and Wix AI still work that way. ShipIt lets you **mark up your site like a Google Doc** (click, speak, click, speak), then press Ship *once*. Every change, a full test, and a summary come back together.

The demo, screen by screen:

1. **Photo in.** A photo of the bakery menu plus one sentence. ShipIt reads the items, prices and colors.
2. **Live build.** The site appears in about a minute, using one of our premium templates.
3. **Click & speak.** Click the title, hold the mic: *"make this bigger"*. Each note becomes a numbered pin.
4. **Ship once.** All the pins are applied together. Then ShipIt clicks every button like a customer, checks phone size, finds a broken link, fixes it, and retests.
5. **Before / after.** A drag slider plus a "here's what I changed and tested" card.

---

## How to run it

You need **Node.js** installed (`node -v` should print a version).

```bash
# 1. Backend (the "kitchen") — terminal window 1
cd backend
npm install
npm run dev          # runs on http://localhost:3001

# 2. Frontend (the "dining room") — terminal window 2
cd frontend
npm install
npm run dev          # open the link it prints, usually http://localhost:5173
```

The backend needs a file called `backend/.env` (it's secret, so it's not on GitHub; ask Arya for it):

```
GEMINI_API_KEY=...
GITHUB_TOKEN=...
PORT=3001
```

Run the backend's automatic tests with `cd backend && npm test`. Everything should say ✔.

Then open **http://localhost:5173/dev** to try each feature, or **/blocks** to see every section.

---

## How the code works (no JavaScript knowledge needed)

### The restaurant analogy

| Restaurant | ShipIt | Folder |
|---|---|---|
| Dining room, what customers see | **Frontend**: the website you click on | `frontend/` |
| Kitchen, where the work happens | **Backend**: a server that runs the AI and edits files | `backend/` |
| Waiter carrying orders back and forth | **API**: web requests like `POST /api/run` | |
| The chef | **Gemini**, Google's AI model | `backend/src/agent/gemini.js` |
| The chef's tools (knife, oven) | **Tools** the AI may use: read a file, write a file, run a command | `backend/src/agent/tools.js` |
| The recipe the chef follows | **The agent loop**: ask the AI → it picks a tool → we run it → repeat | `backend/src/agent/loop.js` |

### What happens when you upload a photo (Feature 5)

```
You pick a photo on /dev and click "build site"
        │
        ▼
frontend/src/lib/stream.js  ── photo + your AI key ──►  backend: POST /api/build
                                                              │
                                                 backend/src/routes/build.js
                                                 opens a live stream ("Server-Sent
                                                 Events", like a live ticker)
                                                              │
                                                 backend/src/vision/extract.js
                                                 the AI reads the photo: name, items,
                                                 prices, colors, wording
                                                              │
                                                 backend/src/templates/compose.js
                                                 picks a theme + sections and
                                                 snaps them into a website
                                                              │
                                                 backend/src/workspace/workspace.js
                                                 saves it as version 1 (v1)
        ▲                                                     │
        └──── each step streams back live, then the site ─────┘
```

### Every backend file, in plain English

| File | What it does |
|---|---|
| `backend/src/index.js` | Turns the server on. The front door. |
| `backend/src/routes/build.js` | `POST /api/build`: photo in, website out, streamed live step by step. |
| `backend/src/routes/sse.js` | The live-stream helper. Stops the work if you close the browser tab. |
| `backend/src/routes/ai.js` | `POST /api/ai/check`: the "test my key" button. |
| `backend/src/routes/blocks.js` | Lists every section and theme for the `/blocks` gallery. |
| `backend/src/routes/dev.js` | Extra routes only the `/dev` test page uses. |
| `backend/src/ai/` | One small adapter per AI company (Gemini, OpenAI, Claude) so the rest of the app doesn't care which one you use. `fromRequest.js` takes the key from your browser; the key is never saved. |
| `backend/src/vision/extract.js` | Asks the AI to read the photo, then **cleans up the answer**: fills in anything missing, keeps 8 items max, throws out bad colors, never crashes on a weird answer. |
| `backend/src/templates/compose.js` | Snaps hand-made sections together into one site. The same business always gets the same site. |
| `backend/src/templates/fill.js` | Puts the business's name, items and wording into a section, safely. |
| `backend/templates/` | The design itself: 15 sections, 3 themes (hearth, atelier, noir), and the animations. |
| `backend/src/workspace/workspace.js` | Every run gets a folder with v1, v2, … Old versions never change, so before/after always works. |
| `backend/src/runs/recorder.js` | Records every step of a run with its timing, so we can replay it on stage if the Wi-Fi dies. |
| `backend/src/agent/` | The AI "agent loop" (ask the AI → it picks a tool → we run it → repeat). Ship (Feature 10) will use it to make your changes. |
| `backend/test/` | Automatic checks that use a **fake AI**, so we can test for free without calling the real one. |

### Frontend files

| File | What it does |
|---|---|
| `frontend/src/App.jsx` | Decides which page shows. `/` goes to `/dev` for now. |
| `frontend/src/routes/Dev.jsx` | A plain test page with one box per feature, so we can try each one. |
| `frontend/src/routes/Blocks.jsx` | The `/blocks` gallery of every section and theme (free and pro). |
| `frontend/src/lib/aiSettings.js` | Saves your AI provider and key in this browser only. |
| `frontend/src/lib/stream.js` | Sends a request and shows each live update as it arrives. |

### Words you'll hear

- **Prompt**: the instruction we give the AI.
- **Agent**: an AI that doesn't just answer, it *does things* using tools, step by step.
- **Endpoint / route**: an address on the server the frontend can call, like `/api/build`.
- **SSE (Server-Sent Events)**: the server keeps sending updates over one open connection, like a live sports ticker.
- **Section / block**: one hand-made piece of a website (a hero, a menu, a "visit us" box). Sites are built by snapping them together.
- **Theme**: the fonts, colors and feel (hearth = warm, atelier = calm, noir = dark).
- **`data-sid`**: an invisible name tag on every editable part of a site (like `hero-title`). It's how ShipIt knows exactly what you clicked.
- **Commit / push / merge**: save a snapshot / upload it to GitHub / combine a branch into the main version.

---

## Progress

| # | Feature | Status |
|---|---|---|
| 1 | Agent can't crash: errors become messages, step limit, stop button, safe folders | ✅ done |
| 2 | Model choice + automatic retry when the AI is busy | ✅ done |
| 3 | 15 hand-made sections + 3 themes, and the `/blocks` gallery | ✅ done |
| 4 | A fresh copy of the site for every change (v1, v2, …) | ✅ done |
| 4b | Bring your own AI key (Gemini, OpenAI or Claude) | ✅ done |
| 5 | Photo → site, streamed live and recorded | ✅ done |
| 6 | Editor screen | ⏳ next |
| 7 | Click to drop pins | |
| 8 | Speak your changes | |
| 9 | Customer-style testing (clicks every button, checks phone size) | |
| 10 | Ship: apply all pins, test, fix | |
| 11 | Checklist animation, before/after slider, summary card | |
| 12 | Offline replay of a real run (backup if Wi-Fi dies) | |
| 13 | qtzx-style landing page | |
| 14 | Desktop app (Electron), optional | |

## How a teammate can help without writing JavaScript

- **The pitch deck**: hook → problem → solution/demo → feasibility → market → close. Judges score **Feasibility, Originality, Market Potential, Persuasiveness**.
- **Research numbers** for the problem slide: what a small business pays a web designer, how long it takes, how many small businesses have no website.
- **Find a real bakery menu photo** (or take one) for the demo, and write the pin lines we'll speak on stage.
- **Test the app** like a bakery owner would, and write down anything confusing.
- **Rehearse**: time the 4 minutes and play the judge asking hard questions ("What if the AI breaks the site?" → *every change is tested and shown before/after*).
