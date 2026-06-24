// /update — Log disposition, manage blacklist, push to Lemlist + Google Sheets
const kv = require('../kv');

const BLACKLIST_TRIGGERS = ['not_interested', 'wrong_number', 'not_in_service', 'bad_fit', 'do_not_contact'];

module.exports = async function update(params) {
  const {
    index, status, disposition, sentiment, phone,
    firstName, lastName, notes,
    lemlistCampaignId, lemlistLeadId, lemlistTaskId,
  } = params;

  const work = [];

  // Update contact status in queue
  if (index !== undefined) {
    work.push((async () => {
      const existing = (await kv.listRange('contact_queue', index, index))[0] || {};
      await kv.listSet('contact_queue', index, {
        ...existing,
        status,
        disposition,
        sentiment,
        notes,
        calledAt: new Date().toISOString(),
      });
    })());
  }

  // Blacklist
  if (phone && BLACKLIST_TRIGGERS.includes(disposition)) {
    work.push(
      kv.hset('blacklist', phone, { phone, reason: disposition, blacklistedAt: new Date().toISOString() })
    );
  }

  // Call log (append)
  work.push(
    kv.listPush('call_log', {
      phone, disposition, sentiment, notes,
      timestamp: new Date().toISOString(),
    })
  );

  // Lemlist outcome
  if (lemlistLeadId && lemlistCampaignId && process.env.LEMLIST_API_KEY) {
    work.push(lemlistOutcome({ lemlistCampaignId, lemlistLeadId, lemlistTaskId, disposition, sentiment }));
  }

  // Google Sheets webhook
  if (process.env.GOOGLE_SHEETS_WEBHOOK) {
    work.push(
      fetch(process.env.GOOGLE_SHEETS_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          firstName: firstName || '',
          lastName:  lastName  || '',
          phone:       phone      || '',
          disposition: disposition || '',
          sentiment:   sentiment   || '',
          notes:       notes       || '',
        }),
      }).catch(() => {})
    );
  }

  await Promise.all(work);
  return { success: true };
};

async function lemlistOutcome({ lemlistCampaignId, lemlistLeadId, lemlistTaskId, disposition, sentiment }) {
  const auth = 'Basic ' + Buffer.from(':' + process.env.LEMLIST_API_KEY).toString('base64');
  const enc  = encodeURIComponent;
  const h    = { Authorization: auth, 'Content-Type': 'application/json' };

  if (lemlistTaskId) {
    await fetch('https://api.lemlist.com/api/tasks', {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({ id: lemlistTaskId, done: true }),
    }).catch(() => {});
  }

  const DNC = ['wrong_number', 'not_in_service', 'do_not_contact'];
  if (DNC.includes(disposition) || sentiment === 'do_not_contact') {
    await fetch(`https://api.lemlist.com/api/leads/pause/${enc(lemlistLeadId)}`, {
      method: 'POST', headers: h,
    }).catch(() => {});
  } else if (disposition === 'connected') {
    const action = (sentiment === 'no_interest' || sentiment === 'bad_fit') ? 'notInterested' : 'interested';
    await fetch(
      `https://api.lemlist.com/api/campaigns/${enc(lemlistCampaignId)}/leads/${enc(lemlistLeadId)}/${action}`,
      { method: 'POST', headers: h }
    ).catch(() => {});
  }
}
