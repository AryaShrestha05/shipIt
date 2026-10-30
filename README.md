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

### What happens when you press "Run" (today's version)

```
You click Run in the browser
        │
        ▼
frontend/src/routes/Agent.jsx  ── sends your prompt ──►  backend: POST /api/run
                                                              │
                                                 backend/src/routes/run.js
                                                 keeps the connection open and
                                                 streams updates live (this is called
                                                 "Server-Sent Events", like a live ticker)
                                                              │
                                                 backend/src/agent/runner.js
                                                 hires the chef, hands over the tools
                                                              │
                                                 backend/src/agent/loop.js
                                                 ┌──────────────────────────────┐
                                                 │ 1. Send the task to Gemini   │
                                                 │ 2. Gemini: "read index.html" │
                                                 │ 3. We run that tool          │
                                                 │ 4. Send the result back      │
                                                 │ 5. Repeat until Gemini says  │
                                                 │    "done" + a summary        │
                                                 └──────────────────────────────┘
        ▲                                                     │
        └──────────── each step streams back live ────────────┘
```

### Every backend file, in plain English

| File | What it does |
|---|---|
| `backend/src/index.js` | Turns the server on. The front door. |
| `backend/src/routes/run.js` | The one "order window" right now: `POST /api/run`. Streams progress live. |
| `backend/src/agent/runner.js` | Puts the AI, the tools, and the loop together for one run. |
| `backend/src/agent/gemini.js` | Connects to Google's AI. Picks the model (default `gemini-2.5-flash`), gives it its rules, and **retries automatically** when Google says "too busy" (errors 429/503). |
| `backend/src/agent/tools.js` | The 3 things the AI is allowed to do: `read_file`, `write_file`, `run_command`. It **can't touch files outside its own folder**, and if a tool fails, the AI gets the error message as text so it can try again instead of crashing. |
| `backend/src/agent/loop.js` | The back-and-forth with the AI. Has a **25-step limit** so it can't loop forever, handles several tool requests at once, and can be stopped mid-run. |
| `backend/src/github/client.js` | Helpers for GitHub (clone, push, open a PR). Not used in the demo. |
| `backend/test/` | Automatic checks that use a **fake AI** following a script, so we can test the logic for free without calling Google. |
| `backend/sandbox/` | A tiny practice folder the AI edits today. It gets replaced by real bakery sites in Feature 4. |

### Frontend files

| File | What it does |
|---|---|
| `frontend/src/App.jsx` | Decides which page shows: `/` = landing page, `/agent` = the console. |
| `frontend/src/routes/Landing.jsx` | The marketing page (3D galaxy for now; becomes the qtzx-style dark page in Feature 13). |
| `frontend/src/routes/Agent.jsx` | The console that shows the AI's steps live. Becomes the click-and-speak editor in Feature 6. |
| `frontend/src/components/` | Reusable building blocks: buttons, cards, the 3D scene. |

### Words you'll hear

- **Prompt**: the instruction we give the AI.
- **Agent**: an AI that doesn't just answer, it *does things* using tools, step by step.
- **Endpoint / route**: an address on the server the frontend can call, like `/api/run`.
- **SSE (Server-Sent Events)**: the server keeps sending updates over one open connection, like a live sports ticker.
- **Template**: a pre-designed website ShipIt fills in with the bakery's info, so every site looks premium.
- **`data-sid`**: an invisible name tag on every editable part of a site (like `hero-title`). It's how ShipIt knows exactly what you clicked.
- **Commit / push / merge**: save a snapshot / upload it to GitHub / combine a branch into the main version.

---

## Progress

| # | Feature | Status |
|---|---|---|
| 1 | Agent can't crash: errors become messages, step limit, stop button, safe folders | ✅ done |
| 2 | Model choice + automatic retry when Google is busy | ✅ done |
| 3 | Two premium bakery templates + filling them from data | ⏳ next |
| 4 | A fresh copy of the site for every run | |
| 5 | Photo → site | |
| 6 | Editor screen | |
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
