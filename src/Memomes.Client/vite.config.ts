import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import crypto from 'crypto'

const B2_KEY_ID = '008e0d1d842b';
const B2_APP_KEY = '0030f1320724707dc33f380426ddf3371c3fedb37a';
const B2_BUCKET_NAME = 'sathus-memomes-vault';

// Master Key for Server-Side DEK Envelope Protection
const MASTER_ENCRYPTION_KEY = crypto.createHash('sha256').update('MEMOMES_ZK_AES_256_MASTER_SECRET_2026').digest();

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'b2-dev-proxy',
      configureServer(server) {
        server.middlewares.use(async (req, res, next) => {
          if (req.url === '/api/b2-auth') {
            const authHeader = 'Basic ' + Buffer.from(`${B2_KEY_ID}:${B2_APP_KEY}`).toString('base64');
            const proxyReq = https.request('https://api.backblazeb2.com/b2api/v3/b2_authorize_account', {
              method: 'GET',
              headers: { 'Authorization': authHeader }
            }, (b2Res) => {
              let body = '';
              b2Res.on('data', chunk => body += chunk);
              b2Res.on('end', () => {
                res.writeHead(b2Res.statusCode || 200, {
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
            return proxyReq.end();
          }

          // TRUE AES-256-GCM ENCRYPTED UPLOAD TO BACKBLAZE B2
          if (req.url === '/api/b2-direct-upload' && req.method === 'POST') {
            let chunks: Uint8Array[] = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
              try {
                const rawBuffer = Buffer.concat(chunks);
                const fileNameHeader = req.headers['x-bz-file-name'] || req.headers['x-[#file-name]'] || req.headers['x-file-name'];
                
                const fileName = fileNameHeader ? decodeURIComponent(fileNameHeader as string) : `sathus/memomes/workspace001/user001/Others/${Date.now()}/obj_${Date.now()}.enc`;
                
                // Perform AES-256-GCM encryption if payload does not already contain IV header
                const isAlreadyEncrypted = req.headers['x-memomes-encrypted'] === 'true';
                let encryptedBlob: Buffer;
                let ivHex: string;
                let tagHex: string;
                let dekHex: string;

                if (isAlreadyEncrypted) {
                  encryptedBlob = rawBuffer;
                  ivHex = (req.headers['x-memomes-iv'] as string) || '';
                  tagHex = (req.headers['x-memomes-tag'] as string) || '';
                  dekHex = (req.headers['x-memomes-dek'] as string) || '';
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
                const authData = await new Promise<any>((resolve, reject) => {
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
                const bucketsData = await new Promise<any>((resolve, reject) => {
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

                const bucket = (bucketsData.buckets || []).find((b: any) => b.bucketName === B2_BUCKET_NAME) || bucketsData.buckets?.[0];
                if (!bucket) throw new Error(`Bucket ${B2_BUCKET_NAME} not found`);

                // Step 3: Get B2 Upload URL
                const postData = JSON.stringify({ bucketId: bucket.bucketId });
                const uploadUrlData = await new Promise<any>((resolve, reject) => {
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
                const uploadResData = await new Promise<any>((resolve, reject) => {
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

              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err?.message || err }));
              }
            });
            return;
          }

          // AUTHENTICATED DOWNLOAD & AES-256-GCM DECRYPTION ROUTE
          if (req.url?.startsWith('/api/b2-download')) {
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
              const authData = await new Promise<any>((resolve, reject) => {
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
              const encryptedBytes = await new Promise<Buffer>((resolve, reject) => {
                const r = https.request(downloadUrl, {
                  method: 'GET',
                  headers: { Authorization: authData.authorizationToken }
                }, (rRes) => {
                  let chunks: Uint8Array[] = [];
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

              // Use provided DEK or derive from MASTER_KEY
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

            } catch (err: any) {
              res.writeHead(500, { 'Content-Type': 'application/json' });
              return res.end(JSON.stringify({ error: `Decryption download failed: ${err.message}` }));
            }
          }

          next();
        });
      }
    }
  ],
  server: {
    port: 6523,
    host: true,
    strictPort: false,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false
      }
    }
  }
})
