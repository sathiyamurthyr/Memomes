/**
 * Local Vault Database Simulator & Enterprise Metadata Storage Engine
 * Persists uploaded file payloads, hierarchical object keys, and complete
 * enterprise database metadata in browser storage.
 */

import { StoragePathBuilder, type StoragePathResult } from './storagePathBuilder';
import { WorkspaceStore } from './workspaceStore';

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

export const VaultBlobStore = {
  /** Persist a base64 dataUrl (or raw Blob) keyed by file ID */
  async put(id: string, dataUrl: string): Promise<void> {
    try {
      const db = await openVaultIDB();
      return new Promise<void>((resolve, reject) => {
        const tx = db.transaction(IDB_STORE, 'readwrite');
        tx.objectStore(IDB_STORE).put(dataUrl, id);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      console.warn('[VaultBlobStore] put failed', err);
    }
  },

  /** Retrieve a stored dataUrl by file ID. Returns null if not found. */
  async get(id: string): Promise<string | null> {
    try {
      const db = await openVaultIDB();
      return new Promise<string | null>((resolve) => {
        const tx = db.transaction(IDB_STORE, 'readonly');
        const req = tx.objectStore(IDB_STORE).get(id);
        req.onsuccess = () => resolve((req.result as string | undefined) ?? null);
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
      const [header, base64] = dataUrl.split(',');
      if (!base64) return dataUrl; // Already a plain URL
      const mimeMatch = header.match(/:(.*?);/);
      const mime = mimeMatch ? mimeMatch[1] : 'application/octet-stream';
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: mime });
      return URL.createObjectURL(blob);
    } catch {
      return dataUrl; // fallback
    }
  },

  /** Release all cached object URLs (call on unmount) */
  revokeCachedUrl(id: string) {
    const cached = this._blobUrlCache.get(id);
    if (cached && cached.startsWith('blob:')) {
      URL.revokeObjectURL(cached);
      this._blobUrlCache.delete(id);
    }
  },

  /**
   * Resolve a URL for media playback.
   * Priority: Blob URL cache → RAM cache → IDB → fallback dataUrl
   * For audio/video, converts base64 dataUrl to Blob Object URL for browser compatibility.
   * Returns empty string if nothing found.
   */
  async resolvePlaybackUrl(id: string, fallbackDataUrl?: string): Promise<string> {
    // 0. Already have a cached Blob URL (best case)
    const cachedBlob = this._blobUrlCache.get(id);
    if (cachedBlob) return cachedBlob;

    // 1. RAM cache hit (same session after upload)
    const ram = RAM_DATA_URL_CACHE.get(id);
    if (ram && !ram.includes('RAM_CACHED')) {
      const blobUrl = this.dataUrlToObjectUrl(ram);
      this._blobUrlCache.set(id, blobUrl);
      return blobUrl;
    }

    // 2. IDB hit (survives page refresh)
    const idb = await VaultBlobStore.get(id);
    if (idb && !idb.includes('RAM_CACHED')) {
      RAM_DATA_URL_CACHE.set(id, idb); // warm RAM cache
      const blobUrl = this.dataUrlToObjectUrl(idb);
      this._blobUrlCache.set(id, blobUrl);
      return blobUrl;
    }

    // 3. Fallback to whatever was passed (e.g. small file that fit in localStorage, or an https URL)
    if (fallbackDataUrl && !fallbackDataUrl.includes('RAM_CACHED')) {
      if (fallbackDataUrl.startsWith('data:')) {
        const blobUrl = this.dataUrlToObjectUrl(fallbackDataUrl);
        this._blobUrlCache.set(id, blobUrl);
        return blobUrl;
      }
      return fallbackDataUrl; // https URL — return as-is
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

  static saveFile(id: string, name: string, type: string, dataUrl: string, extraData?: Partial<VaultFile>): VaultFile {
    if (dataUrl && !dataUrl.includes('RAM_CACHED')) {
      RAM_DATA_URL_CACHE.set(id, dataUrl);
      // Persist to IDB in background (fire and forget)
      VaultBlobStore.put(id, dataUrl).catch(err => console.warn('[LocalVaultDb] IDB write failed', err));
    }

    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);

      const existingIdx = files.findIndex(f => f.id === id);
      const base = existingIdx >= 0 ? files[existingIdx] : {};

      // Auto-generate enterprise path metadata if not provided
      let meta = extraData?.metadata || (base as VaultFile).metadata;
      if (!meta) {
        const personalWs = WorkspaceStore.getPersonalWorkspace();
        const pathInfo: StoragePathResult = StoragePathBuilder.generateStoragePath({
          originalFileName: name,
          mimeType: type,
          tenantId: personalWs.tenantId,
          companyId: personalWs.companyId,
          workspaceId: personalWs.workspaceStorageId,
          userId: personalWs.userStorageId
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
          original_file_name: name,
          display_name: name,
          storage_object_name: pathInfo.storageObjectName,
          stored_file_name: pathInfo.storageObjectName,
          extension: name.split('.').pop() || '',
          mime_type: type || 'application/octet-stream',
          file_size: 1024 * 1024,
          checksum: 'sha256_pending',
          checksum_sha256: 'sha256_pending',
          checksum_sha1: 'sha1_pending',
          ai_index_status: 'COMPLETED',
          virus_scan_status: 'CLEAN',
          version: 1,
          encryption_status: 'AES-256-GCM Zero-Knowledge',
          share_status: 'PRIVATE',
          created_by: 'user001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          b2_final_url: pathInfo.b2FinalUrl
        };
      }

      // Prevent localStorage QuotaExceededError by omitting base64 strings > 50KB in localStorage
      const safeStorageDataUrl = (dataUrl && dataUrl.length > 50000) ? `data:${type};base64,RAM_CACHED` : dataUrl;

      const newFile: VaultFile = {
        ...base,
        id,
        name,
        type,
        dataUrl: safeStorageDataUrl,
        size: extraData?.size || (base as VaultFile).size || '1.2 MB',
        updatedAt: extraData?.updatedAt || (base as VaultFile).updatedAt || 'Just now',
        category: extraData?.category || (base as VaultFile).category || StoragePathBuilder.classifyFileType(type, name),
        fileNameEncrypted: extraData?.fileNameEncrypted || (base as VaultFile).fileNameEncrypted || `${Math.random().toString(36).slice(2, 10)}.enc`,
        metadata: meta,
        b2Synced: extraData?.b2Synced ?? (base as VaultFile).b2Synced ?? false,
        b2SyncedAt: extraData?.b2SyncedAt ?? (base as VaultFile).b2SyncedAt,
        b2Bucket: extraData?.b2Bucket ?? (base as VaultFile).b2Bucket ?? meta.bucket_name,
        b2Path: extraData?.b2Path ?? (base as VaultFile).b2Path ?? meta.object_key,
        b2FinalUrl: extraData?.b2FinalUrl ?? (base as VaultFile).b2FinalUrl ?? meta.b2_final_url
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

      return {
        ...newFile,
        dataUrl: RAM_DATA_URL_CACHE.get(id) || newFile.dataUrl
      };
    } catch (e) {
      console.error('Failed to save file to local vault DB', e);
      return { id, name, type, dataUrl };
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
      }
    } catch (e) {
      console.warn('Failed to mark file as B2 synced', e);
    }
  }

  static getFile(id: string): VaultFile | null {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      const file = files.find(f => f.id === id);
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

  static getAllFiles(): VaultFile[] {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const parsed: VaultFile[] = JSON.parse(filesStr);
      if (!Array.isArray(parsed)) return [];
      return parsed.map(f => {
        const ramUrl = RAM_DATA_URL_CACHE.get(f.id);
        return {
          ...f,
          dataUrl: (ramUrl || f.dataUrl || '').includes('RAM_CACHED') ? (ramUrl || '') : (ramUrl || f.dataUrl || '')
        };
      });
    } catch {
      return [];
    }
  }

  /**
   * Automatically seed initial zero-knowledge protected files on fresh login
   */
  static seedInitialVaultFiles(): VaultFile[] {
    const personalWs = WorkspaceStore.getPersonalWorkspace();
    const defaultFiles: VaultFile[] = [
      {
        id: 'file-01',
        name: 'Passport_Scan_Official.pdf',
        size: '1.8 MB',
        type: 'application/pdf',
        updatedAt: 'Just now',
        category: 'document',
        fileNameEncrypted: 'e3b0c442...pdf.enc',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
        b2Synced: true,
        b2Bucket: 'sathus-memomes-vault',
        b2Path: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8PASSPORT.enc`,
        b2FinalUrl: `https://f004.backblazeb2.com/file/sathus-memomes-vault/sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8PASSPORT.enc`,
        metadata: {
          file_id: 'file-01',
          tenant_id: personalWs.tenantId,
          company_id: personalWs.companyId,
          workspace_id: personalWs.workspaceStorageId,
          user_id: personalWs.userStorageId,
          storage_object_id: 'sobj-file-01',
          object_id: 'obj_01H8PASSPORT',
          folder_path: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/`,
          object_key: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8PASSPORT.enc`,
          bucket_name: 'sathus-memomes-vault',
          storage_provider: 'Backblaze B2',
          original_file_name: 'Passport_Scan_Official.pdf',
          display_name: 'Passport_Scan_Official.pdf',
          storage_object_name: 'obj_01H8PASSPORT.enc',
          stored_file_name: 'obj_01H8PASSPORT.enc',
          extension: 'pdf',
          mime_type: 'application/pdf',
          file_size: 1887436,
          checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          checksum_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          ai_index_status: 'COMPLETED',
          virus_scan_status: 'CLEAN',
          encryption_status: 'AES-256-GCM Zero-Knowledge',
          share_status: 'PRIVATE',
          created_by: personalWs.userStorageId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          b2_final_url: `https://f004.backblazeb2.com/file/sathus-memomes-vault/sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8PASSPORT.enc`
        }
      },
      {
        id: 'file-02',
        name: 'Tax_Return_Form_1040_2025.pdf',
        size: '2.4 MB',
        type: 'application/pdf',
        updatedAt: '1 hour ago',
        category: 'document',
        fileNameEncrypted: 'f8a1d990...pdf.enc',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
        b2Synced: true,
        b2Bucket: 'sathus-memomes-vault',
        b2Path: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8TAXRETURN.enc`,
        b2FinalUrl: `https://f004.backblazeb2.com/file/sathus-memomes-vault/sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8TAXRETURN.enc`,
        metadata: {
          file_id: 'file-02',
          tenant_id: personalWs.tenantId,
          company_id: personalWs.companyId,
          workspace_id: personalWs.workspaceStorageId,
          user_id: personalWs.userStorageId,
          storage_object_id: 'sobj-file-02',
          object_id: 'obj_01H8TAXRETURN',
          folder_path: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/`,
          object_key: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8TAXRETURN.enc`,
          bucket_name: 'sathus-memomes-vault',
          storage_provider: 'Backblaze B2',
          original_file_name: 'Tax_Return_Form_1040_2025.pdf',
          display_name: 'Tax_Return_Form_1040_2025.pdf',
          storage_object_name: 'obj_01H8TAXRETURN.enc',
          stored_file_name: 'obj_01H8TAXRETURN.enc',
          extension: 'pdf',
          mime_type: 'application/pdf',
          file_size: 2516582,
          checksum: 'f8a1d990e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b',
          checksum_sha256: 'f8a1d990e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b',
          ai_index_status: 'COMPLETED',
          virus_scan_status: 'CLEAN',
          encryption_status: 'AES-256-GCM Zero-Knowledge',
          share_status: 'PRIVATE',
          created_by: personalWs.userStorageId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          b2_final_url: `https://f004.backblazeb2.com/file/sathus-memomes-vault/sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8TAXRETURN.enc`
        }
      },
      {
        id: 'file-03',
        name: 'Q3_Financial_Audit_2025.pdf',
        size: '4.2 MB',
        type: 'application/pdf',
        updatedAt: 'Yesterday',
        category: 'document',
        fileNameEncrypted: 'c90a1b22...pdf.enc',
        dataUrl: 'data:application/pdf;base64,JVBERi0xLjQK...',
        b2Synced: true,
        b2Bucket: 'sathus-memomes-vault',
        b2Path: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8FINAUDIT.enc`,
        b2FinalUrl: `https://f004.backblazeb2.com/file/sathus-memomes-vault/sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8FINAUDIT.enc`,
        metadata: {
          file_id: 'file-03',
          tenant_id: personalWs.tenantId,
          company_id: personalWs.companyId,
          workspace_id: personalWs.workspaceStorageId,
          user_id: personalWs.userStorageId,
          storage_object_id: 'sobj-file-03',
          object_id: 'obj_01H8FINAUDIT',
          folder_path: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/`,
          object_key: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8FINAUDIT.enc`,
          bucket_name: 'sathus-memomes-vault',
          storage_provider: 'Backblaze B2',
          original_file_name: 'Q3_Financial_Audit_2025.pdf',
          display_name: 'Q3_Financial_Audit_2025.pdf',
          storage_object_name: 'obj_01H8FINAUDIT.enc',
          stored_file_name: 'obj_01H8FINAUDIT.enc',
          extension: 'pdf',
          mime_type: 'application/pdf',
          file_size: 4404019,
          checksum: 'c90a1b2298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          checksum_sha256: 'c90a1b2298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          ai_index_status: 'COMPLETED',
          virus_scan_status: 'CLEAN',
          encryption_status: 'AES-256-GCM Zero-Knowledge',
          share_status: 'PRIVATE',
          created_by: personalWs.userStorageId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          b2_final_url: `https://f004.backblazeb2.com/file/sathus-memomes-vault/sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/PDF/2026/08/04/obj_01H8FINAUDIT.enc`
        }
      },
      {
        id: 'file-04',
        name: 'Executive_Presentation_Keynote.png',
        size: '6.5 MB',
        type: 'image/png',
        updatedAt: '2 days ago',
        category: 'image',
        fileNameEncrypted: 'a1b2c3d4...png.enc',
        dataUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
        b2Synced: true,
        b2Bucket: 'sathus-memomes-vault',
        b2Path: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/Images/2026/08/04/obj_01H8KEYNOTE.enc`,
        b2FinalUrl: `https://f004.backblazeb2.com/file/sathus-memomes-vault/sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/Images/2026/08/04/obj_01H8KEYNOTE.enc`,
        metadata: {
          file_id: 'file-04',
          tenant_id: personalWs.tenantId,
          company_id: personalWs.companyId,
          workspace_id: personalWs.workspaceStorageId,
          user_id: personalWs.userStorageId,
          storage_object_id: 'sobj-file-04',
          object_id: 'obj_01H8KEYNOTE',
          folder_path: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/Images/2026/08/04/`,
          object_key: `sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/Images/2026/08/04/obj_01H8KEYNOTE.enc`,
          bucket_name: 'sathus-memomes-vault',
          storage_provider: 'Backblaze B2',
          original_file_name: 'Executive_Presentation_Keynote.png',
          display_name: 'Executive_Presentation_Keynote.png',
          storage_object_name: 'obj_01H8KEYNOTE.enc',
          stored_file_name: 'obj_01H8KEYNOTE.enc',
          extension: 'png',
          mime_type: 'image/png',
          file_size: 6815744,
          checksum: 'a1b2c3d498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          checksum_sha256: 'a1b2c3d498fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          ai_index_status: 'COMPLETED',
          virus_scan_status: 'CLEAN',
          encryption_status: 'AES-256-GCM Zero-Knowledge',
          share_status: 'PRIVATE',
          created_by: personalWs.userStorageId,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          b2_final_url: `https://f004.backblazeb2.com/file/sathus-memomes-vault/sathus/memomes/${personalWs.workspaceStorageId}/${personalWs.userStorageId}/Images/2026/08/04/obj_01H8KEYNOTE.enc`
        }
      }
    ];

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultFiles));
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
      localStorage.removeItem('memomes_uploaded_files');
      localStorage.setItem('memomes_activity_logs', JSON.stringify([]));
      localStorage.setItem('memomes_share_links', JSON.stringify([]));
      localStorage.setItem('memomes_audit_logs', JSON.stringify([]));
      localStorage.setItem('memomes_security_events', JSON.stringify([]));
      localStorage.setItem('memomes_recycle_bin', JSON.stringify([]));
      localStorage.setItem('memomes_favorites', JSON.stringify([]));
      localStorage.setItem('memomes_search_index', JSON.stringify([]));
      localStorage.setItem('memomes_ai_metadata', JSON.stringify([]));
      localStorage.setItem('memomes_ocr_cache', JSON.stringify([]));
      localStorage.setItem('memomes_upload_queue', JSON.stringify([]));
      localStorage.setItem('memomes_download_queue', JSON.stringify([]));
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
}
