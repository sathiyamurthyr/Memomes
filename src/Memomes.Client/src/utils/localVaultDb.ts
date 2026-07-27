/**
 * Local Vault Database Simulator
 * Persists uploaded file payloads (data URLs) in client browser's localStorage / sessionStorage
 * so they can be dynamically resolved on secure guest sharing screens.
 */

export interface VaultFile {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}

export class LocalVaultDb {
  static saveFile(id: string, name: string, type: string, dataUrl: string) {
    try {
      const filesStr = localStorage.getItem('memomes_vault_files') || '[]';
      const files: VaultFile[] = JSON.parse(filesStr);
      
      // Upsert
      const existingIdx = files.findIndex(f => f.id === id);
      const newFile = { id, name, type, dataUrl };
      
      if (existingIdx >= 0) {
        files[existingIdx] = newFile;
      } else {
        files.push(newFile);
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
}
