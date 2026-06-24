// /contacts — Read pending contacts from KV queue (replaces Twilio Sync list read)
const kv = require('../kv');

module.exports = async function contacts() {
  const all = await kv.listRange('contact_queue', 0, -1);
  return all.filter(c => c && c.status === 'pending');
};
