'use strict';

const { URL } = require('url');
const fs   = require('fs');
const path = require('path');

const routes = {
  '/token':            require('./routes/token'),
  '/config':           require('./routes/config'),
  '/voice':            require('./routes/voice'),
  '/voice_join':       require('./routes/voice_join'),
  '/amd_status':       require('./routes/amd_status'),
  '/amd_result':       require('./routes/amd_result'),
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
  'Access-Control-Allow-Origin':  '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

let indexHtml;

module.exports = {
  init: async () => {
    indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
  },

  handle: async (context, body) => {
    const { method, headers, query } = context;

    const rawPath = context.path
      || headers['x-forwarded-uri']
      || headers['x-original-uri']
      || '/';
    const pathname = rawPath.split('?')[0];

    if (method === 'OPTIONS') {
      return { statusCode: 204, headers: CORS, body: '' };
    }

    if (pathname === '/' || pathname === '/index.html') {
      return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'text/html' }, body: indexHtml };
    }

    const handler = routes[pathname];
    if (!handler) {
      return {
        statusCode: 404,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Not found', path: pathname }),
      };
    }

    const params = { ...query, ...body, _method: method };

    try {
      const result = await handler(params);
      if (typeof result === 'string' && result.startsWith('<?xml')) {
        return { statusCode: 200, headers: { ...CORS, 'Content-Type': 'text/xml' }, body: result };
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

  shutdown: async () => {},
};
