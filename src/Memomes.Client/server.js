import http from 'http';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 6523;
const API_TARGET = 'http://localhost:5000'; // C# Memomes.Api backend
const DIST_DIR = path.join(__dirname, 'dist');

const B2_KEY_ID = '008e0d1d842b';
const B2_APP_KEY = '0030f1320724707dc33f380426ddf3371c3fedb37a';
const B2_BUCKET_NAME = 'sathus-memomes-vault';

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff'
};

/**
 * Handle Backblaze B2 Account Authorisation Server-Side
 */
function handleB2Auth(req, res) {
  const authHeader = 'Basic ' + Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
  const proxyReq = https.request('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
    method: 'GET',
    headers: { 'Authorization': authHeader }
  }, (b2Res) => {
    let body = '';
    b2Res.on('data', chunk => body += chunk);
    b2Res.on('end', () => {
      res.writeHead(b2Res.statusCode, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(body);
    });
  });

  proxyReq.on('error', (err) => {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: err.message }));
  });
  proxyReq.end();
}

/**
 * Handle Server-Side Direct Binary Stream Upload to Backblaze B2
 */
function handleB2DirectUpload(req, res) {
  let chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const buffer = Buffer.concat(chunks);
      const fileNameHeader = req.headers['x-bz-file-name'] || req.headers['x-file-name'];
      const contentTypeHeader = req.headers['content-type'] || 'application/octet-stream';
      
      const fileName = fileNameHeader ? decodeURIComponent(fileNameHeader) : `upload_${Date.now()}`;
      
      // Step 1: Authorise with Backblaze B2
      const authHeader = 'Basic ' + Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
      const authData = await new Promise((resolve, reject) => {
        const r = https.request('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
          method: 'GET',
          headers: { Authorization: authHeader }
        }, (res) => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(b)) : reject(new Error(b)));
        });
        r.on('error', reject);
        r.end();
      });

      const apiUrl = authData.apiInfo?.storageApi?.apiUrl || authData.apiUrl;
      
      // Step 2: Resolve Bucket ID
      const bucketsData = await new Promise((resolve, reject) => {
        const r = https.request(`${apiUrl}/b2api/v3/b2_list_buckets?accountId=${authData.accountId}`, {
          method: 'GET',
          headers: { Authorization: authData.authorizationToken }
        }, (res) => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(b)) : reject(new Error(b)));
        });
        r.on('error', reject);
        r.end();
      });

      const bucket = (bucketsData.buckets || []).find(b => b.bucketName === B2_BUCKET_NAME) || bucketsData.buckets?.[0];
      if (!bucket) throw new Error(`Bucket ${B2_BUCKET_NAME} not found`);

      // Step 3: Get B2 Upload URL
      const postData = JSON.stringify({ bucketId: bucket.bucketId });
      const uploadUrlData = await new Promise((resolve, reject) => {
        const r = https.request(`${apiUrl}/b2api/v3/b2_get_upload_url`, {
          method: 'POST',
          headers: {
            Authorization: authData.authorizationToken,
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(postData)
          }
        }, (res) => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(b)) : reject(new Error(b)));
        });
        r.on('error', reject);
        r.write(postData);
        r.end();
      });

      // Step 4: Stream binary payload directly to B2
      const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
      const uploadResData = await new Promise((resolve, reject) => {
        const r = https.request(uploadUrlData.uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: uploadUrlData.authorizationToken,
            'X-Bz-File-Name': encodeURIComponent(fileName),
            'Content-Type': contentTypeHeader,
            'Content-Length': buffer.length,
            'X-Bz-Content-Sha1': sha1
          }
        }, (res) => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(b)) : reject(new Error(b)));
        });
        r.on('error', reject);
        r.write(buffer);
        r.end();
      });

      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      });
      res.end(JSON.stringify({
        success: true,
        fileId: uploadResData.fileId,
        fileName: uploadResData.fileName,
        bucketName: B2_BUCKET_NAME,
        size: uploadResData.contentLength,
        b2FinalUrl: `https://f003.backblazeb2.com/file/${B2_BUCKET_NAME}/${uploadResData.fileName}`
      }));

    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
}

/**
 * Forward /api/* requests to the C# backend (reverse proxy).
 */
function proxyApiRequest(req, res) {
  const targetUrl = new URL(req.url, API_TARGET);
  const options = {
    hostname: targetUrl.hostname,
    port: targetUrl.port || 80,
    path: targetUrl.pathname + targetUrl.search,
    method: req.method,
    headers: {
      ...req.headers,
      host: targetUrl.host
    }
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('error', (err) => {
    console.error('API proxy error:', err.message);
    if (!res.headersSent) {
      res.writeHead(502, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'Backend API unavailable', detail: err.message }));
    }
  });

  req.pipe(proxyReq, { end: true });
}

const server = http.createServer((req, res) => {
  // CORS Preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': '*'
    });
    return res.end();
  }

  // Server-Side Backblaze B2 Endpoints
  if (req.url === '/api/b2-auth') {
    return handleB2Auth(req, res);
  }
  if (req.url === '/api/b2-direct-upload') {
    return handleB2DirectUpload(req, res);
  }

  // Proxy /api/* to the C# backend
  if (req.url.startsWith('/api/') || req.url.startsWith('/api')) {
    return proxyApiRequest(req, res);
  }

  // Serve static files from dist/
  let filePath = path.join(DIST_DIR, req.url === '/' ? 'index.html' : req.url.split('?')[0]);

  if (!fs.existsSync(filePath) || fs.statSync(filePath).isDirectory()) {
    filePath = path.join(DIST_DIR, 'index.html');
  }

  const ext = path.extname(filePath).toLowerCase();
  const contentType = MIME_TYPES[ext] || 'application/octet-stream';

  fs.readFile(filePath, (err, content) => {
    if (err) {
      res.writeHead(500);
      res.end('Server Error: ' + err.code);
    } else {
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content, 'utf-8');
    }
  });
});

server.listen(PORT, () => {
  console.log(`\n==================================================`);
  console.log(`  Memomes Cloud Server running on http://localhost:${PORT}`);
  console.log(`  API Proxy → ${API_TARGET}`);
  console.log(`  B2 Server Proxy Enabled (/api/b2-auth, /api/b2-direct-upload)`);
  console.log(`==================================================\n`);
});
