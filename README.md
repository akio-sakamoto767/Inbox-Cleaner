# Inbox Cleaner
This is a multi-agent system that analyzes your inbox, figures out which emails are newsletters, finds the unsubscribe links, and (in simulation mode for now) unsubscribes you from them. It runs a pipeline of six specialized agents — each one does one thing well — and gives you full control over what actually gets acted on.

No AI API keys needed. The classification is rule-based and works surprisingly well out of the box.

## How it works

You feed it a JSON file of emails (or use the included sample data). The system runs them through a pipeline:

1. **Ingest** — normalizes the email data, fills in missing fields
2. **Classify** — decides if each email is a newsletter or personal (using domain patterns, keywords, headers)
3. **Find unsubscribe** — hunts for unsubscribe links in headers, body HTML, and plain text
4. **Plan** — builds an action plan based on confidence scores, flags anything it's unsure about
5. **Execute** — runs the unsubscribe actions (simulated for now, with realistic delays and random failures)
6. **Report** — generates a summary in both markdown and JSON

You get a preview step before anything runs. Emails the system isn't confident about get flagged for your review — you decide what happens with those.

## Quick start

```bash
npm install
npm run dev
```

That starts both the Express backend (`:3000`) and the Vite frontend (`:5173`). Open http://localhost:5173 and you're in.

On Windows you can also just double-click `start.bat`.

## What you'll see

The UI walks you through four steps:

- **Upload** — drop in a JSON file or load one of the sample datasets
- **Preview** — see the action plan, confidence scores, and approve/reject flagged items
- **Execute** — watch it process in real time with a progress bar and live logs
- **Results** — success/failure stats, downloadable reports

## The confidence system

Every email gets a confidence score between 0 and 1, based on weighted signals:

| Signal | Weight |
|---|---|
| `List-Unsubscribe` header | 4 |
| Newsletter keywords in body | 3 |
| Known newsletter domain | 2 |
| Subject line patterns | 1 |

What happens next depends on the score:
- **≥ 0.7** — auto-confirmed, will be processed
- **0.4 – 0.7** — needs your approval
- **< 0.4** — skipped

## Project structure

```
server/
  agents/         # the six agents (ingest, classify, unsub-finder, planner, execution, report)
  orchestrator.js # wires the agents together
  index.js        # express API
src/
  views/          # UI components (vanilla JS, no framework)
  app.js          # main app + routing
  api.js          # fetch wrapper
data/             # sample email datasets
jobs/             # persisted job state (JSON files)
```

## Tech stack

Vanilla JS frontend, Express backend. No React, no database, no build complexity. Vite for dev/HMR. Zod for input validation. That's about it.

## Sample data

Three datasets are included in `data/`:
- `sample-emails.json` — 3 emails, good for a quick test
- `extended-sample-emails.json` — 10 emails, covers more edge cases
- `large-sample-emails.json` — bigger set for stress testing

## Configuration

Copy `.env.example` to `.env` if you want to tweak thresholds:

```bash
CONFIDENCE_CONFIRMED=0.7    # auto-confirm above this
CONFIDENCE_VERIFICATION=0.4 # flag for review above this
BATCH_SIZE=10               # emails per execution batch
SIMULATION_SUCCESS_RATE=0.95
```

Or just edit the agent files directly — they're pretty readable.

## What's next

Right now execution is simulated. The architecture is set up so you could plug in real email providers (Gmail API, IMAP) and actually hit those unsubscribe endpoints. LLM integration is stubbed out too — for the ambiguous cases where rules aren't enough.

See [FEATURES.md](FEATURES.md) for the full roadmap.

## License

MIT
