import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import https from 'https'
import crypto from 'crypto'

const B2_KEY_ID = '008e0d1d842b';
const B2_APP_KEY = '0030f1320724707dc33f380426ddf3371c3fedb37a';
const B2_BUCKET_NAME = 'sathus-memomes-vault';

// https://vite.dev/config/
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

          if (req.url === '/api/b2-direct-upload' && req.method === 'POST') {
            let chunks: Uint8Array[] = [];
            req.on('data', chunk => chunks.push(chunk));
            req.on('end', async () => {
              try {
                const buffer = Buffer.concat(chunks);
                const fileNameHeader = req.headers['x-bz-file-name'] || req.headers['x-file-name'];
                const contentTypeHeader = (req.headers['content-type'] as string) || 'application/octet-stream';
                
                const fileName = fileNameHeader ? decodeURIComponent(fileNameHeader as string) : `upload_${Date.now()}`;
                
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

                // Step 4: Stream binary payload directly to B2
                const sha1 = crypto.createHash('sha1').update(buffer).digest('hex');
                const uploadResData = await new Promise<any>((resolve, reject) => {
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

              } catch (err: any) {
                res.writeHead(500, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({ success: false, error: err?.message || err }));
              }
            });
            return;
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
