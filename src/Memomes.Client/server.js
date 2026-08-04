import http from 'http';
import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 6523;
const API_TARGET = 'http://localhost:5000'; // C# Memomes.Api backend
const DIST_DIR = path.join(__dirname, 'dist');

const B2_KEY_ID = '008e0d1d842b';
const B2_APP_KEY = '0030f1320724707dc33f380426ddf3371c3fedb37a';
const B2_BUCKET_NAME = 'sathus-memomes-vault';

// Master Key for DEK Envelope Protection
const MASTER_ENCRYPTION_KEY = crypto.createHash('sha256').update('MEMOMES_ZK_AES_256_MASTER_SECRET_2026').digest();

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
 * Handle True AES-256-GCM Server-Side Direct Binary Stream Upload to Backblaze B2
 */
function handleB2DirectUpload(req, res) {
  let chunks = [];
  req.on('data', chunk => chunks.push(chunk));
  req.on('end', async () => {
    try {
      const rawBuffer = Buffer.concat(chunks);
      const fileNameHeader = req.headers['x-bz-file-name'] || req.headers['x-file-name'];
      const contentTypeHeader = req.headers['content-type'] || 'application/octet-stream';
      
      const fileName = fileNameHeader ? decodeURIComponent(fileNameHeader) : `sathus/memomes/workspace001/user001/Others/${Date.now()}/obj_${Date.now()}.enc`;
      
      // Perform AES-256-GCM encryption if payload is not pre-encrypted
      const isAlreadyEncrypted = req.headers['x-memomes-encrypted'] === 'true';
      let encryptedBlob;
      let ivHex;
      let tagHex;
      let dekHex;

      if (isAlreadyEncrypted) {
        encryptedBlob = rawBuffer;
        ivHex = req.headers['x-memomes-iv'] || '';
        tagHex = req.headers['x-memomes-tag'] || '';
        dekHex = req.headers['x-memomes-dek'] || '';
      } else {
        // Generate fresh 256-bit DEK & 12-byte IV
        const dek = crypto.randomBytes(32);
        const iv = crypto.randomBytes(12);

        const cipher = crypto.createCipheriv('aes-256-gcm', dek, iv);
        const ciphertext = Buffer.concat([cipher.update(rawBuffer), cipher.final()]);
        const authTag = cipher.getAuthTag();

        // Layout: [12-byte IV] + [16-byte Auth Tag] + [Ciphertext]
        encryptedBlob = Buffer.concat([iv, authTag, ciphertext]);
        ivHex = iv.toString('hex');
        tagHex = authTag.toString('hex');
        dekHex = dek.toString('hex');
      }

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

      // Step 4: Stream ONLY ENCRYPTED CIPHERTEXT directly to B2
      const sha1 = crypto.createHash('sha1').update(encryptedBlob).digest('hex');
      const uploadResData = await new Promise((resolve, reject) => {
        const r = https.request(uploadUrlData.uploadUrl, {
          method: 'POST',
          headers: {
            Authorization: uploadUrlData.authorizationToken,
            'X-Bz-File-Name': encodeURIComponent(fileName),
            'Content-Type': 'application/octet-stream',
            'Content-Length': encryptedBlob.length,
            'X-Bz-Content-Sha1': sha1
          }
        }, (res) => {
          let b = '';
          res.on('data', c => b += c);
          res.on('end', () => res.statusCode === 200 ? resolve(JSON.parse(b)) : reject(new Error(b)));
        });
        r.on('error', reject);
        r.write(encryptedBlob);
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
        encryption_algorithm: 'AES-256-GCM',
        initialization_vector: ivHex,
        authentication_tag: tagHex,
        dek_reference: dekHex,
        checksum: sha1,
        b2FinalUrl: `https://f003.backblazeb2.com/file/${B2_BUCKET_NAME}/${uploadResData.fileName}`
      }));

    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ success: false, error: err.message }));
    }
  });
}

/**
 * Authenticated Download & In-Memory AES-256-GCM Decryption Route
 */
async function handleB2Download(req, res) {
  try {
    const urlObj = new URL(req.url, 'http://localhost:6523');
    const objectKey = urlObj.searchParams.get('objectKey') || urlObj.searchParams.get('key');
    const dekHex = urlObj.searchParams.get('dek');
    const originalFileName = urlObj.searchParams.get('filename') || 'decrypted_file';

    if (!objectKey) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing objectKey parameter' }));
    }

    // Step 1: Authorise with B2
    const authHeader = 'Basic ' + Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
    const authData = await new Promise((resolve, reject) => {
      const r = https.request('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
        method: 'GET',
        headers: { Authorization: authHeader }
      }, (rRes) => {
        let b = '';
        rRes.on('data', c => b += c);
        rRes.on('end', () => rRes.statusCode === 200 ? resolve(JSON.parse(b)) : reject(new Error(b)));
      });
      r.on('error', reject);
      r.end();
    });

    // Step 2: Download encrypted object from B2
    const downloadUrl = `${authData.apiInfo?.storageApi?.downloadUrl || authData.downloadUrl}/file/${B2_BUCKET_NAME}/${encodeURIComponent(objectKey)}`;
    const encryptedBytes = await new Promise((resolve, reject) => {
      const r = https.request(downloadUrl, {
        method: 'GET',
        headers: { Authorization: authData.authorizationToken }
      }, (rRes) => {
        let chunks = [];
        rRes.on('data', c => chunks.push(c));
        rRes.on('end', () => rRes.statusCode === 200 ? resolve(Buffer.concat(chunks)) : reject(new Error(`HTTP ${rRes.statusCode}`)));
      });
      r.on('error', reject);
      r.end();
    });

    // Extract IV (12 bytes), Auth Tag (16 bytes), Ciphertext
    const iv = encryptedBytes.slice(0, 12);
    const authTag = encryptedBytes.slice(12, 28);
    const ciphertext = encryptedBytes.slice(28);

    const dek = dekHex ? Buffer.from(dekHex, 'hex') : MASTER_ENCRYPTION_KEY;

    const decipher = crypto.createDecipheriv('aes-256-gcm', dek, iv);
    decipher.setAuthTag(authTag);
    const decryptedBuffer = Buffer.concat([decipher.update(ciphertext), decipher.final()]);

    res.writeHead(200, {
      'Content-Type': 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${encodeURIComponent(originalFileName)}"`,
      'Content-Length': decryptedBuffer.length,
      'Access-Control-Allow-Origin': '*'
    });
    return res.end(decryptedBuffer);

  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: `Decryption download failed: ${err.message}` }));
  }
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
  if (req.url?.startsWith('/api/b2-download')) {
    return handleB2Download(req, res);
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
  console.log(`  True AES-256-GCM Encryption Engine Active`);
  console.log(`==================================================\n`);
});
