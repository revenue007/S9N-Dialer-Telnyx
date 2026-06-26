// /amd_status — POST: Telnyx status callback for the outbound leg
//
// Fired for: no-answer, busy, failed, canceled, completed
// We save the outcome to KV so the browser can poll for it.
// We do NOT kill the browser call — in power dial mode the browser
// stays in the conference and we just dial the next contact.

const kv = require('../kv');

function xml(body) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

const NO_ANSWER_STATUSES = new Set(['no-answer', 'busy', 'failed', 'canceled']);

module.exports = async function amdStatus(params) {
  const callStatus  = params.CallStatus || '';
  const outboundSid = params.CallSid    || '';

  let state = null;
  if (NO_ANSWER_STATUSES.has(callStatus)) state = 'no_answer';
  if (callStatus === 'completed')         state = 'ended';

  if (state) {
    await kv.set('amd_result', { state, outboundSid, ts: Date.now() }).catch(() => {});
  }

  return xml('<Hangup/>');
};
