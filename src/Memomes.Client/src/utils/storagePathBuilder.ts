/**
 * Enterprise Storage Path Builder & File Categorization Engine
 *
 * Implements standard hierarchical object key generation:
 * {tenantId}/{companyId}/{workspaceId}/{userId}/{fileType}/{YYYY}/{MM}/{DD}/{uuid}_{originalFileName}
 *
 * Example:
 * tenant001/company001/workspace001/user001/Documents/2026/08/03/8f4adf9c_passport.pdf
 */

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

export interface StoragePathParams {
  tenantId?: string;
  companyId?: string;
  workspaceId?: string;
  userId?: string;
  originalFileName: string;
  mimeType?: string;
  customFolder?: string;
}

export interface StoragePathResult {
  tenantId: string;
  companyId: string;
  workspaceId: string;
  userId: string;
  fileType: EnterpriseFileType;
  year: string;
  month: string;
  day: string;
  uuid: string;
  originalFileName: string;
  storedFileName: string;
  folderPath: string;
  objectKey: string;
  b2BucketName: string;
  b2FinalUrl: string;
}

const DEFAULT_BUCKET = 'sathus-memomes-vault';

export class StoragePathBuilder {
  /**
   * Automatically classify files into folders based on MIME type & extension
   */
  static classifyFileType(mimeType?: string, fileName: string = ''): EnterpriseFileType {
    const ext = fileName.split('.').pop()?.toLowerCase() || '';
    const mime = (mimeType || '').toLowerCase();

    // 1. PDF
    if (ext === 'pdf' || mime.includes('pdf')) {
      return 'PDF';
    }

    // 2. Images
    if (
      mime.startsWith('image/') ||
      ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'ico', 'avif', 'heic', 'tiff'].includes(ext)
    ) {
      return 'Images';
    }

    // 3. Videos
    if (
      mime.startsWith('video/') ||
      ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'flv', 'wmv', '3gp'].includes(ext)
    ) {
      return 'Videos';
    }

    // 4. Audio
    if (
      mime.startsWith('audio/') ||
      ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'aiff'].includes(ext)
    ) {
      return 'Audio';
    }

    // 5. Spreadsheets
    if (
      mime.includes('spreadsheet') ||
      mime.includes('excel') ||
      mime.includes('csv') ||
      ['xlsx', 'xls', 'csv', 'ods', 'numbers'].includes(ext)
    ) {
      return 'Spreadsheets';
    }

    // 6. Presentations
    if (
      mime.includes('presentation') ||
      mime.includes('powerpoint') ||
      ['pptx', 'ppt', 'key', 'odp'].includes(ext)
    ) {
      return 'Presentations';
    }

    // 7. Documents
    if (
      mime.includes('word') ||
      mime.includes('document') ||
      mime.includes('text/plain') ||
      ['doc', 'docx', 'txt', 'rtf', 'odt', 'pages', 'md'].includes(ext)
    ) {
      return 'Documents';
    }

    // 8. Archives
    if (
      mime.includes('zip') ||
      mime.includes('compressed') ||
      mime.includes('archive') ||
      ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'iso'].includes(ext)
    ) {
      return 'Archives';
    }

    // 9. Source Code
    if (
      ['ts', 'tsx', 'js', 'jsx', 'cs', 'py', 'java', 'cpp', 'c', 'h', 'html', 'css', 'json', 'sql', 'xml', 'yaml', 'yml', 'sh', 'rs', 'go'].includes(ext)
    ) {
      return 'SourceCode';
    }

    return 'Others';
  }

  /**
   * Generate UUID hex string (8 chars for human-readable uniqueness)
   */
  static generateUuid(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID().replace(/-/g, '').slice(0, 8);
    }
    return Math.random().toString(36).slice(2, 10);
  }

  /**
   * Sanitize original filename to prevent path traversal
   */
  static sanitizeFileName(fileName: string): string {
    return fileName
      .replace(/[\/\\]/g, '_') // Strip slashes
      .replace(/\.\./g, '_')   // Strip directory traversal
      .replace(/[^a-zA-Z0-9_\-\.]/g, '_'); // Replace unsafe characters
  }

  /**
   * Generate complete Enterprise Storage Path and Object Key
   */
  static generateStoragePath(params: StoragePathParams): StoragePathResult {
    const tenantId = (params.tenantId || 'tenant001').toLowerCase().trim();
    const companyId = (params.companyId || 'company001').toLowerCase().trim();
    const workspaceId = (params.workspaceId || 'workspace001').toLowerCase().trim();
    const userId = (params.userId || 'user001').toLowerCase().trim();

    const sanitizedName = this.sanitizeFileName(params.originalFileName);
    const fileType = this.classifyFileType(params.mimeType, params.originalFileName);

    const now = new Date();
    const year = String(now.getUTCFullYear());
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');

    const uuid = this.generateUuid();
    const storedFileName = `${uuid}_${sanitizedName}`;

    // Subfolder handling
    const customFolderPath = params.customFolder
      ? params.customFolder.replace(/^\/+|\/+$/g, '') + '/'
      : '';

    // Folder path standard: {tenantId}/{companyId}/{workspaceId}/{userId}/{fileType}/{YYYY}/{MM}/{DD}/
    const folderPath = `${tenantId}/${companyId}/${workspaceId}/${userId}/${fileType}/${year}/${month}/${day}/${customFolderPath}`;

    // Object key standard: {tenantId}/{companyId}/{workspaceId}/{userId}/{fileType}/{YYYY}/{MM}/{DD}/{uuid}_{originalFileName}
    const objectKey = `${folderPath}${storedFileName}`;

    // Direct Backblaze B2 public / presigned URL format
    const b2FinalUrl = `https://f004.backblazeb2.com/file/${DEFAULT_BUCKET}/${objectKey}`;

    return {
      tenantId,
      companyId,
      workspaceId,
      userId,
      fileType,
      year,
      month,
      day,
      uuid,
      originalFileName: params.originalFileName,
      storedFileName,
      folderPath,
      objectKey,
      b2BucketName: DEFAULT_BUCKET,
      b2FinalUrl
    };
  }
}
