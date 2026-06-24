// /dial_out — POST: create next outbound leg into persistent conference
// Browser stays in the conference; only the outbound leg changes between contacts.
const kv     = require('../kv');
const telnyx = require('../telnyx');

module.exports = async function dialOut(params) {
  const { to, confName, browserCallSid } = params;
  if (!to || !confName) return { error: 'missing to or confName' };

  if (await kv.hexists('blacklist', to)) return { error: 'blacklisted', to };

  const fnUrl = process.env.FUNCTION_URL;

  let call;
  try {
    call = await telnyx.createCall({
      To:   to,
      From: process.env.FROM_NUMBER,
      Url:  `${fnUrl}/voice_join?conf=${encodeURIComponent(confName)}&browserCallSid=${encodeURIComponent(browserCallSid || '')}`,
      MachineDetection:        'Enable',
      AsyncAmd:                'false',
      StatusCallback:          `${fnUrl}/amd_status`,
      StatusCallbackMethod:    'POST',
      StatusCallbackEvent:     'no-answer failed busy canceled',
      Timeout:                 '45',
      MachineDetectionTimeout: '30',
    });
  } catch (e) {
    return { error: e.message };
  }

  const outboundSid = call.sid || call.CallSid || call.call_leg_id;

  // Write pending state so browser can match this specific outbound leg
  await kv.set('amd_result', { state: 'pending', outboundSid, ts: Date.now() }).catch(() => {});

  return { outboundSid };
};
