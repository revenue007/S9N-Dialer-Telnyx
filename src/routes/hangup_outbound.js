// /hangup_outbound — POST: end outbound leg only, browser stays in conference
const telnyx = require('../telnyx');

module.exports = async function hangupOutbound(params) {
  const { outboundSid } = params;
  if (!outboundSid) return { ok: false, error: 'missing outboundSid' };

  try {
    await telnyx.endCall(outboundSid);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e.message };
  }
};
