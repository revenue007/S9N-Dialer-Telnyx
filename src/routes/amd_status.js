// /amd_status — POST: Telnyx status callback for no-answer/failed/busy/canceled
// Kills the parent (browser) call so its disconnect event fires and autoAdvance triggers.
const telnyx = require('../telnyx');

function xml(body) {
  return `<?xml version="1.0" encoding="UTF-8"?><Response>${body}</Response>`;
}

module.exports = async function amdStatus(params) {
  const callStatus    = params.CallStatus || '';
  const parentCallSid = params.parentCallSid || '';
  const terminal      = ['no-answer', 'failed', 'busy', 'canceled'];

  if (parentCallSid && terminal.includes(callStatus)) {
    await telnyx.endCall(parentCallSid);
  }

  return xml('<Hangup/>');
};
