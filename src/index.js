// SeKondBrain Power Dialer — Telnyx Edge Compute entry point
// Uses Knative faas-js-runtime: exports { init, handle, shutdown }
const { URL } = require('url');

const routes = {
  '/token':            require('./routes/token'),
  '/voice':            require('./routes/voice'),
  '/voice_join':       require('./routes/voice_join'),
  '/amd_status':       require('./routes/amd_status'),
  '/contacts':         require('./routes/contacts'),
  '/update':           require('./routes/update'),
  '/upload':           require('./routes/upload'),
  '/resume_state':     require('./routes/resume_state'),
  '/dial_out':         require('./routes/dial_out'),
  '/hangup_outbound':  require('./routes/hangup_outbound'),
  '/balance':          require('./routes/balance'),
  '/lemlist_contacts': require('./routes/lemlist_contacts'),
  '/lemlist_update':   require('./routes/lemlist_update'),
  '/call_charges':     require('./routes/call_charges'),
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

module.exports = {
  init() {
    console.log('S9N Dialer initialised');
  },

  async handle(context, body) {
    const req = context.req || context;
    const method = (req.method || 'GET').toUpperCase();
    const rawUrl = req.url || '/';
    const url = new URL(rawUrl, 'http://localhost');
    const pathname = url.pathname;

    // CORS preflight
    if (method === 'OPTIONS') {
      return { statusCode: 204, headers: CORS, body: '' };
    }

    // Serve index.html at root
    if (pathname === '/' || pathname === '/index.html') {
      const fs = require('fs');
      const path = require('path');
      const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'text/html' },
        body: html,
      };
    }

    const handler = routes[pathname];
    if (!handler) {
      return {
        statusCode: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found' }),
      };
    }

    const query = Object.fromEntries(url.searchParams);
    const parsed = typeof body === 'string'
      ? (() => { try { return JSON.parse(body); } catch { return {}; } })()
      : (body || {});
    const params = { ...query, ...parsed, _method: method };

    try {
      const result = await handler(params);
      if (typeof result === 'string' && result.startsWith('<?xml')) {
        return {
          statusCode: 200,
          headers: { ...CORS, 'Content-Type': 'text/xml' },
          body: result,
        };
      }
      return {
        statusCode: 200,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify(result),
      };
    } catch (err) {
      console.error(pathname, err.message);
      return {
        statusCode: 500,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: err.message }),
      };
    }
  },

  shutdown() {
    console.log('S9N Dialer shutting down');
  },
};
