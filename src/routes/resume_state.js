// /resume_state — GET/POST: persist queue position across page refreshes
const kv = require('../kv');

module.exports = async function resumeState(params) {
  if (params._method === 'POST' || params.currentIdx !== undefined) {
    await kv.set('resume_state', {
      currentIdx: params.currentIdx !== undefined ? parseInt(params.currentIdx, 10) : 0,
      timestamp:  new Date().toISOString(),
    });
    return { success: true };
  }
  return (await kv.get('resume_state')) || {};
};
