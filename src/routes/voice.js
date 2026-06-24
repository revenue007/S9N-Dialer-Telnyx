// /voice — TeXML webhook (replaces TwiML voice.js)
// Normal mode  → <Dial> directly to phone number
// Power Dial   → browser joins named conference; outbound leg created via
//               REST API with sync AMD so voice_join receives AnsweredBy
const kv = require('../kv');
const telnyx = require('../telnyx');

function xml(body) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

module.exports = async function voice(params) {
  const to = params.To || params.to || '';
  const powerDial = params.PowerDial === '1';
  const callSid = params.CallSid || params.callSid || '';
  const fnUrl = process.env.FUNCTION_URL;

  if (await kv.hexists('blacklist', to)) return xml('<Reject/>');

  if (!powerDial) {
    return xml(`<Dial callerId="${process.env.FROM_NUMBER}" timeout="45"><Number>${to}</Number></Dial>`);
  }

  const confName = 'pd_' + callSid;

  try {
    await telnyx.createCall({
      To: to,
      From: process.env.FROM_NUMBER,
      Url: `${fnUrl}/voice_join?conf=${encodeURIComponent(confName)}&parentCallSid=${encodeURIComponent(callSid)}`,
      MachineDetection: 'Enable',
      AsyncAmd: 'false',
      StatusCallback: `${fnUrl}/amd_status?parentCallSid=${encodeURIComponent(callSid)}`,
      StatusCallbackMethod: 'POST',
      StatusCallbackEvent: 'no-answer failed busy canceled',
      Timeout: '45',
      MachineDetectionTimeout: '30',
    });
  } catch {
    // Fall back to direct dial if outbound creation fails
    return xml(`<Dial callerId="${process.env.FROM_NUMBER}" timeout="45"><Number>${to}</Number></Dial>`);
  }

  return xml(`<Dial><Conference startConferenceOnEnter="true" endConferenceOnExit="true">${confName}</Conference></Dial>`);
};
