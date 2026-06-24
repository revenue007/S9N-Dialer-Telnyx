// /resume_state — GET/POST last dialled position for page-refresh resume
// Replaces Twilio Sync Document with a simple KV string.
const kv = require('../kv');

module.exports = async function resumeState(params) {
  // POST: save position
  if (params.lastPhone || params._method === 'POST') {
    await kv.set('resume_state', {
      lastPhone: params.lastPhone,
      firstName: params.firstName,
      lastName:  params.lastName,
      timestamp: new Date().toISOString(),
    });
    return { success: true };
  }

  // GET: read position
  return (await kv.get('resume_state')) || {};
};
