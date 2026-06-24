// /lemlist_update — POST outcome to Lemlist (no Twilio dependencies — unchanged)
module.exports = async function lemlistUpdate(params) {
  const apiKey = process.env.LEMLIST_API_KEY;
  if (!apiKey) return { success: false, error: 'LEMLIST_API_KEY not configured' };

  const auth = 'Basic ' + Buffer.from('anystring:' + apiKey).toString('base64');
  const { email, campaignId, action } = params;
  if (!email || !action) return { success: false, error: 'email and action are required' };

  const enc = encodeURIComponent;
  let url, method, body;

  switch (action) {
    case 'interested':
      url    = `https://api.lemlist.com/api/campaigns/${enc(campaignId)}/leads/${enc(email)}/interested`;
      method = 'POST';
      break;
    case 'notInterested':
      url    = `https://api.lemlist.com/api/campaigns/${enc(campaignId)}/leads/${enc(email)}/notInterested`;
      method = 'POST';
      break;
    case 'unsubscribe':
      url    = `https://api.lemlist.com/api/leads/${enc(email)}`;
      method = 'DELETE';
      break;
    case 'stepCompleted':
      url    = `https://api.lemlist.com/api/campaigns/${enc(campaignId)}/leads/${enc(email)}`;
      method = 'PATCH';
      body   = JSON.stringify({ isPaused: false });
      break;
    default:
      return { success: false, error: 'Unknown action: ' + action };
  }

  try {
    const opts = { method, headers: { Authorization: auth, 'Content-Type': 'application/json' } };
    if (body) opts.body = body;
    const resp = await fetch(url, opts);
    if (!resp.ok) {
      const txt = await resp.text();
      return { success: false, error: 'Lemlist error ' + resp.status + ': ' + txt };
    }
    return { success: true };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
