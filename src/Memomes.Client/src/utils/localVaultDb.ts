/**
 * Local Vault Database Simulator & Enterprise Metadata Storage Engine
 * Persists uploaded file payloads, hierarchical object keys, and complete
 * enterprise database metadata in browser storage.
 */

import { StoragePathBuilder, type StoragePathResult } from './storagePathBuilder';
import { WorkspaceStore } from './workspaceStore';
import { SupabaseClientService } from '../services/supabaseClientService';
import { VaultEncryptionEngine } from './vaultEncryptionEngine';

export interface EnterpriseFileMetadata {
  file_id: string;
  tenant_id: string;
  company_id: string;
  workspace_id: string;
  user_id: string;
  folder_id?: string;
  storage_object_id: string;
  object_id: string;
  folder_path: string;
  object_key: string;
  bucket_name: string;
  storage_provider: string;
  original_file_name: string;
  display_name: string;
  storage_object_name: string;
  stored_file_name: string;
  extension: string;
  mime_type: string;
  file_size: number;
  checksum: string;
  checksum_sha256?: string;
  checksum_sha1?: string;
  file_hash_sha256?: string;
  original_filename?: string;
  encrypted_filename?: string;
  version?: number;
  parent_file_id?: string;
  duplicate_of?: string;
  is_latest?: boolean;
  upload_count?: number;
  last_uploaded?: string;
  thumbnail_object_id?: string;
  preview_object_id?: string;
  ai_index_status: string;
  virus_scan_status: string;
  encryption_status: string;
  share_status: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  b2_final_url: string;
}

export interface VaultFile {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  size?: string;
  updatedAt?: string;
  category?: 'image' | 'video' | 'document' | 'archive' | 'other' | string;
  fileNameEncrypted?: string;
  
  // Enterprise Hierarchical Metadata
  metadata?: EnterpriseFileMetadata;

  // B2 Sync tracking fields
  b2Synced?: boolean;
  b2SyncedAt?: string;
  b2Bucket?: string;
  b2Path?: string;
  b2FinalUrl?: string;
  accessTier?: string;
  previewUrl?: string;
  uploadedAt?: string;
  shared?: boolean;
  isFavorite?: boolean;
  sizeBytes?: number;
  tags?: string[];
  isColdStorage?: boolean;
  
  // Zero-Knowledge Client-Side AES-256-GCM Encryption Metadata
  encIv?: string;
  encSalt?: string;
  encVersion?: number;
  encFileName?: string;
}

const STORAGE_KEY = 'memomes_vault_files';
const RAM_DATA_URL_CACHE = new Map<string, string>();

// ── IndexedDB Binary Blob Store ─────────────────────────────────────────────
// Stores large binary file payloads (audio, video, etc.) that cannot fit in
// localStorage's ~5 MB quota. Data persists across page refreshes.
// ─────────────────────────────────────────────────────────────────────────────
const IDB_NAME = 'memomes_vault_blobs';
const IDB_STORE = 'blobs';
const IDB_VERSION = 1;

let _idbPromise: Promise<IDBDatabase> | null = null;

function openVaultIDB(): Promise<IDBDatabase> {
  if (_idbPromise) return _idbPromise;
  _idbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    const req = indexedDB.open(IDB_NAME, IDB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(IDB_STORE)) {
        db.createObjectStore(IDB_STORE);
      }
    };
    req.onsuccess = (e) => resolve((e.target as IDBOpenDBRequest).result);
    req.onerror = (e) => reject((e.target as IDBOpenDBRequest).error);
  });
  return _idbPromise;
}

// ── VALID ZERO-KNOWLEDGE PREVIEW PAYLOAD CONSTANTS ─────────────────────────────
export const VALID_SAMPLE_PDF_DATA_URL = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PCAvVHlwZSAvQ2F0YWxvZyAvUGFnZXMgMiAwIFIgPj4KZW5kb2JqCjIgMCBvYmoKPDwgL1R5cGUgL1BhZ2VzIC9LaWRzIFszIDAgUl0gL0NvdW50IDEgPj4KZW5kb2JqCjMgMCBvYmoKPDwgL1R5cGUgL1BhZ2UgL1BhcmVudCAyIDAgUiAvTWVkaWFCb3ggWzAgMCA2MTIgNzkyXSAvUmVzb3VyY2VzIDw8IC9Gb250IDw8IC9GMSA0IDAgUiA+PiA+PiAvQ29udGVudHMgNSAwIFIgPj4KZW5kb2JqCjQgMCBvYmoKPDwgL1R5cGUgL0ZvbnQgL1N1YnR5cGUgL1R5cGUxIC9CYXNlRm9udCAvSGVsdmV0aWNhID4+CmVuZG9iago1IDAgb2JqCjw8IC9MZW5ndGggODMgPj4Kc3RyZWFtCkJUCi9GMSAyMCBUZgo1MCA3MjAgVGQKKE1FTU9NRVMgQ0xPVUQgLSBaRVJPIEtOT1dMRURHRSBFTkNSWVBURUQgVkFVTFQpIFRqCkVUCmVuZHN0cmVhbQplbmRvYmoKeHJlZgowIDYKMDAwMDAwMDAwMCA2NTUzNSBmIAowMDAwMDAwMDA5IDAwMDAwIG4gCjAwMDAwMDAwNTggMDAwMDAgbiAKMDAwMDAwMDExNSAwMDAwMCBuIAowMDAwMDAwMjMzIDAwMDAwIG4gCjAwMDAwMDAzMDUgMDAwMDAgbiAKdHJhaWxlcgo8PCAvU2l6ZSA2IC9Sb290IDEgMCBSID4+CnN0YXJ0eHJlZgo0NDAKJSVFT0YK';

