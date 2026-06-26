// /voice_join — TeXML webhook for the outbound (contact) leg
//
// Telnyx runs AMD before hitting this URL (AsyncAmd=false, so AnsweredBy is populated).
//
// machine_* | fax → hang up the outbound leg; browser stays in conference
// human           → join the named conference (connecting browser + contact)
//
// IMPORTANT: endConferenceOnExit=false on the outbound leg so when the contact
// hangs up the browser is NOT disconnected — we just dial the next person.

const kv = require('../kv');

function xml(body) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

module.exports = async function voiceJoin(params) {
  const answeredBy  = params.AnsweredBy || '';
  const confName    = params.conf || '';
  const outboundSid = params.CallSid || '';
  const isMachine   = answeredBy.startsWith('machine') || answeredBy === 'fax';

  if (isMachine) {
    await kv.set('amd_result', { state: 'machine', outboundSid, ts: Date.now() }).catch(() => {});
    return xml('<Hangup/>');
  }

  // Human answered — save result and join conference
  await kv.set('amd_result', { state: 'human', outboundSid, ts: Date.now() }).catch(() => {});

  return xml(
    `<Dial>` +
      `<Conference ` +
        `startConferenceOnEnter="true" ` +
        `endConferenceOnExit="false" ` +
        `beep="false"` +
      `>${confName}</Conference>` +
    `</Dial>`
  );
};
