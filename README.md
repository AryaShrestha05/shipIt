# ShipIt

**Point at your website. Say what to change. Press Ship once.**

ShipIt is our entry for the **Marist Innovation Challenge (Software track)**. A small business owner, like a bakery, drops in a photo of their menu, and ShipIt builds them a premium-looking website. They then click on anything on the site, *say* what they want changed, and press **Ship** once. ShipIt makes all the changes, tests the site like a customer would, fixes anything broken, and shows the finished site with a plain-English summary.

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
5. **The finished site.** The changed site, plus a "here's what I changed and tested" card.

---

## How to run it

You need **Node.js** installed (`node -v` should print a version).

```bash
# 1. Backend (the "kitchen") — terminal window 1
cd backend
npm install
npx playwright install chromium   # one time: the hidden browser QA uses
cp .env.example .env              # optional: a server Gemini key, used only as a backup
npm run dev                       # runs on http://localhost:3001

# 2. Frontend (the "dining room") — terminal window 2
cd frontend
npm install
npm run dev                       # open http://localhost:5173
```

| Page | What it's for |
|---|---|
| **/** | Landing page: the pitch, how it works, and the looks to pick from |
| **/try** | The real app: write about your business + add a photo → your AI key and a look (if not set yet) → site → click and speak notes → Ship |
| **/try?replay=latest** | Stage backup: plays the last recorded run, no AI or internet needed |
| **/blocks** | Gallery of every section and theme (free and pro), plus Theme Studio |
| **/dev** | Plain test page with one box per feature, sample businesses, and the list of replays |

Tests: `cd backend && npm test` and `cd frontend && npm test`. Everything should pass.

**Connecting an AI** (the first screen on `/try`): **Sign in with OpenRouter** (one click; OpenRouter's official PKCE sign-in, the browser swaps the code for the person's key directly with OpenRouter, see `frontend/src/lib/openrouterAuth.js`), or paste a Gemini, OpenAI or Claude key. People pay with their own OpenRouter credits or API key. Claude Pro/Max and ChatGPT subscriptions can't be used: their terms only allow them in Anthropic's and OpenAI's own apps. Either way the key is encrypted in their browser (AES-256, with a lock that can't be copied out) and only a hint like `sk-…cdef` is stored in plain text. The server uses it for one request and never saves it. `backend/.env` can hold a backup Gemini key; it's never committed (`.gitignore` blocks it).