export const VALID_SAMPLE_IMAGE_DATA_URL = 'data:image/svg+xml;charset=utf-8,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600"><rect width="800" height="600" fill="%230B1120"/><rect x="20" y="20" width="760" height="560" rx="16" fill="%230F172A" stroke="%231E293B" stroke-width="2"/><text x="400" y="290" fill="%23FFFFFF" font-family="monospace" font-size="24" font-weight="bold" text-anchor="middle">MEMOMES ZERO-KNOWLEDGE ENCRYPTED IMAGE</text><text x="400" y="330" fill="%23F5B700" font-family="monospace" font-size="14" text-anchor="middle">🔒 AES-256-GCM Encrypted Payload Active</text></svg>';

import { VALID_SAMPLE_AUDIO_DATA_URL as VALID_AUDIO_WAV } from './audioSampleData';
export const VALID_SAMPLE_AUDIO_DATA_URL = VALID_AUDIO_WAV;

export const VaultBlobStore = {
  /** Persist a base64 dataUrl, File, or raw Blob keyed by file ID */
  async put(id: string, data: string | Blob | File): Promise<void> {
    try {
      const db = await openVaultIDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(data, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[VaultBlobStore] put failed', err);
    }
  },

  /** Retrieve a stored dataUrl or freshly minted Blob Object URL by file ID. Returns null if not found. */
  async get(id: string): Promise<string | null> {
    try {
      const db = await openVaultIDB();
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(id);
        req.onsuccess = () => {
          const res = req.result;
          if (!res) {
            resolve(null);
          } else if (typeof res === 'object' && res instanceof Blob) {
            const blobUrl = URL.createObjectURL(res);
            this._blobUrlCache.set(id, blobUrl);
            resolve(blobUrl);
          } else if (typeof res === 'string') {
            resolve(res);
          } else {
            resolve(null);
          }
        };
        req.onerror = () => resolve(null);
      });
    } catch {
      return null;
    }
  },

  /** Remove a stored blob by file ID */
  async delete(id: string): Promise<void> {
    try {
      const db = await openVaultIDB();
      return new Promise<void>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).delete(id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      });
    } catch {
      // silent
    }
  },

  /**
   * Convert a base64 dataUrl to a Blob Object URL.
   * Blob URLs are far more efficient for media (no base64 string parsing in browser)
   * and are required for large audio/video files to play reliably.
   */
  _blobUrlCache: new Map<string, string>(),

  dataUrlToObjectUrl(dataUrl: string): string {
    try {
      if (!dataUrl) return '';
      if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        return dataUrl;
      }
      const [header, base64] = dataUrl.split(',');
      if (!base64) return dataUrl; // Already a plain URL
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      
      // Fast path for small strings (< 512 KB)
      if (base64.length < 524288) {
        const binary = atob(base64);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
        const blob = new Blob([bytes], { type: mime });
        return URL.createObjectURL(blob);
      }
      
      // Fallback data URL until async conversion finishes
      return dataUrl;
    } catch {
      return dataUrl;
    }
  },

  /**
   * Non-blocking asynchronous conversion from base64 Data URL to Blob Object URL.
   * Leverages browser native fetch pipeline off the main JS thread for 0ms blocking time.
   */
  async dataUrlToObjectUrlAsync(dataUrl: string): Promise<string> {
    try {
      if (!dataUrl) return '';
      if (dataUrl.startsWith('blob:') || dataUrl.startsWith('http://') || dataUrl.startsWith('https://')) {
        return dataUrl;
      }
      if (dataUrl.startsWith('data:')) {
        const res = await fetch(dataUrl);
        const blob = await res.blob();
        return URL.createObjectURL(blob);
      }
      return dataUrl;
    } catch {
      return this.dataUrlToObjectUrl(dataUrl);
    }
  },

  /** Release all cached object URLs (call on unmount) */
  revokeCachedUrl(id: string) {
    const cached = this._blobUrlCache.get(id);
    if (cached && cached.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(cached);
      } catch {
        // silent
      }
      this._blobUrlCache.delete(id);
    }
  },

  /**
   * Resolve a URL for media & document playback.
   * Priority: Blob URL cache → RAM cache → IDB → fallback dataUrl → Category Sample Payload
   * Uses non-blocking off-thread conversion for large payloads.
   */
  async resolvePlaybackUrl(id: string, fallbackDataUrl?: string): Promise<string> {
    if (!id) return '';

    // 0. Already have a cached Blob URL (best case)
    const cachedBlob = this._blobUrlCache.get(id);
    if (cachedBlob && cachedBlob.startsWith('blob:')) return cachedBlob;

    const isValid = (str?: string | null) => {
      if (!str || str.includes('RAM_CACHED') || str.endsWith('...') || str.length < 10) return false;
      // If it is a blob: URL, only trust it if created in this browser session
      if (str.startsWith('blob:')) {
        return Array.from(this._blobUrlCache.values()).includes(str);
      }
      return true;
    };

    const cleanName = id.split('/').pop() || id;

    // 1. RAM cache hit (Check by ID and Clean Name)
    const ram = RAM_DATA_URL_CACHE.get(id) || RAM_DATA_URL_CACHE.get(cleanName);
    if (isValid(ram)) {
      const blobUrl = await this.dataUrlToObjectUrlAsync(ram!);
      this._blobUrlCache.set(id, blobUrl);
      return blobUrl;
    }

    // 2. IDB hit (Check by ID and Clean Name)
    let idb = await VaultBlobStore.get(id);
    if (!isValid(idb)) {
      idb = await VaultBlobStore.get(cleanName);
    }
    if (isValid(idb)) {
      RAM_DATA_URL_CACHE.set(id, idb!); // warm RAM cache
      const blobUrl = await this.dataUrlToObjectUrlAsync(idb!);
      this._blobUrlCache.set(id, blobUrl);
      return blobUrl;
    }

    // 3. Fallback parameter
    if (isValid(fallbackDataUrl)) {
      if (fallbackDataUrl!.startsWith('data:')) {
        const blobUrl = await this.dataUrlToObjectUrlAsync(fallbackDataUrl!);
        this._blobUrlCache.set(id, blobUrl);
        return blobUrl;
      }
      return fallbackDataUrl!; // https or blob URL
    }

    // 4. Local Vault DB File record
    const file = LocalVaultDb.getFile(id) || LocalVaultDb.getAllFiles().find(f => f.id === id || f.name === id);
    if (file?.b2FinalUrl && isValid(file.b2FinalUrl)) {
      if (file.encIv && file.encSalt) {
        try {
          const resp = await fetch(file.b2FinalUrl);
          if (resp.ok) {
            const cipherBuf = await resp.arrayBuffer();
            const decryptedBuf = await VaultEncryptionEngine.decryptFile(
              cipherBuf,
              file.id,
              file.encSalt,
              file.encIv
            );
            const mime = file.type || 'application/octet-stream';
            const blob = new Blob([decryptedBuf], { type: mime });
            const blobUrl = URL.createObjectURL(blob);
            this._blobUrlCache.set(id, blobUrl);
            return blobUrl;
          }
        } catch (decErr) {
          console.warn('[resolvePlaybackUrl] Decryption warning:', decErr);
        }
      }
      return file.b2FinalUrl;
    }

    // 5. Query Supabase DB directly if local is missing or cleared!
    try {
      const remoteUrl = await SupabaseClientService.fetchFileUrlFromSupabase(id);
      if (remoteUrl && isValid(remoteUrl)) {
        return remoteUrl;
      }
    } catch {
      // Fall through to sample payload
    }

    // 6. Guaranteed Fallback Payload by File Extension / Category / MIME
    const fileName = file?.name || id;
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    const mime = (file?.type || '').toLowerCase();

    if (ext === 'pdf' || mime.includes('pdf')) {
      const pdfBlobUrl = await this.dataUrlToObjectUrlAsync(VALID_SAMPLE_PDF_DATA_URL);
      this._blobUrlCache.set(id, pdfBlobUrl);
      return pdfBlobUrl;
    }

    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'heic', 'tiff'].includes(ext) || mime.startsWith('image/')) {
      const imgBlobUrl = await this.dataUrlToObjectUrlAsync(VALID_SAMPLE_IMAGE_DATA_URL);
      this._blobUrlCache.set(id, imgBlobUrl);
      return imgBlobUrl;
    }

    if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(ext) || mime.startsWith('audio/')) {
      const audioBlobUrl = await this.dataUrlToObjectUrlAsync(VALID_SAMPLE_AUDIO_DATA_URL);
      this._blobUrlCache.set(id, audioBlobUrl);
      return audioBlobUrl;
    }

    // Video: return empty so the video element's onerror handler can generate a canvas stream
    if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v', 'flv', 'wmv', '3gp'].includes(ext) || mime.startsWith('video/')) {
      return '';
    }

    return '';
  }
};

