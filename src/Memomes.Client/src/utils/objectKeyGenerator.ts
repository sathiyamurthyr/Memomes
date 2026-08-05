/**
 * Dynamic Object Key Generator Service for Memomes Cloud
 * PRODUCTION STORAGE HIERARCHY STANDARD VERSION 2.0
 * 
 * 1. PERSONAL USERS:
 * sathus/memomes/{countryCode}/personal/{workspaceStorageId}/{userStorageId}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
 * Example:
 * sathus/memomes/in/personal/wrk_01H8XMEMOMESCLOUDVAULT01/usr_01H8XMEMOMESCLOUDVAULT01/PDF/2026/08/05/obj_8d91e7a4f26bc39d.enc
 * 
 * 2. ENTERPRISE TENANTS:
 * sathus/memomes/{countryCode}/enterprise/{tenantId}/{companyId}/{workspaceStorageId}/{userStorageId}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
 * Example:
 * sathus/memomes/in/enterprise/tenant001/company001/wrk_01H8XMEMOMESCLOUDVAULT01/usr_01H8XMEMOMESCLOUDVAULT01/PDF/2026/08/05/obj_8d91e7a4f26bc39d.enc
 * 
 * 3. BUSINESS ACCOUNTS:
 * sathus/memomes/{countryCode}/business/{businessId}/{workspaceStorageId}/{userStorageId}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
 * 
 * 4. SYSTEM FILES:
 * system/{subfolder}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
 */

import { UlidEngine } from './ulid';
import { WorkspaceStore } from './workspaceStore';

export type WorkspaceType = 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE' | 'SYSTEM';

export type SystemSubfolder =
  | 'thumbnails'
  | 'ai-index'
  | 'ocr'
  | 'logs'
  | 'templates'
  | 'temporary'
  | 'cache'
  | 'backups';

export type EnterpriseFileType =
  | 'Documents'
  | 'Images'
  | 'Videos'
  | 'Audio'
  | 'Archives'
  | 'SourceCode'
  | 'Spreadsheets'
  | 'Presentations'
  | 'PDF'
  | 'Others';

export interface ObjectKeyParams {
  workspaceType?: WorkspaceType;
  countryCode?: string;
  businessId?: string;
  tenantId?: string;
  companyId?: string;
  systemSubfolder?: SystemSubfolder;
  workspaceId?: string;
  userId?: string;
  originalFileName: string;
  mimeType?: string;
  customFolder?: string;
  date?: Date;
}

export interface ObjectKeyResult {
  workspaceType: WorkspaceType;
  workspaceId: string;
  tenantId: string;
  companyId: string;
  userId: string;
  fileType: EnterpriseFileType;
  year: string;
  month: string;
  day: string;
  objectId: string;
  storageObjectName: string;
  storedFileName: string;
  folderPath: string;
  objectKey: string;
  originalFileName: string;
  displayName: string;
  b2BucketName: string;
  b2FinalUrl: string;
}

const DEFAULT_BUCKET = 'sathus-memomes-vault';
const PREFIX_BASE = 'sathus/memomes';

