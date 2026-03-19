const http = require('http');
const https = require('https');
const fs = require('fs');
const path = require('path');

const MIME = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

const API_KEY = process.env.ANTHROPIC_API_KEY || process.argv[2] || '';

http.createServer((req, res) => {
  // API proxy for /api/generate
  if (req.url === '/api/generate' && req.method === 'POST') {
    if (!API_KEY) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'ANTHROPIC_API_KEY env var not set. Run: ANTHROPIC_API_KEY=sk-... node serve.js' }));
      return;
    }

    let body = '';
    req.on('data', chunk => { body += chunk; });
    req.on('end', () => {
      const postData = Buffer.from(body);
      const options = {
        hostname: 'api.anthropic.com',
        path: '/v1/messages',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'anthropic-version': '2023-06-01',
          'x-api-key': API_KEY,
          'Content-Length': postData.length,
        },
      };

      const apiReq = https.request(options, apiRes => {
        let data = '';
        apiRes.on('data', chunk => { data += chunk; });
        apiRes.on('end', () => {
          res.writeHead(apiRes.statusCode, { 'Content-Type': 'application/json' });
          res.end(data);
        });
      });

      apiReq.on('error', err => {
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: err.message }));
      });

      apiReq.write(postData);
      apiReq.end();
    });
    return;
  }

  // Static file serving
  let url = req.url.split('?')[0];
  if (url === '/') url = '/index.html';
  const file = path.join(__dirname, url);
  const ext = path.extname(file);

  fs.readFile(file, (err, data) => {
    if (err) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('Not found');
    } else {
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Cache-Control': 'no-store' });
      res.end(data);
    }
  });
}).listen(3000, () => {
  console.log('Listening on http://localhost:3000');
  if (API_KEY) {
    console.log('ANTHROPIC_API_KEY detected — real API calls enabled');
  } else {
    console.log('No ANTHROPIC_API_KEY — use dev mode toggle for mock data, or restart with: ANTHROPIC_API_KEY=sk-... node serve.js');
  }
});
