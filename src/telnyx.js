// Telnyx REST API helpers — replaces Twilio Node SDK
//
// Two API surfaces:
//   TeXML REST API  — Twilio-compatible call/conference management
//                     Base: https://api.telnyx.com/v2/texml/Accounts/{ACCOUNT_SID}
//                     Docs: https://developers.telnyx.com/docs/voice/programmable-voice/texml
//
//   Telnyx v2 API   — balance, call records, credential tokens
//                     Base: https://api.telnyx.com/v2
//                     Auth: Bearer {TELNYX_API_KEY}

const ACCT = () => process.env.TELNYX_ACCOUNT_SID;
const KEY  = () => process.env.TELNYX_API_KEY;
const TEXML = () => `https://api.telnyx.com/v2/texml/Accounts/${ACCT()}`;
const V2 = 'https://api.telnyx.com/v2';

async function texmlReq(method, path, body) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${KEY()}`,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${TEXML()}${path}`, opts);
  if (!r.ok) throw new Error(`Telnyx TeXML ${r.status}: ${await r.text()}`);
  const ct = r.headers.get('content-type') || '';
  return ct.includes('json') ? r.json() : {};
}

async function v2Req(method, path, body) {
  const opts = {
    method,
    headers: {
      Authorization: `Bearer ${KEY()}`,
      'Content-Type': 'application/json',
    },
  };
  if (body) opts.body = JSON.stringify(body);
  const r = await fetch(`${V2}${path}`, opts);
  if (!r.ok) throw new Error(`Telnyx v2 ${r.status}: ${await r.text()}`);
  return r.json();
}

module.exports = {
  // Create outbound call (TeXML-compatible — mirrors Twilio POST /Calls)
  async createCall(params) {
    return texmlReq('POST', '/Calls', params);
  },

  // End a call leg by SID
  async endCall(callSid) {
    return texmlReq('POST', `/Calls/${callSid}`, { Status: 'completed' }).catch(() => {});
  },

  // List in-progress conferences by friendly name
  async listConferences(friendlyName) {
    return texmlReq('GET', `/Conferences?FriendlyName=${encodeURIComponent(friendlyName)}&Status=in-progress`);
  },

  // End a conference
  async endConference(conferenceSid) {
    return texmlReq('POST', `/Conferences/${conferenceSid}`, { Status: 'completed' }).catch(() => {});
  },

  // Account balance
  // Returns: { data: { balance, available_credit, currency, ... } }
  async getBalance() {
    return v2Req('GET', '/balance');
  },

  // Call records with cost since a given ISO timestamp
  // Docs: https://developers.telnyx.com/api/reports/list-calls
  async listCalls(startTime) {
    return v2Req('GET', `/calls?filter[start_time][gte]=${encodeURIComponent(startTime)}&page[size]=1000`);
  },

  // Generate a short-lived WebRTC token for the browser
  // TELNYX_CREDENTIAL_ID = Telephony Credential ID from portal.telnyx.com
  async generateToken() {
    const opts = {
      method: 'POST',
      headers: { Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json' },
    };
    const r = await fetch(`${V2}/telephony_credentials/${process.env.TELNYX_CREDENTIAL_ID}/token`, opts);
    if (!r.ok) throw new Error(`Telnyx v2 ${r.status}: ${await r.text()}`);
    return r.text();
  },
};
