// /voice_join — TeXML for outbound leg (replaces TwiML voice_join.js)
// Telnyx delivers sync AMD result in AnsweredBy before hitting this URL.
// machine_* | fax  → kill parent (browser) call + end conference
// human            → join conference, connecting browser and contact
const telnyx = require('../telnyx');

function xml(body) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

module.exports = async function voiceJoin(params) {
  const answeredBy    = params.AnsweredBy || '';
  const confName      = params.conf || '';
  const parentCallSid = params.parentCallSid || '';
  const isMachine     = answeredBy.startsWith('machine') || answeredBy === 'fax';

  if (isMachine) {
    if (parentCallSid) await telnyx.endCall(parentCallSid);

    // Fallback: end conference by friendly name — guarantees browser disconnects
    if (confName) {
      try {
        const resp = await telnyx.listConferences(confName);
        const list = resp.conferences || (Array.isArray(resp) ? resp : []);
        if (list.length > 0) {
          await telnyx.endConference(list[0].sid || list[0].ConferenceSid);
        }
      } catch {}
    }
    return xml('<Hangup/>');
  }

  return xml(`<Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true">${confName}</Conference></Dial>`);
};
