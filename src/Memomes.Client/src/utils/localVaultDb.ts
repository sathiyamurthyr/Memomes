/**
 * Local Vault Database Simulator & Enterprise Metadata Storage Engine
 * Persists uploaded file payloads, hierarchical object keys, and complete
 * enterprise database metadata in browser storage.
 */

import { StoragePathBuilder, type StoragePathResult } from './storagePathBuilder';

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
  thumbnail_object_id?: string;
  preview_object_id?: string;
  ai_index_status: string;
  virus_scan_status: string;
  version: number;
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
}

const STORAGE_KEY = 'memomes_vault_files';

export class LocalVaultDb {
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

  static saveFile(id: string, name: string, type: string, dataUrl: string, extraData?: Partial<VaultFile>) {
    try {
      const filesStr = localStorage.getItem(STORAGE_KEY) || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);

      const existingIdx = files.findIndex(f => f.id === id);
      const base = existingIdx >= 0 ? files[existingIdx] : {};

      // Auto-generate enterprise path metadata if not provided
      let meta = extraData?.metadata || (base as VaultFile).metadata;
      if (!meta) {
        const pathInfo: StoragePathResult = StoragePathBuilder.generateStoragePath({
          originalFileName: name,
          mimeType: type,
          tenantId: 'tenant001',
          companyId: 'company001',
          workspaceId: 'workspace001',
          userId: 'user001'
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

      const newFile: VaultFile = {
        ...base,
        id,
        name,
        type,
        dataUrl,
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

      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch (e) {
      console.warn('Failed to save file payload to local storage', e);
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