export class ObjectKeyGenerator {
  static classifyFileType(mimeType?: string, fileName: string = ''): EnterpriseFileType {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mime = (mimeType || '').toLowerCase();

    if (ext === 'pdf' || mime.includes('pdf')) return 'PDF';
    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico', 'avif', 'heic', 'tiff'].includes(ext)) return 'Images';
    if (mime.startsWith('video/') || ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'flv', 'wmv', '3gp'].includes(ext)) return 'Videos';
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'aiff'].includes(ext)) return 'Audio';
    if (mime.includes('spreadsheet') || mime.includes('excel') || mime.includes('csv') || ['xlsx', 'xls', 'csv', 'ods', 'numbers'].includes(ext)) return 'Spreadsheets';
    if (mime.includes('presentation') || mime.includes('powerpoint') || ['pptx', 'ppt', 'key', 'odp'].includes(ext)) return 'Presentations';
    if (mime.includes('word') || mime.includes('document') || mime.includes('text/plain') || ['doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'md'].includes(ext)) return 'Documents';
    if (mime.includes('zip') || mime.includes('compressed') || mime.includes('archive') || ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso'].includes(ext)) return 'Archives';
    if (['ts', 'tsx', 'js', 'jsx', 'cs', 'py', 'java', 'cpp', 'c', 'h', 'html', 'css', 'json', 'sql', 'xml', 'yaml', 'yml', 'sh', 'rs', 'go'].includes(ext)) return 'SourceCode';
    return 'Others';
  }

  static generateEncryptedObjectId(): string {
    const rawUlid = UlidEngine.generate('obj');
    return rawUlid.startsWith('obj_') ? rawUlid : `obj_${rawUlid}`;
  }

  static detectWorkspaceType(params: ObjectKeyParams): WorkspaceType {
    if (params.workspaceType) {
      return params.workspaceType.toUpperCase() as WorkspaceType;
    }
    const personalWs = WorkspaceStore.getPersonalWorkspace(params.userId || 'sathiya@memomes.com');
    if (personalWs && personalWs.workspaceType) {
      return personalWs.workspaceType.toUpperCase() as WorkspaceType;
    }
    return 'PERSONAL';
  }

  static sanitizeStorageId(prefix: 'wrk' | 'usr' | 'fld' | 'obj' | 'thm' | 'prv' | 'shr', existingId?: string): string {
    if (existingId && existingId.startsWith(`${prefix}_`)) {
      return existingId.trim();
    }
    return UlidEngine.generate(prefix);
  }

  static generateObjectKey(params: ObjectKeyParams): ObjectKeyResult {
    const type = this.detectWorkspaceType(params);

    // Reuse permanent single workspace & user IDs
    const personalWs = WorkspaceStore.getPersonalWorkspace(params.userId || 'sathiya@memomes.com');
    const countryCode = (params.countryCode || personalWs.countryCode || 'IN').toUpperCase().trim();

    const rawWorkspaceId = params.workspaceId && params.workspaceId.startsWith('wrk_') ? params.workspaceId : personalWs.workspaceStorageId;
    const rawUserId = params.userId && params.userId.startsWith('usr_') ? params.userId : personalWs.userStorageId;

    const workspaceId = this.sanitizeStorageId('wrk', rawWorkspaceId);
    const userId = this.sanitizeStorageId('usr', rawUserId);
    const fileType = this.classifyFileType(params.mimeType, params.originalFileName);

    const now = params.date || new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');

    // ONLY store encrypted object names e.g. obj_xxxxxxxxx.enc (Never original filenames in storage keys!)
    const encryptedObjectId = this.sanitizeStorageId('obj');
    const storageObjectName = `${encryptedObjectId}.enc`;

    let objectKey = '';
    let folderPath = '';
    let tenantId = '';
    let companyId = '';

    if (type === 'PERSONAL') {
      // Personal: sathus/memomes/{countryCode}/personal/{workspaceStorageId}/{userStorageId}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
      folderPath = `${PREFIX_BASE}/${countryCode}/personal/${workspaceId}/${userId}/${fileType}/${year}/${month}/${day}`;
      objectKey = `${folderPath}/${storageObjectName}`;
    } else if (type === 'ENTERPRISE') {
      // Enterprise: sathus/memomes/{countryCode}/enterprise/{tenantId}/{companyId}/{workspaceStorageId}/{userStorageId}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
      tenantId = (params.tenantId || personalWs.tenantId || 'tenant001').toLowerCase().trim();
      companyId = (params.companyId || personalWs.companyId || 'company001').toLowerCase().trim();
      folderPath = `${PREFIX_BASE}/${countryCode}/enterprise/${tenantId}/${companyId}/${workspaceId}/${userId}/${fileType}/${year}/${month}/${day}`;
      objectKey = `${folderPath}/${storageObjectName}`;
    } else if (type === 'BUSINESS') {
      const businessId = (params.businessId || personalWs.businessId || 'biz_01H8XMEMOMES').trim();
      folderPath = `${PREFIX_BASE}/${countryCode}/business/${businessId}/${workspaceId}/${userId}/${fileType}/${year}/${month}/${day}`;
      objectKey = `${folderPath}/${storageObjectName}`;
    } else {
      // System: system/{subfolder}/{category}/{yyyy}/{MM}/{dd}/obj_xxxxxxxxx.enc
      const systemSubfolder: SystemSubfolder = params.systemSubfolder || 'thumbnails';
      folderPath = `system/${systemSubfolder}/${fileType}/${year}/${month}/${day}`;
      objectKey = `${folderPath}/${storageObjectName}`;
    }

    const b2FinalUrl = `https://f004.backblazeb2.com/file/${DEFAULT_BUCKET}/${objectKey}`;

    // Storage Path Logging Requirement
    console.log(`
====== MEMOMES CLOUD STORAGE PATH GENERATED ======
Account Type : ${type}
Country      : ${countryCode}
Workspace    : ${workspaceId}
User         : ${userId}
Generated Path: ${objectKey}
==================================================`);

    return {
      workspaceType: type,
      workspaceId,
      tenantId,
      companyId,
      userId,
      fileType,
      year,
      month,
      day,
      objectId: encryptedObjectId,
      storageObjectName,
      storedFileName: storageObjectName,
      folderPath,
      objectKey,
      originalFileName: params.originalFileName,
      displayName: params.originalFileName,
      b2BucketName: DEFAULT_BUCKET,
      b2FinalUrl
    };
  }
}
