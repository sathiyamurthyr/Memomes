/**
 * Backblaze B2 Direct Upload Engine + Auto Sync Worker
 *
 * Upload flow:
 *   1) Try to authorise directly with Backblaze B2 Native API (b2_authorize_account).
 *   2) Get an upload URL from B2 (b2_get_upload_url).
 *   3) Stream the encrypted binary directly to B2 (b2_upload_file).
 *   4) If B2 Native API fails, fall back to the .NET API presigned S3 URL route.
 *   5) After a confirmed upload, call LocalVaultDb.markFileAsB2Synced() to atomically
 *      persist the b2Synced=true flag so the file is NEVER re-uploaded.
 *
 * Sync schedule: Immediately on app load + every 2 minutes.
 */

import { LocalVaultDb } from './localVaultDb';
import type { VaultFile } from './localVaultDb';

export interface B2SyncState {
  isSyncing: boolean;
  lastSyncedAt: string | null;
  nextSyncCountdown: number;
  syncedCount: number;
  pendingCount: number;
  targetBucket: string;
  serviceUrl: string;
  statusMessage: string;
  b2RecordLogs: Array<{ id: string; name: string; bucket: string; b2Path: string; uploadedAt: string }>;
}

type SyncStatusListener = (state: B2SyncState) => void;

// ── Backblaze B2 credentials ──────────────────────────────────────────────────
const B2_KEY_ID = '008e0d1d842b';
const B2_APP_KEY = '0030f1320724707dc33f380426ddf3371c3fedb37a';
const B2_BUCKET_NAME = 'sathus-memomes-vault';
const B2_AUTH_URL = 'https://api.backblazeb2.com/b2api/v3/b2_authorize_account';
// ─────────────────────────────────────────────────────────────────────────────

interface B2AuthInfo {
  apiUrl: string;
  authorizationToken: string;
  downloadUrl: string;
}

interface B2UploadUrlInfo {
  uploadUrl: string;
  authorizationToken: string;
}

export class B2SyncWorker {
  private static instance: B2SyncWorker;
  private listeners: Set<SyncStatusListener> = new Set();
  private b2Auth: B2AuthInfo | null = null;
  private b2BucketId: string | null = null;

  public b2Config = {
    keyID: B2_KEY_ID,
    applicationKey: B2_APP_KEY,
    bucketName: B2_BUCKET_NAME,
    serviceUrl: 'https://s3.us-west-004.backblazeb2.com'
  };

  private state: B2SyncState = {
    isSyncing: false,
    lastSyncedAt: null,
    nextSyncCountdown: 120,
    syncedCount: 0,
    pendingCount: 0,
    targetBucket: B2_BUCKET_NAME,
    serviceUrl: 'https://s3.us-west-004.backblazeb2.com',
    statusMessage: 'Backblaze B2 Auto Sync — Initialising…',
    b2RecordLogs: []
  };

  private constructor() {
    this.init();
  }

  public static getInstance(): B2SyncWorker {
    if (!B2SyncWorker.instance) {
      B2SyncWorker.instance = new B2SyncWorker();
    }
    return B2SyncWorker.instance;
  }

  // ── Initialisation ──────────────────────────────────────────────────────────

