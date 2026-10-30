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
npx playwright install chromium   # one time: the hidden browser QA uses
cp .env.example .env              # then put the Gemini key in .env (ask Arya)
npm run dev                       # runs on http://localhost:3001

# 2. Frontend (the "dining room") — terminal window 2
cd frontend
npm install
npm run dev                       # open http://localhost:5173
```

| Page | What it's for |
|---|---|
| **/try** (also `/`) | The real app: photo → site → click and speak notes → Ship |
| **/blocks** | Gallery of every section and theme (free and pro) |
| **/dev** | Plain test page with one box per feature, and the AI key settings |

Tests: `cd backend && npm test` and `cd frontend && npm test`. Everything should pass.

**Secrets:** `backend/.env` holds the real key and is never committed (`.gitignore` blocks it). `backend/.env.example` shows what goes in it. Users can also paste their own Gemini, OpenAI or Claude key on `/dev`; it stays in their browser.

---

## Project map

```
shipIt/
├── backend/                 the server (Node + Express)
│   ├── src/
│   │   ├── index.js         turns the server on and lists every address it answers
│   │   ├── routes/          one file per address the browser calls (POST /api/build, /api/ship, …)
│   │   ├── ai/              talking to Gemini, OpenAI or Claude through one shared shape
│   │   ├── vision/          reading a photo into business info (name, items, colors)
│   │   ├── site/            snapping sections together into a website
│   │   ├── workspace/       each site's versions: v1, v2, … (old ones never change)
│   │   ├── agent/           the AI's work loop and the tools it may use (read, edit, write files)
│   │   ├── ship/            Ship: apply notes → test → fix → summary
│   │   ├── qa/              testing a site like a customer in a hidden browser
│   │   └── runs/            recording every run so it can be replayed on stage
│   ├── templates/           the design itself: page shell, 15 sections, 3 themes, animations
│   ├── test/                automatic checks (they use a fake AI, so they're free)
│   └── .env.example         which secrets the server needs
├── frontend/                what you see in the browser (React + Vite)
│   └── src/
│       ├── App.jsx          which page shows for which address
│       ├── pages/           the pages: Editor (/try), Blocks, Dev
│       ├── editor/          the editor's pieces: photo drop, picker, notes, voice, state
│       └── lib/             small shared helpers: AI key settings, live-stream reader
└── docs/superpowers/        the design spec and the step-by-step build plan
```

---

## How the code works (no JavaScript knowledge needed)

### The restaurant analogy

| Restaurant | ShipIt | Folder |
|---|---|---|
| Dining room, what customers see | **Frontend**: the website you click on | `frontend/` |
| Kitchen, where the work happens | **Backend**: a server that runs the AI and edits files | `backend/` |
| Waiter carrying orders back and forth | **API**: web requests like `POST /api/build` | `backend/src/routes/` |
| The chef | **The AI** (Gemini, OpenAI or Claude) | `backend/src/ai/` |
| The chef's tools (knife, oven) | **Tools** the AI may use: read, edit and write files | `backend/src/agent/tools.js` |
| The food inspector | **QA**: opens the site like a customer and finds problems | `backend/src/qa/runQa.js` |

### The whole flow

```
/try in the browser                                   backend
──────────────────                                    ───────
1. drop a photo        ── POST /api/build ──►  vision/extract.js reads it
                                               site/compose.js builds it  → v1
2. click parts, talk   ── POST /api/transcribe ► ai/ turns speech into text
   (notes = "pins")
3. press Ship          ── POST /api/ship ───►  ship/ship.js
                                                 copy v1 → v2
                                                 AI edits v2 (agent/)
                                                 QA tests v2 (qa/)
                                                 failed? AI fixes, QA again (max 2×)
4. see what changed    ◄── live updates ─────  summary + before/after screenshots
```

Every step streams back live ("Server-Sent Events", like a sports ticker), and every run is recorded (`runs/recorder.js`) so we can replay it if the Wi-Fi dies on stage.

### Words you'll hear

- **Prompt**: the instruction we give the AI.
- **Agent**: an AI that doesn't just answer, it *does things* using tools, step by step.
- **Endpoint / route**: an address on the server the frontend can call, like `/api/ship`.
- **SSE (Server-Sent Events)**: the server keeps sending updates over one open connection.
- **Section / block**: one hand-made piece of a website (a hero, a menu, a "visit us" box).
- **Theme**: the fonts, colors and feel (hearth = warm, atelier = calm, noir = dark).
- **`data-sid`**: an invisible name tag on every editable part of a site (like `hero-title`). It's how ShipIt knows exactly what you clicked.
- **Pin / note**: one change the owner asked for, attached to one part of the site.
- **Commit / push / merge**: save a snapshot / upload it to GitHub / combine a branch into the main version.

---

## Progress

| # | Feature | Status |
|---|---|---|
| 1 | Agent can't crash: errors become messages, step limit, stop button, safe folders | ✅ done |
| 2 | Automatic retry when the AI is busy | ✅ done |
| 3 | 15 hand-made sections + 3 themes, and the `/blocks` gallery | ✅ done |
| 4 | A fresh copy of the site for every change (v1, v2, …) | ✅ done |
| 4b | Bring your own AI key (Gemini, OpenAI or Claude) | ✅ done |
| 5 | Photo → site, streamed live and recorded | ✅ done |
| 6 | Editor screen at `/try` | ✅ done |
| 7 | Click parts of the site to drop numbered pins | ✅ done |
| 8 | Hold the mic and speak a note | ✅ done |
| 9 | Customer-style testing (links, errors, phone size, images, name tags) | ✅ done |
| 10 | Ship: apply all pins, test, fix | 🟡 built and tested with a fake AI; waiting on a real AI test |
| 11 | Ship screen: live checklist, before/after slider, summary card | ⏳ next |
| 12 | Offline replay of a real run (backup if Wi-Fi dies) | |
| 13 | qtzx-style landing page | |
| 14 | Desktop app (Electron), optional | |

## How a teammate can help without writing JavaScript

- **The pitch deck**: hook → problem → solution/demo → feasibility → market → close. Judges score **Feasibility, Originality, Market Potential, Persuasiveness**.
- **Research numbers** for the problem slide: what a small business pays a web designer, how long it takes, how many small businesses have no website.
- **Find a real bakery menu photo** (or take one) for the demo, and write the pin lines we'll speak on stage.
- **Test the app** like a bakery owner would, and write down anything confusing.
- **Rehearse**: time the 4 minutes and play the judge asking hard questions ("What if the AI breaks the site?" → *every change is tested and shown before/after*).
