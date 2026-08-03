/**
 * Memomes Cloud Storage Path Builder
 * Delegates object key generation to the dedicated ObjectKeyGenerator service.
 */

import { ObjectKeyGenerator, type ObjectKeyParams, type ObjectKeyResult } from './objectKeyGenerator';

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

export interface StoragePathParams extends ObjectKeyParams {}
export interface StoragePathResult extends ObjectKeyResult {}

export class StoragePathBuilder {
  static classifyFileType(mimeType?: string, fileName: string = ''): EnterpriseFileType {
    return ObjectKeyGenerator.classifyFileType(mimeType, fileName);
  }

  static sanitizeFileName(fileName: string): string {
    return fileName.replace(/[\/\\]/g, '_').replace(/\.\./g, '_');
  }

  static generateStoragePath(params: StoragePathParams): StoragePathResult {
    const res = ObjectKeyGenerator.generateObjectKey(params);
    return {
      ...res,
      tenantId: res.tenantId || 'tenant001',
      companyId: res.companyId || 'company001'
    };
  }
}