  private init() {
    try {
      const stored = localStorage.getItem('memomes_b2_records');
      if (stored) this.state.b2RecordLogs = JSON.parse(stored);
    } catch {
      this.state.b2RecordLogs = [];
    }

    this.updateFileCounts();

    // Immediate sync after 3 s (give browser time to finish rendering)
    setTimeout(() => this.triggerSync('Initial B2 Connection'), 3000);

    // Recurring 2-minute sync
    setInterval(() => this.triggerSync('2-Minute Schedule'), 120_000);

    // UI countdown ticker
    setInterval(() => {
      this.state.nextSyncCountdown = Math.max(0, this.state.nextSyncCountdown - 1);
      this.notifyListeners();
    }, 1000);
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  public subscribe(listener: SyncStatusListener): () => void {
    this.listeners.add(listener);
    listener({ ...this.state });
    return () => this.listeners.delete(listener);
  }

  public getState(): B2SyncState {
    return { ...this.state };
  }

  public updateFileCounts() {
    const files = LocalVaultDb.getAllFiles();
    this.state.syncedCount = files.filter(f => f.b2Synced).length;
    this.state.pendingCount = files.filter(f => !f.b2Synced).length;
    this.notifyListeners();
  }

  public async triggerSync(reason: string = 'Manual'): Promise<void> {
    if (this.state.isSyncing) return;

    this.state.isSyncing = true;
    this.state.statusMessage = `Syncing to Backblaze B2 (${B2_BUCKET_NAME})… [${reason}]`;
    this.notifyListeners();

    try {
      const files = LocalVaultDb.getAllFiles();
      const pending = files.filter(f => !f.b2Synced);

      if (pending.length === 0) {
        this.state.statusMessage = `✔ All files already synced in ${B2_BUCKET_NAME}`;
        this.state.lastSyncedAt = new Date().toLocaleTimeString();
        this.state.nextSyncCountdown = 120;
        this.notifyListeners();
        return;
      }

      // Authorise with B2 once per session (cache token)
      await this.ensureB2Auth();

      let uploadedThisCycle = 0;
      let failedThisCycle = 0;

      for (const file of pending) {
        const success = await this.uploadSingleFile(file);
        if (success) {
          uploadedThisCycle++;
        } else {
          failedThisCycle++;
        }
      }

      this.state.lastSyncedAt = new Date().toLocaleTimeString();
      this.state.nextSyncCountdown = 120;

      if (failedThisCycle === 0) {
        this.state.statusMessage = `✔ ${uploadedThisCycle} file${uploadedThisCycle !== 1 ? 's' : ''} uploaded to ${B2_BUCKET_NAME}`;
      } else {
        this.state.statusMessage = `⚠ ${uploadedThisCycle} uploaded, ${failedThisCycle} failed — will retry in 2 mins`;
      }
    } catch (e: any) {
      console.warn('[B2Sync] Sync cycle error:', e?.message || e);
      this.state.statusMessage = '⚠ B2 Sync error — retrying in 2 mins';
    } finally {
      this.state.isSyncing = false;
      this.updateFileCounts();
    }
  }

  // ── B2 Authorisation ────────────────────────────────────────────────────────

  private async ensureB2Auth(): Promise<void> {
    if (this.b2Auth) return; // already authorised this session

    const credentials = btoa(`${B2_KEY_ID}:${B2_APP_KEY}`);
    const res = await fetch(B2_AUTH_URL, {
      method: 'GET',
      headers: { Authorization: `Basic ${credentials}` }
    });

    if (!res.ok) {
      throw new Error(`B2 auth failed: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    this.b2Auth = {
      apiUrl: data.apiInfo?.storageApi?.apiUrl || data.apiUrl,
      authorizationToken: data.authorizationToken,
      downloadUrl: data.apiInfo?.storageApi?.downloadUrl || data.downloadUrl
    };

    // Get bucket ID
    await this.resolveBucketId();
  }

  private async resolveBucketId(): Promise<void> {
    if (!this.b2Auth || this.b2BucketId) return;

    try {
      const res = await fetch(`${this.b2Auth.apiUrl}/b2api/v3/b2_list_buckets?bucketName=${encodeURIComponent(B2_BUCKET_NAME)}`, {
        headers: { Authorization: this.b2Auth.authorizationToken }
      });
      if (res.ok) {
        const data = await res.json();
        const bucket = data.buckets?.[0];
        if (bucket) this.b2BucketId = bucket.bucketId;
      }
    } catch {
      // If we can't resolve bucket ID, uploadFileToB2 will use bucket name fallback
    }
  }

  // ── Single File Upload ──────────────────────────────────────────────────────

  private async uploadSingleFile(file: VaultFile): Promise<boolean> {
    const b2Path = `vault/sathiya/${file.id}.bin`;

    try {
      // Strategy 1: Direct B2 Native API upload
      if (this.b2Auth && this.b2BucketId) {
        const uploaded = await this.uploadViaB2NativeApi(file, b2Path);
        if (uploaded) {
          this.persistSyncedRecord(file, b2Path);
          return true;
        }
      }
    } catch (e: any) {
      console.warn(`[B2Sync] Native B2 upload failed for ${file.name}:`, e?.message);
      // Auth may be stale — reset it
      this.b2Auth = null;
      this.b2BucketId = null;
    }

    try {
      // Strategy 2: Fallback — presigned URL via .NET API
      const uploaded = await this.uploadViaPresignedUrl(file, b2Path);
      if (uploaded) {
        this.persistSyncedRecord(file, b2Path);
        return true;
      }
    } catch (e: any) {
      console.warn(`[B2Sync] Presigned URL upload failed for ${file.name}:`, e?.message);
    }

    console.warn(`[B2Sync] ⚠ Could not upload ${file.name} — will retry next cycle`);
    return false;
  }

  private async uploadViaB2NativeApi(file: VaultFile, b2Path: string): Promise<boolean> {
    if (!this.b2Auth || !this.b2BucketId) return false;

    // Get an upload URL from B2
    const uploadUrlRes = await fetch(`${this.b2Auth.apiUrl}/b2api/v3/b2_get_upload_url`, {
      method: 'POST',
      headers: {
        Authorization: this.b2Auth.authorizationToken,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ bucketId: this.b2BucketId })
    });

    if (!uploadUrlRes.ok) {
      throw new Error(`b2_get_upload_url failed: ${uploadUrlRes.status}`);
    }

    const { uploadUrl, authorizationToken: uploadToken }: B2UploadUrlInfo = await uploadUrlRes.json();

    // Convert dataUrl to binary blob
    const blob = this.dataUrlToBlob(file.dataUrl);
    const sha1 = await this.computeSha1Hex(await blob.arrayBuffer());

    // Upload directly to B2
    const uploadRes = await fetch(uploadUrl, {
      method: 'POST',
      headers: {
        Authorization: uploadToken,
        'X-Bz-File-Name': encodeURIComponent(b2Path),
        'Content-Type': file.type || 'application/octet-stream',
        'Content-Length': String(blob.size),
        'X-Bz-Content-Sha1': sha1
      },
      body: blob
    });

    if (!uploadRes.ok) {
      const errBody = await uploadRes.text().catch(() => '');
      throw new Error(`b2_upload_file failed: ${uploadRes.status} ${errBody}`);
    }

    return true;
  }

  private async uploadViaPresignedUrl(file: VaultFile, _b2Path: string): Promise<boolean> {
    const initRes = await fetch('/api/files/init-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: '00000000-0000-0000-0000-000000000001',
        fileNameEncrypted: file.fileNameEncrypted || `${file.id}.enc`,
        contentTypeEncrypted: file.type || 'application/octet-stream',
        sizeBytes: file.size ? parseFloat(file.size) * 1024 * 1024 | 0 : 1024 * 1024,
        contentHash: `sha256-${file.id}-${Date.now()}`
      })
    });

    if (!initRes.ok) return false;

    const data = await initRes.json();
    const presignedUrl = data.presignedUploadUrl || data.PresignedUploadUrl;
    if (!presignedUrl) return false;

    const blob = this.dataUrlToBlob(file.dataUrl);
    const putRes = await fetch(presignedUrl, {
      method: 'PUT',
      headers: { 'Content-Type': file.type || 'application/octet-stream' },
      body: blob
    });

    return putRes.ok;
  }

  // ── Helpers ─────────────────────────────────────────────────────────────────

  /**
   * Atomically persist B2 sync state to localStorage.
   * MUST be called after a confirmed successful upload.
   */
  private persistSyncedRecord(file: VaultFile, b2Path: string) {
    // 1. Update localStorage b2Synced flag — this is what prevents re-uploads
    LocalVaultDb.markFileAsB2Synced(file.id, b2Path, B2_BUCKET_NAME);

    // 2. Add to visible record log
    const record = {
      id: file.id,
      name: file.name,
      bucket: B2_BUCKET_NAME,
      b2Path,
      uploadedAt: new Date().toLocaleTimeString()
    };
    this.state.b2RecordLogs.unshift(record);
    localStorage.setItem('memomes_b2_records', JSON.stringify(this.state.b2RecordLogs));

    console.info(`[B2Sync] ✔ Uploaded: ${file.name} → ${B2_BUCKET_NAME}/${b2Path}`);
  }

  private dataUrlToBlob(dataUrl: string): Blob {
    const parts = dataUrl.split(',');
    const mimeMatch = parts[0]?.match(/:(.*?);/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
    const byteString = atob(parts[1] || '');
    const byteArray = new Uint8Array(byteString.length);
    for (let i = 0; i < byteString.length; i++) {
      byteArray[i] = byteString.charCodeAt(i);
    }
    return new Blob([byteArray], { type: mimeType });
  }

  private async computeSha1Hex(buffer: ArrayBuffer): Promise<string> {
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-1', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch {
      // Fallback: B2 also accepts "do_not_verify" as the SHA1 for test uploads
      return 'do_not_verify';
    }
  }

  private notifyListeners() {
    const snapshot = { ...this.state };
    this.listeners.forEach(l => l(snapshot));
  }
}

export const b2SyncWorker = B2SyncWorker.getInstance();
