// /call_charges — GET: Telnyx call cost report since a given date
// Docs: https://developers.telnyx.com/api/reports/list-calls
// GET ?since=YYYY-MM-DD (default 2026-06-22)
const telnyx = require('../telnyx');

module.exports = async function callCharges(params) {
  const since     = params.since || '2026-06-22';
  const startTime = since + 'T00:00:00Z';

  try {
    const result = await telnyx.listCalls(startTime);
    const calls  = result.data || [];

    let total = 0, priced = 0, unpriced = 0;
    const byDay = {};
    const rows  = [];

    calls.forEach(c => {
      const cost = c.cost != null ? Math.abs(parseFloat(c.cost)) : null;
      if (cost != null) { total += cost; priced++; } else unpriced++;
      const day = c.start_time ? c.start_time.slice(0, 10) : 'unknown';
      if (!byDay[day]) byDay[day] = { calls: 0, cost: 0 };
      byDay[day].calls++;
      if (cost != null) byDay[day].cost += cost;
      rows.push({
        id:        c.call_leg_id || c.id,
        to:        c.to,
        from:      c.from,
        direction: c.direction,
        status:    c.status,
        startTime: c.start_time,
        duration:  c.duration_secs,
        price:     cost != null ? cost.toFixed(4) : null,
        currency:  c.cost_currency || 'USD',
      });
    });

    Object.keys(byDay).forEach(d => { byDay[d].cost = Number(byDay[d].cost.toFixed(4)); });

    return {
      success:        true,
      since,
      currency:       calls[0]?.cost_currency || 'USD',
      totalCalls:     calls.length,
      pricedCalls:    priced,
      unpricedCalls:  unpriced,
      totalCharges:   Number(total.toFixed(4)),
      byDay,
      calls:          rows,
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
