# Demo day: Nov 7, 9 am · 4 minutes

Everything you need on stage, in order. Print it or keep it on your phone.

## Tonight (10 minutes)

1. `git pull` on `main`, then `npm install` in both `backend/` and `frontend/`.
2. Start both servers (README → "How to run it").
3. Open `http://localhost:5173/try`, pick **Claude**, paste your key, press **Save**, then **Test**. It must say **Works**.
   - If Claude fails, pick **Gemini** and paste your free Gemini key instead. That's the setup this demo was verified with (Nov 6), and it costs nothing. The free tier allows about 6 full runs a day, so don't rehearse it to death on pitch morning.
4. Do **one full rehearsal** with the photo below. That also records it as the stage backup.

## The photo

`~/Downloads/kellys menu.jpg`, a real menu through a café window with reflections. ShipIt reads all 8 items and prices from it in about 10 seconds.

## Pitch morning

- Plug in the laptop and charger. Set the browser zoom to 100% and open Chrome full screen.
- Start both servers. Keep the terminals behind the browser.
- **Tab 1:** `http://localhost:5173/` (the landing page)
- **Tab 2:** `http://localhost:5173/try` (your key is already saved)
- Have the backup link ready to paste, but don't open it yet, because it plays straight away: `http://localhost:5173/try?replay=latest`
- Allow the microphone once in Chrome (click the mic on any note).

## The 4 minutes

| Time | Say | Do |
|---|---|---|
| 0:00 | The hook: "AI keeps getting smarter, but *we're* the bottleneck. Prompt, wait, 'change this', wait…" | Landing page |
| 0:30 | "ShipIt flips that. Point at it. Say it. Ship once." | Scroll to the product shot, then the looks |
| 0:50 | "Kelly's Bakery has no website. This is their menu, taped to the window." | Tab 2 → **Zest** → drop the photo → **Build** |
| 1:05 | While it builds (~10 s): "It's reading every item and price, through the glass." | — |
| 1:20 | "Now I mark it up like a Google Doc." | Click the title → hold the mic: *"make the name bigger"* |
| | | Click the menu section's title (the AI words it differently each time) → *"call this Today's Menu"* |
| | | Click **Hours coming soon** → *"we're open Tuesday to Sunday, 7am to 3pm"* |
| 2:10 | "One press." | **Ship 3 changes** |
| 2:20 | "It's testing like a customer: every button, a phone screen, images…" | Point at the checklist |
| 2:30 | "It found a broken button on its own, and it's fixing it." | Point at the red ✗, then the green ✓ |
| 2:50 | "Before and after, and a plain-English list of what changed and what it tested." | Drag the slider, then scroll down to the hours |
| 3:10 | Business: free app, bring your own key (Haiku costs under 1¢ a run), paid premium looks later. ~33M US small businesses (double-check this number before you say it). | — |
| 3:40 | Close: "Humans were the bottleneck. Now it's one photo, three sentences, one press." | — |

## If something goes wrong

| Problem | Do this |
|---|---|
| Build or Ship shows an error, or the Wi-Fi dies | Paste `localhost:5173/try?replay=latest`. It replays a **real** recorded run with the same screens, with no AI and no internet. Say: "here's the run from this morning." |
| The mic hears nothing | Just type the note. Chrome's speech engine needs internet. |
| "Ship stopped before it finished" | Press **Ship** again. Nothing was lost. |
| You need to start fresh | **start over** at the top right, or reload `/try`. |

## Questions judges might ask

- **"What if the AI breaks the site?"** Every change goes into a new copy (v1 → v2). The old one is never touched. Every change is tested in a real browser, and edits that would remove part of the page are thrown out.
- **"How are you different from Lovable?"** "Lovable makes you the tester. ShipIt *is* the tester." You batch every note, press Ship once, and it checks its own work. It's built for owners who've never coded, and it starts from a photo, not a prompt.
- **"Isn't this React Bits?"** "The effects are inspired by that style, but we wrote them ourselves. React Bits' license doesn't allow reselling its components, and owning our blocks is the business model."
- **"What does it cost to run?"** Users bring their own key. On Claude Haiku, a full Ship is at most 3 AI calls, which is under a cent.
- **"Is the hours/address info made up?"** No. If the photo doesn't show it, the site says "coming soon" and the owner adds it by clicking and saying it.
