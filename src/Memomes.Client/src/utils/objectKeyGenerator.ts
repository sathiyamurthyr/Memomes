/**
 * Dynamic Object Key Generator Service for Memomes Cloud
 * 
 * Generates workspace-aware object keys based on workspace type:
 * 
 * PERSONAL WORKSPACE:
 * sathus/memomes/{workspaceId}/{userId}/{fileType}/{YYYY}/{MM}/{DD}/{encryptedObjectId}.enc
 * Example:
 * sathus/memomes/workspace001/user001/PDF/2026/08/03/f9b4d21c8e7a4d1b9c3a5e8f2d1c6ab.enc
 * 
 * BUSINESS / ENTERPRISE WORKSPACE:
 * sathus/memomes/{workspaceId}/{tenantId}/{companyId}/{userId}/{fileType}/{YYYY}/{MM}/{DD}/{encryptedObjectId}.enc
 * Example:
 * sathus/memomes/workspace001/tenant001/company001/user001/PDF/2026/08/03/f9b4d21c8e7a4d1b9c3a5e8f2d1c6ab.enc
 */

import { UlidEngine } from './ulid';

export type WorkspaceType = 'PERSONAL' | 'BUSINESS' | 'ENTERPRISE';

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
  workspaceId?: string;
  tenantId?: string;
  companyId?: string;
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
    if (params.tenantId || params.companyId) {
      return 'BUSINESS';
    }
    return 'PERSONAL';
  }

  static generateObjectKey(params: ObjectKeyParams): ObjectKeyResult {
    const type = this.detectWorkspaceType(params);
    const workspaceId = (params.workspaceId || 'workspace001').toLowerCase().trim();
    const userId = (params.userId || 'user001').toLowerCase().trim();
    const tenantId = (params.tenantId || 'tenant001').toLowerCase().trim();
    const companyId = (params.companyId || 'company001').toLowerCase().trim();
    const fileType = this.classifyFileType(params.mimeType, params.originalFileName);

    const now = params.date || new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');

    const encryptedObjectId = this.generateEncryptedObjectId();
    const storageObjectName = `${encryptedObjectId}.enc`;

    let objectKey = '';
    let folderPath = '';

    const customFolderPath = params.customFolder ? params.customFolder.replace(/^\/+|\/+$/g, '') + '/' : '';

    if (type === 'PERSONAL') {
      // Personal Format: sathus/memomes/{workspaceId}/{userId}/{fileType}/{YYYY}/{MM}/{DD}/{encryptedObjectId}.enc
      folderPath = `${PREFIX_BASE}/${workspaceId}/${userId}/${fileType}/${year}/${month}/${day}/${customFolderPath}`;
      objectKey = `${PREFIX_BASE}/${workspaceId}/${userId}/${fileType}/${year}/${month}/${day}/${storageObjectName}`;
    } else {
      // Business/Enterprise Format: sathus/memomes/{workspaceId}/{tenantId}/{companyId}/{userId}/{fileType}/{YYYY}/{MM}/{DD}/{encryptedObjectId}.enc
      folderPath = `${PREFIX_BASE}/${workspaceId}/${tenantId}/${companyId}/${userId}/${fileType}/${year}/${month}/${day}/${customFolderPath}`;
      objectKey = `${PREFIX_BASE}/${workspaceId}/${tenantId}/${companyId}/${userId}/${fileType}/${year}/${month}/${day}/${storageObjectName}`;
    }

    const b2FinalUrl = `https://f004.backblazeb2.com/file/${DEFAULT_BUCKET}/${objectKey}`;

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
