/**
 * duplicateDetector.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * MEMOMES CLOUD — ENTERPRISE DUPLICATE FILE DETECTION & MATRIX ENGINE
 *
 * Implements 4-Case Duplicate Decision Matrix:
 * CASE 1: Same SHA-256 + Same Folder        -> Exact Duplicate (100% SHA Match)
 * CASE 2: Same Filename + Different SHA     -> Same Name, Different Content
 * CASE 3: Different Filename + Same SHA    -> Duplicate Content Across Names
 * CASE 4: Same Filename + Same SHA + Diff Folder -> Duplicate Across Folder
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { LocalVaultDb, type VaultFile } from './localVaultDb';
import { auditLogger } from './auditLogger';

export type DuplicateCase = 'CASE_1' | 'CASE_2' | 'CASE_3' | 'CASE_4' | 'NONE';

export interface DuplicateCheckResult {
  isDuplicate: boolean;
  duplicateCase: DuplicateCase;
  existingFile: VaultFile | null;
  contentHash: string;
  proposedFileName: string;
  targetFolder: string;
  description: string;
  matchPercentage: number;
}

export interface DuplicateActionOptions {
  action:
    | 'SKIP'
    | 'OPEN_EXISTING'
    | 'REPLACE'
    | 'CREATE_VERSION'
    | 'KEEP_BOTH'
    | 'COMPARE'
    | 'RENAME_AUTO'
    | 'MOVE_EXISTING'
    | 'CANCEL';
  newFileName?: string;
  targetFileId?: string;
}

export class DuplicateDetector {
  /**
   * Computes SHA-256 checksum of an ArrayBuffer or File using Web Crypto API
   */
  static async computeSha256(data: ArrayBuffer | Uint8Array | string): Promise<string> {
    try {
      let buffer: ArrayBuffer;
      if (typeof data === 'string') {
        buffer = new TextEncoder().encode(data).buffer;
      } else if (data instanceof Uint8Array) {
        buffer = data.buffer as ArrayBuffer;
      } else {
        buffer = data;
      }

      const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    } catch (e) {
      console.warn('[DuplicateDetector] Web Crypto SHA-256 fallback', e);
      return `sha256_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    }
  }

  /**
   * Evaluates a candidate file against database records for 4-Case Duplicate Decision Matrix.
   */
  static async checkDuplicate(
    fileName: string,
    contentHash: string,
    targetFolder: string = 'Documents'
  ): Promise<DuplicateCheckResult> {
    const startTime = performance.now();
    const allFiles: VaultFile[] = LocalVaultDb.getAllFiles();

    // Query 1: Existing file with exact same SHA-256 hash
    const existingByHash = allFiles.find((f: VaultFile) => 
      !(f as any).isTrash && (f.metadata?.checksum_sha256 === contentHash || f.metadata?.file_hash_sha256 === contentHash || f.id === contentHash)
    );

    // Query 2: Existing file with exact same filename in ANY folder
    const existingByName = allFiles.find((f: VaultFile) => 
      !(f as any).isTrash && f.name.toLowerCase().trim() === fileName.toLowerCase().trim()
    );

    const lookupTimeMs = performance.now() - startTime;
    if (lookupTimeMs > 50) {
      console.warn(`[DuplicateDetector] Lookup completed in ${lookupTimeMs.toFixed(1)}ms (Target < 50ms)`);
    }

    const cleanFolder = (folder?: string) => (folder || 'Documents').toLowerCase().trim();

    // ── CASE 1: Same SHA-256 + Same Folder -> Exact Duplicate ──────────────────
    if (existingByHash && existingByName && existingByHash.id === existingByName.id && cleanFolder(existingByHash.metadata?.folder_path) === cleanFolder(targetFolder)) {
      auditLogger.trackAnalytics('duplicate_detected', { case: 'CASE_1', fileName, contentHash });
      auditLogger.logAudit('DUPLICATE_DETECTION', `CASE 1 (Exact Duplicate): ${fileName}`, 'WARNING');
      return {
        isDuplicate: true,
        duplicateCase: 'CASE_1',
        existingFile: existingByHash,
        contentHash,
        proposedFileName: fileName,
        targetFolder,
        matchPercentage: 100,
        description: 'Exact duplicate file detected in this folder (100% SHA-256 match).'
      };
    }

    // ── CASE 4: Same Filename + Same SHA + Different Folder ───────────────────
    if (existingByHash && existingByName && existingByHash.id === existingByName.id && cleanFolder(existingByHash.metadata?.folder_path) !== cleanFolder(targetFolder)) {
      auditLogger.trackAnalytics('duplicate_detected', { case: 'CASE_4', fileName, contentHash });
      auditLogger.logAudit('DUPLICATE_DETECTION', `CASE 4 (Duplicate Across Folder): ${fileName}`, 'WARNING');
      return {
        isDuplicate: true,
        duplicateCase: 'CASE_4',
        existingFile: existingByHash,
        contentHash,
        proposedFileName: fileName,
        targetFolder,
        matchPercentage: 100,
        description: `This exact file exists in another folder (${existingByHash.metadata?.folder_path || 'Home'}).`
      };
    }

    // ── CASE 2: Same Filename + Different SHA -> Same Name, Different Content ─
    if (existingByName && (!existingByHash || existingByHash.id !== existingByName.id)) {
      auditLogger.trackAnalytics('duplicate_detected', { case: 'CASE_2', fileName, contentHash });
      auditLogger.logAudit('DUPLICATE_DETECTION', `CASE 2 (Filename Collision): ${fileName}`, 'WARNING');
      return {
        isDuplicate: true,
        duplicateCase: 'CASE_2',
        existingFile: existingByName,
        contentHash,
        proposedFileName: fileName,
        targetFolder,
        matchPercentage: 0,
        description: 'A file with this name already exists in this folder with different content.'
      };
    }

    // ── CASE 3: Different Filename + Same SHA -> Duplicate Content ─────────────
    if (existingByHash && (!existingByName || existingByHash.id !== existingByName.id)) {
      auditLogger.trackAnalytics('duplicate_detected', { case: 'CASE_3', fileName, contentHash });
      auditLogger.logAudit('DUPLICATE_DETECTION', `CASE 3 (Duplicate Content Across Names): ${fileName}`, 'WARNING');
      return {
        isDuplicate: true,
        duplicateCase: 'CASE_3',
        existingFile: existingByHash,
        contentHash,
        proposedFileName: fileName,
        targetFolder,
        matchPercentage: 100,
        description: `Identical content detected under existing file name '${existingByHash.name}'.`
      };
    }

    return {
      isDuplicate: false,
      duplicateCase: 'NONE',
      existingFile: null,
      contentHash,
      proposedFileName: fileName,
      targetFolder,
      matchPercentage: 0,
      description: 'No duplicate detected.'
    };
  }

  /**
   * Generates auto-incremented non-conflicting filename: "Screenshot (2).png"
   */
  static generateAutoRename(fileName: string): string {
    const allFiles: VaultFile[] = LocalVaultDb.getAllFiles();
    const parts = fileName.split('.');
    const ext = parts.length > 1 ? `.${parts.pop()}` : '';
    const baseName = parts.join('.');

    let counter = 2;
    let candidate = `${baseName} (${counter})${ext}`;

    while (allFiles.some((f: VaultFile) => !(f as any).isTrash && f.name.toLowerCase() === candidate.toLowerCase())) {
      counter++;
      candidate = `${baseName} (${counter})${ext}`;
    }

    return candidate;
  }
}
