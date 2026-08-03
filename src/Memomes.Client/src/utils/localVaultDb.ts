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
}

export class LocalVaultDb {
  static saveFile(id: string, name: string, type: string, dataUrl: string, extraData?: Partial<VaultFile>) {
    try {
      const filesStr = localStorage.getItem('memomes_vault_files') || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      
      const existingIdx = files.findIndex(f => f.id === id);
      const newFile: VaultFile = {
        id,
        name,
        type,
        dataUrl,
        size: extraData?.size || '1.2 MB',
        updatedAt: extraData?.updatedAt || 'Just now',
        category: extraData?.category || (type.includes('image') ? 'image' : type.includes('video') ? 'video' : 'document'),
        fileNameEncrypted: extraData?.fileNameEncrypted || `${Math.random().toString(36).slice(2, 10)}.enc`
      };
      
      if (existingIdx >= 0) {
        files[existingIdx] = newFile;
      } else {
        files.unshift(newFile);
      }
      
      localStorage.setItem('memomes_vault_files', JSON.stringify(files));
    } catch (e) {
      console.warn('Failed to save file payload to local storage', e);
    }
  }

  static getFile(id: string): VaultFile | null {
    try {
      const filesStr = localStorage.getItem('memomes_vault_files') || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      return files.find(f => f.id === id) || null;
    } catch (e) {
      return null;
    }
  }

  static getAllFiles(): VaultFile[] {
    try {
      const filesStr = localStorage.getItem('memomes_vault_files') || localStorage.getItem('memomes_uploaded_files') || '[]';
      return JSON.parse(filesStr);
    } catch (e) {
      return [];
    }
  }

  static removeFile(id: string) {
    try {
      const filesStr = localStorage.getItem('memomes_vault_files') || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      const filtered = files.filter(f => f.id !== id);
      localStorage.setItem('memomes_vault_files', JSON.stringify(filtered));
    } catch (e) {
      console.warn('Failed to remove file from local storage', e);
    }
  }
}
