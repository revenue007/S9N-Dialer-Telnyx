# Session Handoff — S9N-Dialer-Telnyx

## What this is

Full port of the SeKondBrain Power Dialer from Twilio Serverless to Telnyx Edge Compute.

## Change log

### Session 1 — initial port
- Ported all 14 Twilio Functions to `src/routes/`
- Replaced Twilio Sync with Upstash Redis (`src/kv.js`)
- Replaced Twilio REST SDK with Telnyx REST API (`src/telnyx.js`)
- Replaced TwiML with TeXML (`src/routes/voice.js`, `voice_join.js`)
- Added GitHub Actions deploy workflow (`.github/workflows/deploy.yml`)
- Added `func.toml` for Telnyx Edge Compute config

### Session 2 — frontend SDK swap + deploy debugging
- Rewrote `index.html` — full dialer UI using TelnyxRTC WebRTC SDK (replaces Twilio Voice JS)
- Added `FRONTEND_MIGRATION.md` — Twilio → Telnyx SDK mapping reference
- Collected all required secrets with user; added to GitHub Repository Secrets:
  - `TELNYX_API_KEY`, `TELNYX_ACCOUNT_SID`, `TELNYX_CREDENTIAL_ID`
  - `FROM_NUMBER` (+13322635382), `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`
- Fixed deploy workflow: wrong CLI (`telnyx` → `telnyx-edge` from `team-telnyx/edge-compute`)
- Fixed auth: `telnyx-edge auth api-key set <key>` (not `telnyx login --api-key`)
- Added rate-limit sleeps between `telnyx-edge secrets add` calls
- Created Edge Compute function via API → `func_id = b34a0bdf-1186-4eea-b185-10ded463bde8`
- Invoke URL: `https://s9n-dialer-b34a0bdf-1.telnyxcompute.com`
- Rewrote `src/index.js` — switched from `http.createServer` to Knative faas-js-runtime
  (`module.exports = { init, handle, shutdown }`)
- Fixed `func.toml` — stripped to `[edge_compute]` only (matching webhook-receiver example)
- Fixed `package.json` start script: `func start` (not `node src/index.js`)

## Current status

Deploy pipeline passes. Function URL is live but returning 404 — still debugging entry
point resolution between `func.toml`, `package.json main`, and the faas-js-runtime.

## File map

| File | Purpose |
|---|---|
| `src/index.js` | Knative faas-js-runtime handler — `{ init, handle, shutdown }` |
| `src/kv.js` | Upstash Redis adapter (HTTP REST) |
| `src/telnyx.js` | Telnyx REST API helpers |
| `src/routes/token.js` | WebRTC credential token for browser |
| `src/routes/voice.js` | TeXML webhook — blacklist + conference/direct dial |
| `src/routes/voice_join.js` | Outbound leg TeXML — AMD → machine/human routing |
| `src/routes/amd_status.js` | No-answer/failed status callback |
| `src/routes/contacts.js` | Read pending contacts from KV |
| `src/routes/update.js` | Disposition, blacklist, call log, Lemlist, Sheets |
| `src/routes/upload.js` | Upload contacts to KV queue |
| `src/routes/resume_state.js` | Page-refresh resume position |
| `src/routes/dial_out.js` | Create next outbound leg (persistent conference) |
| `src/routes/hangup_outbound.js` | End outbound leg, browser stays in conference |
| `src/routes/balance.js` | Telnyx account balance |
| `src/routes/lemlist_contacts.js` | Lemlist campaign + phone task pull |
| `src/routes/lemlist_update.js` | Push outcomes back to Lemlist |
| `src/routes/call_charges.js` | Call cost report since a given date |
| `index.html` | Browser dialer UI — TelnyxRTC WebRTC SDK |
| `func.toml` | Edge Compute config — func_id only |
| `package.json` | `"start": "func start"` — faas-js-runtime entry |
| `.github/workflows/deploy.yml` | CI/CD — telnyx-edge ship on push to main |

## Secrets in GitHub

| Secret | Value |
|---|---|
| `TELNYX_API_KEY` | KEY019EFC0... |
| `TELNYX_ACCOUNT_SID` | 2989691808658752816 |
| `TELNYX_CREDENTIAL_ID` | 2989694738967299551 |
| `FROM_NUMBER` | +13322635382 |
| `UPSTASH_REDIS_URL` | https://hip-albacore-153764.upstash.io |
| `UPSTASH_REDIS_TOKEN` | gQAAAAAAAlik... |
| `FUNCTION_URL` | pending — add after deploy confirmed working |

## Remaining tasks

1. Fix 404 on invoke URL — confirm faas-js-runtime finds `src/index.js` via package.json `main`
2. Add `FUNCTION_URL` secret once URL is confirmed live
3. Update Programmable Voice app webhook URL in Telnyx portal to `<FUNCTION_URL>/voice`
4. Test full call flow: browser dial → TeXML webhook → conference → AMD
