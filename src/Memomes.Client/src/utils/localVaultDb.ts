/**
 * Local Vault Database Simulator & Local Storage Persistence Engine
 * Persists uploaded file payloads (data URLs) in client browser's localStorage
 * so user files and secure guest sharing links survive page reloads.
 */

export interface VaultFile {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
  size?: string;
  updatedAt?: string;
  category?: 'image' | 'video' | 'document' | 'archive' | 'other';
  fileNameEncrypted?: string;
  // B2 Sync tracking fields — persisted across reloads
  b2Synced?: boolean;
  b2SyncedAt?: string;
  b2Bucket?: string;
  b2Path?: string;
}

const STORAGE_KEY = 'memomes_vault_files';

export class LocalVaultDb {
  static saveFile(id: string, name: string, type: string, dataUrl: string, extraData?: Partial<VaultFile>) {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);

      const existingIdx = files.findIndex(f => f.id === id);

      const base = existingIdx >= 0 ? files[existingIdx] : {};

      const newFile: VaultFile = {
        ...base,
        id,
        name,
        type,
        dataUrl,
        size: extraData?.size || (base as VaultFile).size || '1.2 MB',
        updatedAt: extraData?.updatedAt || (base as VaultFile).updatedAt || 'Just now',
        category: extraData?.category || (base as VaultFile).category || (type.includes('image') ? 'image' : type.includes('video') ? 'video' : 'document'),
        fileNameEncrypted: extraData?.fileNameEncrypted || (base as VaultFile).fileNameEncrypted || `${Math.random().toString(36).slice(2, 10)}.enc`,
        // Preserve B2 sync tracking — critical for preventing re-uploads
        b2Synced: extraData?.b2Synced ?? (base as VaultFile).b2Synced ?? false,
        b2SyncedAt: extraData?.b2SyncedAt ?? (base as VaultFile).b2SyncedAt,
        b2Bucket: extraData?.b2Bucket ?? (base as VaultFile).b2Bucket,
        b2Path: extraData?.b2Path ?? (base as VaultFile).b2Path,
      };

      if (existingIdx >= 0) {
        files[existingIdx] = newFile;
      } else {
        files.unshift(newFile);
      }

      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.warn('Failed to save file payload to local storage', e);
    }
  }

  /**
   * Update only the B2 sync tracking fields for a file without touching other data.
   * This is the safest way to persist B2 sync state.
   */
  static markFileAsB2Synced(id: string, b2Path: string, b2Bucket: string) {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      const idx = files.findIndex(f => f.id === id);
      if (idx >= 0) {
        files[idx].b2Synced = true;
        files[idx].b2SyncedAt = new Date().toISOString();
        files[idx].b2Bucket = b2Bucket;
        files[idx].b2Path = b2Path;
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
      return files.find(f => f.id === id) || null;
    } catch {
      return null;
    }
  }

  static getAllFiles(): VaultFile[] {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('memomes_uploaded_files') || '[]';
      return JSON.parse(filesStr);
    } catch {
      return [];
    }
  }

  static removeFile(id: string) {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      const filtered = files.filter(f => f.id !== id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to remove file from local storage', e);
    }
  }
}
