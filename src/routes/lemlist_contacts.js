// /lemlist_contacts — GET campaigns or leads from Lemlist; filters blacklist via KV
const kv = require('../kv');

module.exports = async function lemlistContacts(params) {
  const apiKey = process.env.LEMLIST_API_KEY;
  if (!apiKey) return { success: false, error: 'LEMLIST_API_KEY not configured' };

  const auth = 'Basic ' + Buffer.from(':' + apiKey).toString('base64');
  const { campaignId } = params;

  try {
    if (!campaignId) {
      const resp = await fetch('https://api.lemlist.com/api/campaigns', {
        headers: { Authorization: auth },
      });
      if (!resp.ok) {
        const txt = await resp.text();
        return { success: false, error: 'Lemlist error ' + resp.status + ': ' + txt };
      }
      const data = await resp.json();
      const list = Array.isArray(data) ? data : (data.campaigns || data.results || Object.values(data));
      const campaigns = list
        .map(c => ({ id: c._id || c.id, name: c.name }))
        .filter(c => c.id && c.name);
      return { success: true, campaigns };
    }

    const filters = JSON.stringify([
      { filterId: 'campaignId', in: [campaignId] },
      { filterId: 'type',       in: ['phone']     },
    ]);
    const tasksResp = await fetch(
      'https://api.lemlist.com/api/tasks?filters=' + encodeURIComponent(filters) + '&page=0',
      { headers: { Authorization: auth } }
    );
    if (!tasksResp.ok) {
      const txt = await tasksResp.text();
      return { success: false, error: 'Tasks error ' + tasksResp.status + ': ' + txt };
    }
    const tasksData = await tasksResp.json();
    const allTasks  = tasksData.results || [];

    const page      = parseInt(params.page || '0', 10);
    const PAGE_SIZE = 9;
    const tasks     = allTasks.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

    if (!tasks.length) return { success: true, contacts: [], total: 0, withPhone: 0 };

    // Blacklist from KV
    const blacklistKeys = await kv.hkeys('blacklist');
    const blacklisted   = new Set(blacklistKeys);

    function normPhone(p) {
      p = String(p || '').replace(/\D/g, '');
      if (p.length === 10) p = '1' + p;
      if (p && !p.startsWith('+')) p = '+' + p;
      return p.length >= 11 ? p : '';
    }

    const results = await Promise.all(tasks.map(async task => {
      try {
        const [lr, cr] = await Promise.all([
          fetch('https://api.lemlist.com/api/leads/'    + encodeURIComponent(task.leadId),    { headers: { Authorization: auth } }),
          task.contactId
            ? fetch('https://api.lemlist.com/api/contacts/' + encodeURIComponent(task.contactId), { headers: { Authorization: auth } })
            : Promise.resolve(null),
        ]);
        const lead    = lr.ok             ? await lr.json() : {};
        const contact = (cr && cr.ok)     ? await cr.json() : {};
        return { lead, contact, task };
      } catch { return null; }
    }));

    const contacts = [];
    for (const r of results) {
      if (!r) continue;
      const { lead, contact, task } = r;
      const f     = contact.fields || {};
      const phone = normPhone(f.phone || f.phoneNumber || lead.phone || '');
      if (!phone || blacklisted.has(phone)) continue;
      contacts.push({
        firstName:        f.firstName   || lead.firstName   || '',
        lastName:         f.lastName    || lead.lastName    || '',
        email:            lead.email    || '',
        phone,
        title:            f.jobTitle    || f.title          || lead.jobTitle    || '',
        company:          f.companyName || f.company        || lead.companyName || '',
        location:         f.location    || lead.location    || '',
        lemlistCampaignId: campaignId,
        lemlistLeadId:    task.leadId   || '',
        lemlistTaskId:    task._id      || '',
        status:           'pending',
      });
    }

    return {
      success:  true,
      contacts,
      total:    allTasks.length,
      page,
      hasMore:  (page + 1) * PAGE_SIZE < allTasks.length,
      withPhone: contacts.length,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
