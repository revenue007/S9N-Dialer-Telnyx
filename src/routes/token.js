// /token — Generate a short-lived WebRTC credential token for the browser
// Replaces Twilio Access Token + VoiceGrant.
//
// Setup: create a Telephony Credential in portal.telnyx.com → Voice → Credentials
// and set TELNYX_CREDENTIAL_ID to its ID.
//
// Browser initialises the Telnyx WebRTC SDK with the returned token:
//   const client = new TelnyxRTC({ login_token: token })
const telnyx = require('../telnyx');

module.exports = async function token() {
  const result = await telnyx.generateToken();
  return { token: result.data.token };
};