**Cost:** Claude defaults to Haiku 5.5. One Ship is at most 3 AI calls of about 4,000 tokens each, so under 1¢; $5 of credit covers hundreds of runs. Type `claude-sonnet-5-5` in the key panel's Model box for stronger edits.

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
│   │   ├── ship/            Ship: apply notes → test → fix → summary (edits.js applies the AI's edit plan safely)
│   │   ├── qa/              testing a site like a customer in a hidden browser
│   │   └── runs/            recording every run, and replaying it on stage (replay.js)
│   ├── templates/           the design itself: page shell, 15 sections, 3 themes, animations
│   ├── test/                automatic checks (they use a fake AI, so they're free)
│   └── .env.example         which secrets the server needs
├── frontend/                what you see in the browser (React + Vite)
│   └── src/
│       ├── App.jsx          which page shows for which address
│       ├── pages/           the pages: Landing (/), Editor (/try), Blocks, ThemeStudio, Dev
│       ├── blocks/          the theme gallery's data, previews and Theme Studio
│       ├── components/      shared pieces: SiteNav (the one navbar every page uses)
│       ├── styles/          tokens.css: shared colours, fonts and light/dark mode
│       ├── editor/          the editor's pieces: chat box, key panel, look picker, picker, notes, voice, Ship screen, state
│       └── lib/             small shared helpers: AI key settings, encrypted key vault, live-stream reader
└── docs/superpowers/        the design spec and the step-by-step build plan
```

---

## How to read the code

Open the project in VS Code (`code .` from the `shipIt` folder), then read the files in the order a request travels:

| # | File | What you'll learn |
|---|---|---|
| 1 | `backend/src/index.js` | Every address the server answers |
| 2 | `frontend/src/App.jsx` | Which page shows at which address |
| 3 | `frontend/src/pages/Editor.jsx` | The screen the owner uses |
| 4 | `frontend/src/editor/editorReducer.js` | The editor's memory: photo → building → editing → shipping → done |
| 5 | `backend/src/routes/build.js` | What happens when a photo arrives |
| 6 | `backend/src/vision/extract.js` | The AI reads the menu |
| 7 | `backend/src/site/compose.js` | The site gets snapped together from sections |
| 8 | `frontend/src/editor/picker.js` | Clicking parts of the site to drop pins |
| 9 | `backend/src/ship/ship.js` + `edits.js` | Ship: one AI call for an edit plan → apply it safely → test → fix → summary |
| 10 | `backend/src/qa/runQa.js` | The "customer" test in a hidden browser |

Tips:
- **Cmd+click** a function name to jump to where it's defined; **Ctrl+-** jumps back.
- **Cmd+P** opens a file by name; **Cmd+Shift+F** searches every file (try `data-sid`).
- Read the comments first: every important line has a plain-English one.
- Skip `node_modules/` and `test/` on the first pass.
- Run both servers and use `/try` while you read. The backend terminal shows which step is running.

---

## How the code works (no JavaScript knowledge needed)

### The restaurant analogy

| Restaurant | ShipIt | Folder |
|---|---|---|
| Dining room, what customers see | **Frontend**: the website you click on | `frontend/` |
| Kitchen, where the work happens | **Backend**: a server that runs the AI and edits files | `backend/` |
| Waiter carrying orders back and forth | **API**: web requests like `POST /api/build` | `backend/src/routes/` |
| The chef | **The AI** (Gemini, OpenAI or Claude) | `backend/src/ai/` |
| The food inspector | **QA**: opens the site like a customer and finds problems | `backend/src/qa/runQa.js` |

### The whole flow

```
/try in the browser                                   backend
──────────────────                                    ───────
1. drop a photo        ── POST /api/build ──►  vision/extract.js reads it
   (+ the look picked)                         site/compose.js builds it in that look  → v1
2. click parts, talk   ── POST /api/transcribe ► ai/ turns speech into text
   (notes = "pins")
3. press Ship          ── POST /api/ship ───►  ship/ship.js
                                                 copy v1 → v2
                                                 1 AI call: an edit plan (JSON), applied by edits.js
                                                 QA tests v2 (qa/)
                                                 failed? 1 AI call to fix, QA again (max 2×)
4. see what changed    ◄── live updates ─────  checklist, the changed site, summary card
```

Every step streams back live ("Server-Sent Events", like a sports ticker), and every run is recorded (`runs/recorder.js`) so we can replay it if the Wi-Fi dies on stage.

### Words you'll hear

- **Prompt**: the instruction we give the AI.
- **Edit plan**: Ship's one-shot answer from the AI: every change as "find this exact text, replace it with that", plus CSS. Our code applies it and refuses any edit that would break the page.
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
| 3 | 15 hand-made sections + 10 themes (3 ours, 7 from the gallery), and the `/blocks` gallery | ✅ done |
| 4 | A fresh copy of the site for every change (v1, v2, …) | ✅ done |
| 4b | Bring your own AI key (Gemini, OpenAI or Claude), encrypted on the user's device | ✅ done |
| 5 | Photo → site in the look the user picked, streamed live and recorded | ✅ done |
| 6 | Editor at `/try`: key → look → photo, all required | ✅ done |
| 7 | Click parts of the site to drop numbered pins | ✅ done |
| 8 | Hold the mic and speak a note (browser speech, live words, works with any key) | ✅ done |
| 9 | Customer-style testing (links, errors, phone size, images, name tags) | ✅ done |
| 10 | Ship: apply all pins in 1 AI call, test, fix (max 3 calls) | 🟡 tested end to end with a stand-in AI; first real Claude run next |
| 11 | Ship screen: live checklist, the changed site, summary card | ✅ done |
| 12 | Offline replay of a recorded run (`/try?replay=latest`) | ✅ done |
| 13 | Landing page at `/` | ✅ done |
| 14 | Desktop app (Electron) | ⏭️ skipped, judges don't score it |

## How a teammate can help without writing JavaScript

- **The pitch deck**: hook → problem → solution/demo → feasibility → market → close. Judges score **Feasibility, Originality, Market Potential, Persuasiveness**.
- **Research numbers** for the problem slide: what a small business pays a web designer, how long it takes, how many small businesses have no website.
- **Find a real bakery menu photo** (or take one) for the demo, and write the pin lines we'll speak on stage.
- **Test the app** like a bakery owner would, and write down anything confusing.
- **Rehearse**: time the 4 minutes and play the judge asking hard questions ("What if the AI breaks the site?" → *every change is tested, and the old version is kept*).
