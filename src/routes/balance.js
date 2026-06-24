// /balance — GET: Telnyx account balance
// Telnyx v2 balance response: { data: { balance, available_credit, currency, ... } }
const telnyx = require('../telnyx');

module.exports = async function balance() {
  try {
    const result = await telnyx.getBalance();
    const d = result.data || result;
    return {
      success:  true,
      balance:  d.balance ?? d.available_credit,
      currency: d.currency || 'USD',
    };
  } catch (err) {
    return { success: false, error: err.message };
  }
};
