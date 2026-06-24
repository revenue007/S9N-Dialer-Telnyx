# Session Handoff — S9N-Dialer-Telnyx

## What this is

Full port of the SeKondBrain Power Dialer from Twilio Serverless to Telnyx Edge Compute.
All files are already written and sitting in this repo. The only task for this session is
to commit and push them.

## What was built (previous session)

| File | Purpose |
|---|---|
| `src/index.js` | HTTP router — single Edge Compute service, all 14 routes |
| `src/kv.js` | Upstash Redis adapter replacing Twilio Sync (lists, hashes, strings) |
| `src/telnyx.js` | Telnyx REST API helpers (TeXML calls, conferences, balance, token) |
| `src/routes/token.js` | WebRTC credential token for browser |
| `src/routes/voice.js` | TeXML webhook — blacklist check + conference or direct dial |
| `src/routes/voice_join.js` | Outbound leg TeXML — AMD result → machine/human routing |
| `src/routes/amd_status.js` | No-answer/failed status callback → kill browser leg |
| `src/routes/contacts.js` | Read pending contacts from KV |
| `src/routes/update.js` | Disposition, blacklist, call log, Lemlist, Google Sheets |
| `src/routes/upload.js` | Upload contacts to KV queue |
| `src/routes/resume_state.js` | Page-refresh resume position |
| `src/routes/dial_out.js` | Create next outbound leg (persistent conference) |
| `src/routes/hangup_outbound.js` | End outbound leg only, browser stays in conference |
| `src/routes/balance.js` | Telnyx account balance |
| `src/routes/lemlist_contacts.js` | Lemlist campaign + phone task pull |
| `src/routes/lemlist_update.js` | Push outcomes back to Lemlist |
| `src/routes/call_charges.js` | Call cost report since a given date |
| `.github/workflows/deploy.yml` | GitHub Actions → Telnyx CLI deploy on push to main |
| `func.toml` | Telnyx Edge Compute service config |
| `package.json` | No external dependencies (native fetch + http throughout) |
| `README.md` | Setup guide (Telnyx portal steps, secrets, local dev) |
| `FRONTEND_MIGRATION.md` | How to swap Twilio Voice SDK → Telnyx WebRTC SDK in index.html |

## Key design decisions

- **No npm dependencies** — native `fetch` and `http` only, Node 20 ships both
- **Upstash Redis** replaces Twilio Sync — HTTP REST API, works from any edge runtime
- **TeXML** replaces TwiML — ~90% drop-in compatible, same XML structure
- **Telnyx TeXML REST API** replaces Twilio REST SDK — `Bearer {API_KEY}` auth throughout
- Single HTTP server with path routing (matches how Telnyx Edge Compute deploys a service)

## What still needs doing

1. **Push this repo** — it's the first thing to do in the new session (see below)
2. **Frontend SDK swap** — `index.html` in the original S9N-Dialer repo needs the Twilio
   Voice JS SDK replaced with the Telnyx WebRTC SDK. Full details in `FRONTEND_MIGRATION.md`.
3. **Telnyx portal setup** — user needs to create TeXML App + Telephony Credential +
   assign phone number, then add GitHub secrets (listed in README.md)
4. **Verify Telnyx CLI deploy command** — `telnyx edge-compute:deploy` is the expected
   command based on docs; confirm against https://github.com/team-telnyx/telnyx-cli

## First task for new session

Just commit and push everything:

```bash
git add .
git commit -m "feat: initial Telnyx port — Edge Compute + Upstash Redis + TeXML"
git push -u origin main
```

## Source repo for reference

Original Twilio version: https://github.com/revenue007/S9N-Dialer  
All 14 original function files are in the root of that repo as `*.js`.
The original `index.html` (~99KB) is the browser UI that still needs the SDK swap.
