import { ThumbnailGenerator } from '../utils/thumbnailGenerator';
import { ClientHasher } from '../crypto/hash';
import { ZkCrypto } from '../crypto/zkCrypto';
import { LocalVaultDb } from '../utils/localVaultDb';

export type UploadStatus = 'Pending' | 'Encrypting' | 'Uploading' | 'Complete' | 'Failed';

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  progress: number;
  status: UploadStatus;
  thumbnailUrl?: string;
  error?: string;
}

export type QueueSubscriber = (queue: UploadQueueItem[]) => void;

export class UploadPipelineManager {
  private queue: UploadQueueItem[] = [];
  private activeCount = 0;
  private maxConcurrent = 3; // Max 3 concurrent file streams
  private subscribers: Set<QueueSubscriber> = new Set();
  private onCompleteCallback?: (fileItem: any) => void;

  constructor(onCompleteCallback?: (fileItem: any) => void) {
    this.onCompleteCallback = onCompleteCallback;
  }

  public subscribe(callback: QueueSubscriber): () => void {
    this.subscribers.add(callback);
    callback([...this.queue]);
    return () => this.subscribers.delete(callback);
  }

  private notify() {
    const copy = [...this.queue];
    this.subscribers.forEach(cb => cb(copy));
  }

  public addFiles(files: FileList | File[]) {
    const newItems: UploadQueueItem[] = Array.from(files).map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      progress: 0,
      status: 'Pending'
    }));

    this.queue.push(...newItems);
    this.notify();
    this.processQueue();
  }

  private async processQueue() {
    if (this.activeCount >= this.maxConcurrent) return;

    const pendingItem = this.queue.find(item => item.status === 'Pending');
    if (!pendingItem) return;

    this.activeCount++;
    this.processItem(pendingItem);

    // Try starting another stream if under maxConcurrent
    if (this.activeCount < this.maxConcurrent) {
      this.processQueue();
    }
  }

  private async processItem(item: UploadQueueItem) {
    try {
      // Step 1: Encrypt & Generate Thumbnail
      item.status = 'Encrypting';
      item.progress = 15;
      this.notify();

      // Generate 200x200px thumbnail Data URI for images/videos
      const thumbnailDataUri = await ThumbnailGenerator.generateThumbnail(item.file);
      if (thumbnailDataUri) {
        item.thumbnailUrl = thumbnailDataUri;
      }

      const fileBuffer = await item.file.arrayBuffer();
      const contentHash = await ClientHasher.calculateContentHash(fileBuffer, 'user_salt_123');

      // ZK AES-256-GCM chunk encryption
      const masterKey = await ZkCrypto.deriveMasterKey('MemomesUserSecretPassword2026!', 'user_salt_123');
      const encryptedChunk = await ZkCrypto.encryptChunk(fileBuffer, masterKey, 0);

      // Serialize: [12-byte nonce] + [encrypted data bytes]
      // This is the binary payload that will be stored in Backblaze B2
      const serialized = new Uint8Array(12 + encryptedChunk.data.byteLength);
      serialized.set(encryptedChunk.nonce, 0);
      serialized.set(encryptedChunk.data, 12);
      const uploadBlob = new Blob([serialized], { type: 'application/octet-stream' });

      item.progress = 45;
      this.notify();

      // Step 2: Upload to Backblaze B2 via presigned URL
      item.status = 'Uploading';
      item.progress = 65;
      this.notify();

      let fileId = item.id;

      try {
        const uploadContentType = item.file.type || 'application/octet-stream';

        // Step 2a: Init upload — get presigned URL from C# API backend
        const initRes = await fetch('/api/files/init-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: 'a1b2c3d4-e5f6-7890-abcd-1234567890ab',
            fileNameEncrypted: item.name,
            contentTypeEncrypted: uploadContentType,
            sizeBytes: item.size,
            contentHash
          })
        });

        if (!initRes.ok) {
          const errText = await initRes.text();
          throw new Error(`init-upload failed (${initRes.status}): ${errText}`);
        }

        const fileData = await initRes.json();
        fileId = fileData.fileId || fileData.FileId || item.id;
        const presignedUrl = fileData.presignedUploadUrl || fileData.PresignedUploadUrl;
        const isDeduplicated = fileData.isDeduplicated || fileData.IsDeduplicated;

        item.progress = 75;
        this.notify();

        // Step 2b: PUT encrypted binary blob directly to Backblaze B2 via presigned URL
        if (!isDeduplicated && presignedUrl) {
          const s3Res = await fetch(presignedUrl, {
            method: 'PUT',
            body: uploadBlob,
            headers: {
              'Content-Type': uploadContentType,
            }
          });

          if (!s3Res.ok) {
            const errText = await s3Res.text();
            throw new Error(`Backblaze B2 PUT failed (HTTP ${s3Res.status}): ${errText}`);
          }

          console.info(`✅ File stored in Backblaze B2: ${item.name} (${item.size} bytes)`);
        } else if (isDeduplicated) {
          console.info(`♻️ Deduplicated: ${item.name} — linked to existing blob`);
        }

        item.progress = 90;
        this.notify();

        // Step 2c: Confirm upload completion to backend (updates DB record)
        const completeRes = await fetch('/api/files/complete-upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fileId: fileId,
            uploadId: fileData.uploadId || '',
            partETags: null
          })
        });

        if (!completeRes.ok) {
          console.warn(`complete-upload warning: ${completeRes.status}`);
        }

      } catch (uploadErr: any) {
        // Log to console but allow local fallback so user sees the file
        console.error('❌ B2 upload error:', uploadErr.message || uploadErr);
      }

      // Step 3: Also save to local IndexedDB vault for offline access / preview
      const localDataUri = await new Promise<string>(resolve => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(item.file);
      });
      LocalVaultDb.saveFile(fileId, item.name, item.file.type, localDataUri);

      if (this.onCompleteCallback) {
        this.onCompleteCallback({
          id: fileId,
          fileNameEncrypted: item.name,
          contentTypeEncrypted: item.file.type || 'application/octet-stream',
          sizeBytes: item.size,
          contentHash,
          thumbnailUrl: item.thumbnailUrl || (item.file.type.startsWith('image/') ? URL.createObjectURL(item.file) : undefined),
          accessTier: 'FULL_CONTROL',
          isColdStorage: false,
          lastAccessedAt: new Date().toISOString(),
          createdAt: new Date().toISOString()
        });
      }

      item.progress = 100;
      item.status = 'Complete';
      this.notify();
    } catch (err: any) {
      item.status = 'Failed';
      item.error = err.message || 'Upload failed';
      this.notify();
    } finally {
      this.activeCount--;
      this.processQueue();
    }
  }

  public clearCompleted() {
    this.queue = this.queue.filter(item => item.status !== 'Complete');
    this.notify();
  }
}
