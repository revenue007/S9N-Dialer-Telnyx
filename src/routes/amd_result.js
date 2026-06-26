// /amd_result — GET: return current AMD/call state for the frontend to poll
//
// States:
//   pending   — call in progress, AMD not yet determined
//   machine   — answering machine detected (voice_join fired)
//   human     — human answered (voice_join fired, contact in conference)
//   no_answer — no-answer / busy / failed / canceled (amd_status fired)
//   ended     — human call completed naturally (amd_status fired with completed)

const kv = require('../kv');

module.exports = async function amdResult() {
  return (await kv.get('amd_result')) || { state: 'idle' };
};