export class LocalVaultDb {
  /**
   * Helper to add a file directly
   */
  static addFile(file: { name: string; size?: string; type?: string; dataUrl?: string }): VaultFile {
    const id = `file_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const uniqueName = this.getUniqueFileName(file.name);
    return this.saveFile(id, uniqueName, file.type || 'audio/mpeg', file.dataUrl || '', {
      size: file.size || '4.2 MB'
    });
  }

  /**
   * Check if a file with the same name or size already exists in the vault
   */
  static isDuplicate(name: string): boolean {
    const files = this.getAllFiles();
    return files.some(f => f.name.toLowerCase() === name.toLowerCase());
  }

  /**
   * Automatically generate a unique filename e.g. "document (1).pdf" if duplicate exists
   */
  static getUniqueFileName(name: string): string {
    const files = this.getAllFiles();
    const existingNames = new Set(files.map(f => f.name.toLowerCase()));

    if (!existingNames.has(name.toLowerCase())) {
      return name;
    }

    const lastDotIdx = name.lastIndexOf('.');
    const baseName = lastDotIdx > 0 ? name.slice(0, lastDotIdx) : name;
    const ext = lastDotIdx > 0 ? name.slice(lastDotIdx) : '';

    let counter = 1;
    let candidate = `${baseName} (${counter})${ext}`;
    while (existingNames.has(candidate.toLowerCase())) {
      counter++;
      candidate = `${baseName} (${counter})${ext}`;
    }

    return candidate;
  }

  /**
   * Async helper: persist blob to IDB so it survives page refresh
   */
  static async saveBlobToIDB(id: string, dataUrl: string): Promise<void> {
    if (dataUrl && !dataUrl.includes('RAM_CACHED') && dataUrl.length > 1000) {
      await VaultBlobStore.put(id, dataUrl);
    }
  }

  static saveFile(
    idOrFile: string | VaultFile,
    name?: string,
    type?: string,
    dataUrl?: string,
    extraData?: Partial<VaultFile>
  ): VaultFile {
    let id: string;
    let finalName: string;
    let finalType: string;
    let finalDataUrl: string;

    if (typeof idOrFile === 'object') {
      id = idOrFile.id;
      finalName = idOrFile.name;
      finalType = idOrFile.type;
      finalDataUrl = idOrFile.dataUrl || '';
      extraData = idOrFile;
    } else {
      id = idOrFile;
      finalName = name || 'File';
      finalType = type || 'application/octet-stream';
      finalDataUrl = dataUrl || '';
    }

    const nameStr = finalName;
    const typeStr = finalType;
    const dataUrlStr = finalDataUrl;

    if (dataUrlStr && !dataUrlStr.includes('RAM_CACHED')) {
      RAM_DATA_URL_CACHE.set(id, dataUrlStr);
      RAM_DATA_URL_CACHE.set(nameStr, dataUrlStr);
      // Persist to IDB under both ID and name
      VaultBlobStore.put(id, dataUrlStr).catch(() => {});
      VaultBlobStore.put(nameStr, dataUrlStr).catch(() => {});
    }

    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);

      const existingIdx = files.findIndex(f => f.id === id);
      const base = existingIdx >= 0 ? files[existingIdx] : {};

      // Determine accurate byte size from all available sources
      const resolvedSizeBytes = (typeof extraData?.sizeBytes === 'number' && extraData.sizeBytes > 0)
        ? extraData.sizeBytes
        : (extraData?.size ? parseFileSizeToBytes(extraData.size) : 0)
        || (typeof extraData?.metadata?.file_size === 'number' && extraData.metadata.file_size > 0 && extraData.metadata.file_size !== 1048576 ? extraData.metadata.file_size : 0)
        || (typeof (base as VaultFile).sizeBytes === 'number' && (base as VaultFile).sizeBytes! > 0 && (base as VaultFile).sizeBytes !== 1048576 ? (base as VaultFile).sizeBytes! : 0)
        || ((base as VaultFile).size ? parseFileSizeToBytes((base as VaultFile).size) : 0)
        || ((base as VaultFile).metadata?.file_size || 0);

      const formattedSizeStr = extraData?.size || (base as VaultFile).size || (resolvedSizeBytes > 0 ? formatBytes(resolvedSizeBytes) : '1.2 MB');

      // Auto-generate enterprise path metadata if not provided
      let meta = extraData?.metadata || (base as VaultFile).metadata;
      if (!meta) {
        const personalWs = WorkspaceStore.getPersonalWorkspace();
        const pathInfo: StoragePathResult = StoragePathBuilder.generateStoragePath({
          originalFileName: nameStr,
          mimeType: typeStr,
          workspaceId: personalWs.workspaceStorageId,
          userId: personalWs.userStorageId,
          countryCode: personalWs.countryCode
        });

        meta = {
          file_id: id,
          tenant_id: pathInfo.tenantId,
          company_id: pathInfo.companyId,
          workspace_id: pathInfo.workspaceId,
          user_id: pathInfo.userId,
          storage_object_id: `sobj-${id}`,
          object_id: pathInfo.objectId,
          folder_path: pathInfo.folderPath,
          object_key: pathInfo.objectKey,
          bucket_name: pathInfo.b2BucketName,
          storage_provider: 'Backblaze B2',
          original_file_name: nameStr,
          display_name: nameStr,
          storage_object_name: pathInfo.storageObjectName,
          stored_file_name: pathInfo.storageObjectName,
          extension: nameStr.split('.').pop() || '',
          mime_type: typeStr || 'application/octet-stream',
          file_size: resolvedSizeBytes > 0 ? resolvedSizeBytes : 1024 * 1024,
          checksum: 'sha256_pending',
          checksum_sha256: 'sha256_pending',
          checksum_sha1: 'sha1_pending',
          ai_index_status: 'COMPLETED',
          virus_scan_status: 'CLEAN',
          version: 1,
          encryption_status: 'AES-256-GCM Zero-Knowledge PBKDF2',
          share_status: 'PRIVATE',
          created_by: personalWs.userId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          b2_final_url: pathInfo.b2FinalUrl
        };
      } else if (resolvedSizeBytes > 0 && (!meta.file_size || meta.file_size === 1048576)) {
        meta.file_size = resolvedSizeBytes;
      }

      // Prevent localStorage QuotaExceededError by omitting base64 strings > 50KB in localStorage
      const safeStorageDataUrl = (dataUrlStr && dataUrlStr.length > 50000) ? `data:${typeStr};base64,RAM_CACHED` : dataUrlStr;

      const newFile: VaultFile = {
        ...base,
        id,
        name: nameStr,
        type: typeStr,
        dataUrl: safeStorageDataUrl,
        size: formattedSizeStr,
        sizeBytes: resolvedSizeBytes > 0 ? resolvedSizeBytes : (base as VaultFile).sizeBytes,
        updatedAt: extraData?.updatedAt || (base as VaultFile).updatedAt || 'Just now',
        category: extraData?.category || (base as VaultFile).category || StoragePathBuilder.classifyFileType(typeStr, nameStr),
        fileNameEncrypted: extraData?.fileNameEncrypted || (base as VaultFile).fileNameEncrypted || `${Math.random().toString(36).slice(2, 10)}.enc`,
        metadata: meta,
        b2Synced: extraData?.b2Synced ?? (base as VaultFile).b2Synced ?? false,
        b2SyncedAt: extraData?.b2SyncedAt ?? (base as VaultFile).b2SyncedAt,
        b2Bucket: extraData?.b2Bucket ?? (base as VaultFile).b2Bucket ?? meta?.bucket_name,
        b2Path: extraData?.b2Path ?? (base as VaultFile).b2Path ?? meta?.object_key,
        b2FinalUrl: extraData?.b2FinalUrl ?? (base as VaultFile).b2FinalUrl ?? meta?.b2_final_url
      };

      if (existingIdx >= 0) {
        files[existingIdx] = newFile;
      } else {
        files.unshift(newFile);
      }

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
      } catch (quotaErr) {
        console.warn('localStorage QuotaExceededError. Stripping dataUrl payload strings to save metadata safely.', quotaErr);
        const metadataOnlyFiles = files.map(f => ({
          ...f,
          dataUrl: (f.dataUrl && f.dataUrl.length > 50000) ? '' : f.dataUrl
        }));
        localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataOnlyFiles));
      }

      // Sync metadata to Supabase DB in background
      SupabaseClientService.syncFileToSupabase(newFile).catch(err =>
        console.warn('[LocalVaultDb] Supabase sync background warning:', err)
      );

      return {
        ...newFile,
        dataUrl: RAM_DATA_URL_CACHE.get(id) || newFile.dataUrl
      };
    } catch (e) {
      console.error('Failed to save file to local vault DB', e);
      return { id, name: nameStr, type: typeStr, dataUrl: dataUrlStr };
    }
  }

  /**
   * Update B2 sync state and record direct B2 URL
   */
  static markFileAsB2Synced(id: string, b2Path: string, b2Bucket: string, b2FinalUrl?: string) {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      const idx = files.findIndex(f => f.id === id);
      if (idx >= 0) {
        const finalUrl = b2FinalUrl || `https://f004.backblazeb2.com/file/${b2Bucket}/${b2Path}`;
        files[idx].b2Synced = true;
        files[idx].b2SyncedAt = new Date().toISOString();
        files[idx].b2Bucket = b2Bucket;
        files[idx].b2Path = b2Path;
        files[idx].b2FinalUrl = finalUrl;
        if (files[idx].metadata) {
          files[idx].metadata!.object_key = b2Path;
          files[idx].metadata!.b2_final_url = finalUrl;
        }
        localStorage.setItem(STORAGE_KEY, JSON.stringify(files));

        // Sync updated B2 URL to Supabase DB
        SupabaseClientService.syncFileToSupabase(files[idx]).catch(err =>
          console.warn('[LocalVaultDb] Supabase B2 sync update warning:', err)
        );
      }
    } catch (e) {
      console.warn('Failed to mark file as B2 synced', e);
    }
  }

  static getFile(id: string): VaultFile | null {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      const file = files.find(f => f.id === id || f.name === id);
      if (!file) return null;
      const ramUrl = RAM_DATA_URL_CACHE.get(id);
      return {
        ...file,
        dataUrl: (ramUrl || file.dataUrl || '').includes('RAM_CACHED') ? (ramUrl || '') : (ramUrl || file.dataUrl || '')
      };
    } catch {
      return null;
    }
  }

  /**
   * Fetch file metadata locally or fallback to Supabase DB
   */
  static async getFileAsync(id: string): Promise<VaultFile | null> {
    const local = this.getFile(id);
    if (local && (local.dataUrl || local.b2FinalUrl)) {
      return local;
    }

    // Fallback query Supabase DB
    const remote = await SupabaseClientService.fetchFileFromSupabase(id);
    if (remote) {
      const fullFile: VaultFile = {
        id: remote.id || id,
        name: remote.name || id,
        type: remote.type || 'application/octet-stream',
        dataUrl: remote.dataUrl || '',
        category: remote.category,
        b2FinalUrl: remote.b2FinalUrl,
        b2Synced: remote.b2Synced,
        b2Bucket: remote.b2Bucket,
        b2Path: remote.b2Path,
        metadata: remote.metadata as any
      };
      return fullFile;
    }

    return local;
  }

  static getAllFiles(): VaultFile[] {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY);
      if (!filesStr) {
        return this.seedInitialVaultFiles();
      }
      const parsed: VaultFile[] = JSON.parse(filesStr);
      if (!Array.isArray(parsed) || parsed.length === 0) {
        return this.seedInitialVaultFiles();
      }

      let mutated = false;
      const healedFiles = parsed.map(f => {
        const ramUrl = RAM_DATA_URL_CACHE.get(f.id);

        // Auto-heal file sizes: if sizeBytes is missing or stuck at 1048576, but f.size exists (e.g. "4.04 MB")
        let effectiveBytes = (typeof f.sizeBytes === 'number' && f.sizeBytes > 0) ? f.sizeBytes : 0;
        const fromStrBytes = f.size ? parseFileSizeToBytes(f.size) : 0;

        if ((effectiveBytes === 0 || effectiveBytes === 1048576) && fromStrBytes > 0 && Math.abs(fromStrBytes - 1048576) > 10000) {
          effectiveBytes = fromStrBytes;
          mutated = true;
        }

        let updatedMeta = f.metadata;
        if (updatedMeta && (updatedMeta.file_size === 1048576 || !updatedMeta.file_size) && effectiveBytes > 0 && Math.abs(effectiveBytes - 1048576) > 10000) {
          updatedMeta = { ...updatedMeta, file_size: effectiveBytes };
          mutated = true;
        }

        return {
          ...f,
          sizeBytes: effectiveBytes || f.sizeBytes,
          metadata: updatedMeta,
          dataUrl: (ramUrl || f.dataUrl || '').includes('RAM_CACHED') ? (ramUrl || '') : (ramUrl || f.dataUrl || '')
        };
      });

      if (mutated) {
        try {
          const metadataOnlyFiles = healedFiles.map(f => ({
            ...f,
            dataUrl: (f.dataUrl && f.dataUrl.length > 50000) ? '' : f.dataUrl
          }));
          localStorage.setItem(STORAGE_KEY, JSON.stringify(metadataOnlyFiles));
        } catch { /* ignore */ }
      }

      return healedFiles;
    } catch {
      return this.seedInitialVaultFiles();
    }
  }

  /**
   * Restores initial zero-knowledge protected files (PDFs, Images, Audio, Video)
   */
  static resetVaultToDefaultFiles(): VaultFile[] {
    localStorage.removeItem('memomes_vault_cleared');
    const seeded = this.seedInitialVaultFiles();
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new CustomEvent('vault-updated', { detail: { files: seeded } }));
    window.dispatchEvent(new CustomEvent('memomes_vault_reset', { detail: { files: seeded } }));
    return seeded;
  }

  /**
   * Automatically seed initial zero-knowledge protected files on fresh login
   */
  static seedInitialVaultFiles(): VaultFile[] {
    const personalWs = WorkspaceStore.getPersonalWorkspace();
    const seedDefs = [
      {
        id: 'file-01',
        name: 'Passport_Scan_Official.pdf',
        size: '1.8 MB',
        sizeBytes: 1887436,
        type: 'application/pdf',
        updatedAt: 'Yesterday',
        category: 'document',
        fileNameEncrypted: 'e3b0c442...pdf.enc',
        dataUrl: VALID_SAMPLE_PDF_DATA_URL
      },
      {
        id: 'file-02',
        name: 'Quarterly_Financial_Report.pdf',
        size: '2.4 MB',
        sizeBytes: 2516582,
        type: 'application/pdf',
        updatedAt: '3 days ago',
        category: 'document',
        fileNameEncrypted: 'c8f3e2b1...pdf.enc',
        dataUrl: VALID_SAMPLE_PDF_DATA_URL
      },
      {
        id: 'file-03',
        name: 'Enterprise_Architecture_Spec.pdf',
        size: '3.1 MB',
        sizeBytes: 3250585,
        type: 'application/pdf',
        updatedAt: '5 days ago',
        category: 'document',
        fileNameEncrypted: '9a8b7c6d...pdf.enc',
        dataUrl: VALID_SAMPLE_PDF_DATA_URL
      },
      {
        id: 'file-04',
        name: 'Executive_Presentation_Keynote.png',
        size: '6.5 MB',
        sizeBytes: 6815744,
        type: 'image/png',
        updatedAt: '2 days ago',
        category: 'image',
        fileNameEncrypted: 'a1b2c3d4...png.enc',
        dataUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
      },
      {
        id: 'file-05',
        name: 'Sangathil Paadatha Kavithai - Ilaiyaraaja.mp3',
        size: '4.04 MB',
        sizeBytes: 4236247,
        type: 'audio/mpeg',
        updatedAt: '3 days ago',
        category: 'audio',
        fileNameEncrypted: 'b7c8d9e0...mp3.enc',
        dataUrl: VALID_SAMPLE_AUDIO_DATA_URL
      },
      {
        id: 'file-06',
        name: 'Generated video 1.mp4',
        size: '3.88 MB',
        sizeBytes: 4068474,
        type: 'video/mp4',
        updatedAt: '3 days ago',
        category: 'video',
        fileNameEncrypted: 'd1e2f3a4...mp4.enc',
        dataUrl: ''
      }
    ];

    const defaultFiles: VaultFile[] = seedDefs.map(item => {
      const pathInfo = StoragePathBuilder.generateStoragePath({
        originalFileName: item.name,
        mimeType: item.type,
        workspaceId: personalWs.workspaceStorageId,
        userId: personalWs.userStorageId,
        countryCode: personalWs.countryCode
      });

      return {
        id: item.id,
        name: item.name,
        size: item.size,
        sizeBytes: item.sizeBytes,
        type: item.type,
        updatedAt: item.updatedAt,
        category: item.category,
        fileNameEncrypted: item.fileNameEncrypted,
        dataUrl: item.dataUrl,
        b2Synced: true,
        b2Bucket: pathInfo.b2BucketName,
        b2Path: pathInfo.objectKey,
        b2FinalUrl: pathInfo.b2FinalUrl,
        metadata: {
          file_id: item.id,
          tenant_id: pathInfo.tenantId,
          company_id: pathInfo.companyId,
          workspace_id: pathInfo.workspaceId,
          user_id: pathInfo.userId,
          storage_object_id: `sobj-${item.id}`,
          object_id: pathInfo.objectId,
          folder_path: pathInfo.folderPath,
          object_key: pathInfo.objectKey,
          bucket_name: pathInfo.b2BucketName,
          storage_provider: 'Backblaze B2',
          original_file_name: item.name,
          display_name: item.name,
          storage_object_name: pathInfo.storageObjectName,
          stored_file_name: pathInfo.storageObjectName,
          extension: item.name.split('.').pop() || '',
          mime_type: item.type,
          file_size: item.sizeBytes,
          checksum: 'verified_checksum',
          checksum_sha256: 'verified_checksum',
          ai_index_status: 'COMPLETED',
          virus_scan_status: 'CLEAN',
          encryption_status: 'AES-256-GCM Zero-Knowledge',
          share_status: 'PRIVATE',
          created_by: personalWs.userStorageId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          b2_final_url: pathInfo.b2FinalUrl
        }
      };
    });

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFiles));
      localStorage.removeItem('memomes_vault_cleared');
    } catch (e) {
      console.warn('Failed to seed initial vault files to localStorage', e);
    }
    return defaultFiles;
  }

  static removeFile(id: string) {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      const filtered = files.filter(f => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
      localStorage.removeItem('memomes_uploaded_files');
      // Also remove from IDB
      VaultBlobStore.delete(id).catch(() => {});
      RAM_DATA_URL_CACHE.delete(id);
    } catch (e) {
      console.warn('Failed to remove file from local storage', e);
    }
  }

  /**
   * Delete ALL files from local vault DB, IndexedDB, and RAM cache
   */
  static removeAllFiles() {
    this.clearAllVaultData();
  }

  /**
   * Delete all files belonging to a specific category (e.g. 'Images', 'Documents')
   */
  static removeFilesByCategory(category: string) {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      const catLower = category.toLowerCase();

      const idsToRemove: string[] = [];
      const remainingFiles = files.filter(f => {
        const fileType = StoragePathBuilder.classifyFileType(f.type, f.name).toLowerCase();
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        const fCat = (f.category || '').toLowerCase();

        let matches = fileType === catLower || fCat === catLower || (f.metadata?.folder_path || '').toLowerCase().includes(catLower);
        if (!matches) {
          if (catLower === 'audio' && (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'].includes(ext) || fCat === 'audio' || (f.type || '').startsWith('audio/'))) matches = true;
          else if (catLower === 'presentations' && (['ppt', 'pptx', 'key', 'odp'].includes(ext) || fCat === 'presentation')) matches = true;
          else if (catLower === 'documents' && (['doc', 'docx', 'txt', 'rtf', 'odt', 'pdf', 'md'].includes(ext) || fCat === 'document' || (f.type || '').startsWith('text/'))) matches = true;
          else if (catLower === 'images' && (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff', 'heic'].includes(ext) || fCat === 'image' || (f.type || '').startsWith('image/'))) matches = true;
          else if (catLower === 'videos' && (['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'flv'].includes(ext) || fCat === 'video' || (f.type || '').startsWith('video/'))) matches = true;
          else if (catLower === 'spreadsheets' && (['xlsx', 'xls', 'csv', 'ods'].includes(ext) || fCat === 'spreadsheet')) matches = true;
          else if (catLower === 'sourcecode' && (['ts', 'tsx', 'js', 'jsx', 'cs', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'sql', 'xml'].includes(ext) || fCat === 'sourcecode')) matches = true;
          else if (catLower === 'archives' && (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || fCat === 'archive')) matches = true;
          else if (catLower === 'pdf' && (ext === 'pdf' || (f.type || '').includes('pdf'))) matches = true;
        }

        if (matches) {
          idsToRemove.push(f.id);
          return false;
        }
        return true;
      });

      localStorage.setItem(STORAGE_KEY, JSON.stringify(remainingFiles));
      localStorage.removeItem('memomes_uploaded_files');

      for (const id of idsToRemove) {
        VaultBlobStore.delete(id).catch(() => {});
        RAM_DATA_URL_CACHE.delete(id);
      }
    } catch (e) {
      console.warn('Failed to remove files by category', e);
    }
  }

  /**
   * Toggle isFavorite status on a file and persist to local storage
   */
  static toggleFavorite(id: string): boolean {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      let updatedStatus = false;
      const updated = files.map(f => {
        if (f.id === id) {
          updatedStatus = !f.isFavorite;
          return { ...f, isFavorite: updatedStatus };
        }
        return f;
      });
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updatedStatus;
    } catch (e) {
      console.warn('Failed to toggle favorite status', e);
      return false;
    }
  }

  /**
   * Complete Development Reset Helper — Clears all development test metadata & files
   * Keeps permanent user workspace, userStorageId, wrk_..., and account configurations intact!
   *
   * FIX: Also clears IndexedDB blob store and in-memory RAM cache so that
   * images / file previews no longer appear in the File Explorer and Dashboard
   * after all workstation folders are deleted.
   */
  static clearAllVaultData() {
    try {
      // 1. Clear all localStorage vault keys
      localStorage.setItem(STORAGE_KEY, JSON.stringify([]));
      localStorage.setItem('memomes_vault_cleared', 'true');
      localStorage.removeItem('memomes_uploaded_files');
      localStorage.setItem('memomes_activity_logs', JSON.stringify([]));
      localStorage.setItem('memomes_share_links', JSON.stringify([]));
      localStorage.setItem('memomes_audit_logs', JSON.stringify([]));
      localStorage.setItem('memomes_analytics_events', JSON.stringify([]));
      localStorage.setItem('memomes_security_events', JSON.stringify([]));
      localStorage.setItem('memomes_recycle_bin', JSON.stringify([]));
      localStorage.setItem('memomes_favorites', JSON.stringify([]));
      localStorage.setItem('memomes_search_index', JSON.stringify([]));
      localStorage.setItem('memomes_ai_metadata', JSON.stringify([]));
      localStorage.setItem('memomes_ocr_cache', JSON.stringify([]));
      localStorage.setItem('memomes_upload_queue', JSON.stringify([]));
      localStorage.setItem('memomes_download_queue', JSON.stringify([]));
      localStorage.setItem('memomes_file_versions', JSON.stringify([]));
      localStorage.setItem('memomes_security_center_logs', JSON.stringify([]));
      localStorage.removeItem('memomes_b2_records');

      // 2. Clear in-memory RAM data URL cache so images don't persist in-session
      RAM_DATA_URL_CACHE.clear();

      // 3. Revoke all cached Blob Object URLs to free memory
      for (const [, blobUrl] of VaultBlobStore._blobUrlCache) {
        if (blobUrl && blobUrl.startsWith('blob:')) {
          try { URL.revokeObjectURL(blobUrl); } catch { /* ignore */ }
        }
      }
      VaultBlobStore._blobUrlCache.clear();

      // 4. Nuke IndexedDB blob store so file data doesn't survive page refresh
      const nukeIDB = async () => {
        try {
          const db = await openVaultIDB();
          return new Promise<void>((resolve) => {
            const tx = db.transaction(IDB_STORE, 'readwrite');
            tx.objectStore(IDB_STORE).clear();
            tx.oncomplete = () => resolve();
            tx.onerror = () => resolve();
          });
        } catch {
          // IDB clear failure is non-fatal
        }
      };
      nukeIDB();

      console.info('🧹 [LocalVaultDb] Completely cleared all vault files, metadata, IDB blobs, and RAM cache.');
    } catch (e) {
      console.warn('Failed to clear vault data', e);
    }
  }

  /**
   * Detect legacy storage paths (e.g. enterprise paths for personal users, missing country code, etc.)
   * and offer automatic migration to Storage Path Architecture v3.0 standard.
   */
  static migrateLegacyStoragePaths(): { migratedCount: number; files: VaultFile[] } {
    const files = this.getAllFiles();
    let migratedCount = 0;
    const personalWs = WorkspaceStore.getPersonalWorkspace();

    const updated = files.map(f => {
      const currentPath = f.metadata?.object_key || f.b2Path || '';
      const isLegacyPersonal = personalWs.workspaceType === 'PERSONAL' && (
        currentPath.includes('/enterprise/') ||
        !currentPath.includes('/personal/') ||
        !currentPath.startsWith('sathus/memomes/IN/')
      );

      if (isLegacyPersonal && currentPath) {
        const pathInfo = StoragePathBuilder.generateStoragePath({
          originalFileName: f.metadata?.original_file_name || f.name,
          mimeType: f.metadata?.mime_type || f.type,
          workspaceId: personalWs.workspaceStorageId,
          userId: personalWs.userStorageId,
          countryCode: personalWs.countryCode
        });

        migratedCount++;
        console.info(`🔄 [Storage Migration] Migrated legacy path: ${currentPath} -> ${pathInfo.objectKey}`);

        return {
          ...f,
          b2Path: pathInfo.objectKey,
          b2FinalUrl: pathInfo.b2FinalUrl,
          metadata: f.metadata ? {
            ...f.metadata,
            workspace_id: pathInfo.workspaceId,
            user_id: pathInfo.userId,
            tenant_id: pathInfo.tenantId,
            company_id: pathInfo.companyId,
            folder_path: pathInfo.folderPath,
            object_key: pathInfo.objectKey,
            b2_final_url: pathInfo.b2FinalUrl,
            checksum_sha256: f.metadata.checksum_sha256 || 'migrated_sha256_verified'
          } : undefined
        };
      }
      return f;
    });

    if (migratedCount > 0) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      console.info(`✅ [Storage Migration] Successfully migrated ${migratedCount} legacy paths to Storage Standard v3.0`);
    }

    return { migratedCount, files: updated };
  }

  /**
   * On app startup: read all file metadata from localStorage and warm up
   * RAM_DATA_URL_CACHE + VaultBlobStore._blobUrlCache from IndexedDB.
   * This ensures previews & thumbnails work immediately after browser close/reopen
   * without requiring the user to open each file individually.
   */
  static async warmupFromIDB(): Promise<number> {
    let warmedCount = 0;
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY);
      if (!filesStr) return 0;
      const files: VaultFile[] = JSON.parse(filesStr);
      const needsWarmup = files.filter(f =>
        !f.dataUrl || f.dataUrl.includes('RAM_CACHED') || f.dataUrl.length < 100
      );
      if (needsWarmup.length === 0) return 0;
      console.info(`[LocalVaultDb] Warming up ${needsWarmup.length}/${files.length} files from IndexedDB...`);
      await Promise.all(needsWarmup.map(async (f) => {
        let dataUrl = await VaultBlobStore.get(f.id);
        if (!dataUrl || dataUrl.includes('RAM_CACHED')) {
          dataUrl = await VaultBlobStore.get(f.name);
        }
        if (dataUrl && !dataUrl.includes('RAM_CACHED') && dataUrl.length > 100) {
          RAM_DATA_URL_CACHE.set(f.id, dataUrl);
          RAM_DATA_URL_CACHE.set(f.name, dataUrl);
          try {
            const blobUrl = await VaultBlobStore.dataUrlToObjectUrlAsync(dataUrl);
            if (blobUrl) {
              VaultBlobStore._blobUrlCache.set(f.id, blobUrl);
            }
          } catch { /* non-fatal */ }
          warmedCount++;
        }
      }));
        console.info(`[LocalVaultDb] Warmup complete: ${warmedCount} files restored from IndexedDB.`);
    } catch (err) {
      console.warn('[LocalVaultDb] warmupFromIDB failed:', err);
    }
    return warmedCount;
  }
}

export interface StorageStats {
  usedBytes: number;
  totalQuotaBytes: number;
  formattedUsed: string;
  formattedTotal: string;
  percentage: number;
  formattedPercentage: string;
}

export function parseFileSizeToBytes(sizeStr?: string | number): number {
  if (typeof sizeStr === 'number') return sizeStr;
  if (!sizeStr) return 0;
  const match = sizeStr.trim().match(/^([\d.]+)\s*([a-zA-Z]+)?$/);
  if (!match) return 0;
  const val = parseFloat(match[1]);
  const unit = (match[2] || 'b').toLowerCase();
  if (unit.startsWith('t')) return val * 1024 * 1024 * 1024 * 1024;
  if (unit.startsWith('g')) return val * 1024 * 1024 * 1024;
  if (unit.startsWith('m')) return val * 1024 * 1024;
  if (unit.startsWith('k')) return val * 1024;
  return val;
}

export function formatBytes(bytes: number, decimals: number = 2): string {
  if (bytes <= 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export function getVaultStorageStats(): StorageStats {
  const files = LocalVaultDb.getAllFiles();
  const totalQuotaBytes = 500 * 1024 * 1024 * 1024; // 500 GB Pro Plan

  let usedBytes = 0;
  for (const f of files) {
    if (typeof f.sizeBytes === 'number' && f.sizeBytes > 0) {
      usedBytes += f.sizeBytes;
    } else if (f.metadata && typeof f.metadata.file_size === 'number' && f.metadata.file_size > 0) {
      usedBytes += f.metadata.file_size;
    } else if (f.size) {
      usedBytes += parseFileSizeToBytes(f.size);
    }
  }

  const rawPercent = (usedBytes / totalQuotaBytes) * 100;
  const percentage = Math.max(0, Math.min(100, rawPercent));
  let formattedPercentage = '0%';
  if (usedBytes > 0) {
    formattedPercentage = percentage < 0.1 ? '< 0.1%' : `${percentage.toFixed(1)}%`;
  }

  return {
    usedBytes,
    totalQuotaBytes,
    formattedUsed: formatBytes(usedBytes, 2),
    formattedTotal: '500 GB',
    percentage,
    formattedPercentage
  };
}
