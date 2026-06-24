# SeKondBrain Power Dialer — Telnyx Edition

Port of [S9N-Dialer](https://github.com/revenue007/S9N-Dialer) from Twilio Serverless to **Telnyx Edge Compute**.

---

## Stack

| Layer | Twilio (old) | Telnyx (new) |
|---|---|---|
| Serverless runtime | Twilio Functions | Telnyx Edge Compute |
| Data store | Twilio Sync | Upstash Redis |
| Voice XML | TwiML | TeXML (drop-in compatible) |
| Browser SDK | Twilio Voice JS SDK | Telnyx WebRTC SDK |
| Call control REST | Twilio REST API | Telnyx TeXML REST API |
| Browser auth token | Twilio Access Token | Telnyx Telephony Credential Token |

---

## Architecture

```
src/index.js           — HTTP router (single Edge Compute service, all routes)
src/kv.js              — Upstash Redis adapter (replaces Twilio Sync)
src/telnyx.js          — Telnyx REST API helpers (calls, conferences, balance, token)
src/routes/
  token.js             — WebRTC credential token for browser
  voice.js             — TeXML webhook (blacklist check + conference or direct dial)
  voice_join.js        — Outbound leg TeXML (AMD result → machine/human routing)
  amd_status.js        — No-answer/failed status callback → kill browser leg
  contacts.js          — Read pending contacts from KV
  update.js            — Disposition, blacklist, call log, Lemlist, Sheets
  upload.js            — Upload contacts to KV queue
  resume_state.js      — Page-refresh resume position
  dial_out.js          — Create next outbound leg (persistent conference)
  hangup_outbound.js   — End outbound leg only, browser stays in conference
  balance.js           — Telnyx account balance
  lemlist_contacts.js  — Lemlist campaign + phone task pull
  lemlist_update.js    — Push outcomes back to Lemlist
  call_charges.js      — Call cost report since a given date
```

---

## Setup

### 1. Telnyx Portal (portal.telnyx.com)

1. **TeXML Application** → Create one → note the Account SID  
2. **Telephony Credential** → Create one (for browser WebRTC) → note the Credential ID  
3. **Phone number** → Buy or port one → assign to the TeXML Application  
4. Set the TeXML Application's voice webhook URL to `{FUNCTION_URL}/voice`

### 2. Upstash Redis

1. Create a free Redis database at [upstash.com](https://upstash.com)  
2. Copy the **REST URL** and **REST Token**

### 3. GitHub Secrets

Add these in `Settings → Secrets → Actions`:

| Secret | Description |
|---|---|
| `TELNYX_API_KEY` | Telnyx API key from portal.telnyx.com |
| `TELNYX_ACCOUNT_SID` | TeXML Application Account SID |
| `TELNYX_CREDENTIAL_ID` | Telephony Credential ID for WebRTC |
| `FROM_NUMBER` | Outbound number in E.164 (e.g. +17174708407) |
| `FUNCTION_URL` | Public URL of the deployed Edge Compute service |
| `UPSTASH_REDIS_URL` | Upstash Redis REST URL |
| `UPSTASH_REDIS_TOKEN` | Upstash Redis REST token |
| `LEMLIST_API_KEY` | (optional) Lemlist API key |
| `GOOGLE_SHEETS_WEBHOOK` | (optional) Apps Script webhook URL |

### 4. Deploy

Push to `main` — GitHub Actions deploys automatically.

Or manually:
```bash
npm install -g @telnyx/cli
telnyx login
telnyx edge-compute:deploy
```

### 5. Frontend SDK swap

See [FRONTEND_MIGRATION.md](./FRONTEND_MIGRATION.md) — `index.html` needs the Twilio Voice SDK
replaced with the Telnyx WebRTC SDK. This is the final step before the dialer is fully live on Telnyx.

---

## Local development

```bash
export TELNYX_API_KEY=...
export TELNYX_ACCOUNT_SID=...
export TELNYX_CREDENTIAL_ID=...
export FROM_NUMBER=...
export FUNCTION_URL=http://localhost:3000
export UPSTASH_REDIS_URL=...
export UPSTASH_REDIS_TOKEN=...

npm start
# or: npm run dev   (node --watch, auto-restarts on save)
```

Expose locally for Telnyx webhooks:
```bash
npx localtunnel --port 3000
# Set FUNCTION_URL to the tunnel URL and update the TeXML App webhook in Telnyx portal
```

---

## No external dependencies

Zero npm packages required — native `fetch` and `http` throughout. Node 20 ships both.
