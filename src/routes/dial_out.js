// /dial_out — POST: dial a contact into the persistent browser conference
//
// Expected body: { to, confName }
// Returns:       { outboundSid } on success, { error } on failure
//
// Flow:
//   1. Browser is already in conference <confName>
//   2. This creates an outbound call to <to> with voice_join as the TeXML webhook
//   3. Telnyx runs AMD (sync) then hits /voice_join with AnsweredBy populated
//   4. /voice_join joins the conference (human) or hangs up (machine)
//   5. /amd_status fires on completion/no-answer and writes to KV

const kv     = require('../kv');
const telnyx = require('../telnyx');

module.exports = async function dialOut(params) {
  const { to, confName } = params;
  if (!to || !confName) return { error: 'missing to or confName' };

  if (await kv.hexists('blacklist', to)) return { error: 'blacklisted', to };

  const fnUrl = process.env.FUNCTION_URL;

  // Clear any stale AMD result before dialing
  await kv.set('amd_result', { state: 'pending', outboundSid: null, ts: Date.now() }).catch(() => {});

  let call;
  try {
    call = await telnyx.createCall({
      To:                      to,
      From:                    process.env.FROM_NUMBER,
      Url:                     `${fnUrl}/voice_join?conf=${encodeURIComponent(confName)}`,
      MachineDetection:        'Enable',
      AsyncAmd:                'false',
      StatusCallback:          `${fnUrl}/amd_status`,
      StatusCallbackMethod:    'POST',
      StatusCallbackEvent:     'no-answer busy failed canceled completed',
      Timeout:                 '45',
      MachineDetectionTimeout: '30',
    });
  } catch (e) {
    return { error: e.message };
  }

  const outboundSid = call.sid || call.CallSid || call.call_leg_id;

  // Update AMD result with the real outboundSid now that we have it
  await kv.set('amd_result', { state: 'pending', outboundSid, ts: Date.now() }).catch(() => {});

  return { outboundSid };
};
