// /upload — Receive contacts, filter blacklist, write to KV queue
// Browser sends contacts in chunks of 100 (first chunk replaces queue, rest append).
// Parallel batches of 25 avoid any edge compute timeout limits.
const kv = require('../kv');

module.exports = async function upload(params) {
  const append = params.append === '1' || params.append === 1;

  let contacts;
  try {
    contacts = JSON.parse(params.contacts || '[]');
  } catch (e) {
    return { success: false, error: 'Could not parse contacts: ' + e.message };
  }

  try {
    // Load full blacklist once to avoid N individual checks
    const blacklistKeys = await kv.hkeys('blacklist');
    const blacklisted   = new Set(blacklistKeys);

    // Clear queue on first chunk
    if (!append) await kv.del('contact_queue');

    // Filter and batch-insert
    const clean   = contacts.filter(c => c.phone && !blacklisted.has(c.phone));
    const skipped = contacts.length - clean.length;

    const BATCH = 25;
    let added = 0;
    for (let i = 0; i < clean.length; i += BATCH) {
      const slice = clean.slice(i, i + BATCH);
      await Promise.all(slice.map(c => kv.listPush('contact_queue', { ...c, status: 'pending' })));
      added += slice.length;
    }

    return { success: true, added, skipped };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
