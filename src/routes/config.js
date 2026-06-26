// /config — GET: return public configuration for the browser
// Exposes the FROM_NUMBER so the browser knows what SIP destination to build.

module.exports = async function config() {
  return {
    fromNumber: process.env.FROM_NUMBER || '',
  };
};
