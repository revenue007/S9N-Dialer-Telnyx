'use strict';

const http = require('http');
const { URL } = require('url');
const fs = require('fs');
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
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

const indexHtml = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

async function parseBody(req) {
  return new Promise(resolve => {
    let raw = '';
    req.on('data', c => { raw += c; });
    req.on('end', () => {
      if (!raw) return resolve({});
      const ct = req.headers['content-type'] || '';
      try {
        if (ct.includes('application/json')) return resolve(JSON.parse(raw));
        if (ct.includes('application/x-www-form-urlencoded'))
          return resolve(Object.fromEntries(new URLSearchParams(raw)));
      } catch {}
      resolve({});
    });
  });
}

const PORT = process.env.PORT || 8080;

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  if (req.method === 'OPTIONS') {
    res.writeHead(204, CORS);
    return res.end();
  }

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { ...CORS, 'Content-Type': 'text/html' });
    return res.end(indexHtml);
  }

  const handler = routes[pathname];
  if (!handler) {
    res.writeHead(404, { ...CORS, 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Not found' }));
  }

  const query = Object.fromEntries(url.searchParams);
  const body = await parseBody(req);
  const params = { ...query, ...body, _method: req.method };

  try {
    const result = await handler(params);
    if (typeof result === 'string' && result.startsWith('<?xml')) {
      res.writeHead(200, { ...CORS, 'Content-Type': 'text/xml' });
      res.end(result);
    } else {
      res.writeHead(200, { ...CORS, 'Content-Type': 'application/json' });
      res.end(JSON.stringify(result));
    }
  } catch (err) {
    console.error(pathname, err.message);
    res.writeHead(500, { ...CORS, 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  }
}).listen(PORT, () => console.log('S9N Dialer listening on port', PORT));
