// /voice — TeXML webhook for the browser's WebRTC leg
//
// Browser calls: sip:<confName>@sip.telnyx.com
// Telnyx fires this webhook with To = "sip:<confName>@sip.telnyx.com"
// We extract confName from the SIP URI and place the browser in that conference.
// endConferenceOnExit=true so the entire conference tears down when the browser leaves.

const kv = require('../kv');

function xml(body) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

module.exports = async function voice(params) {
  const toRaw = params.To || params.to || '';
  // "sip:pd_abc123@sip.telnyx.com" → "pd_abc123"
  const confName = toRaw.replace(/^sip:/i, '').split('@')[0].trim();

  if (!confName) return xml('<Reject/>');

  return xml(
    `<Dial>` +
      `<Conference ` +
        `startConferenceOnEnter="true" ` +
        `endConferenceOnExit="true" ` +
        `beep="false" ` +
        `waitUrl=""` +
      `>${confName}</Conference>` +
    `</Dial>`
  );
};
