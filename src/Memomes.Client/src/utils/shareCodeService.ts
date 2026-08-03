/**
 * Base62 Short Code Generator & Branded Domain URL Formatter for Memomes Cloud.
 * Supports 6-8 character Base62 codes [0-9a-zA-Z] and URL-safe custom Pro aliases.
 */

const BASE62_CHARSET = '0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ';

export type BrandedDomainType = 'SHARE_SUBDOMAIN' | 'SHORT_PATH' | 'LOCAL_ORIGIN';

export class ShareCodeService {
  /**
   * Generate a random unique Base62 code of specified length (default 7 characters)
   */
  static generateBase62Code(length: number = 7): string {
    let result = '';
    const charsetLength = BASE62_CHARSET.length;
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charsetLength);
      result += BASE62_CHARSET[randomIndex];
    }
    return result;
  }

  /**
   * Validate custom Pro alias slug (3-30 chars, alphanumeric, hyphens, underscores)
   */
  static validateCustomAlias(alias: string): { valid: boolean; message?: string } {
    const trimmed = alias.trim();
    if (!trimmed) {
      return { valid: false, message: 'Alias cannot be empty.' };
    }
    if (trimmed.length < 3) {
      return { valid: false, message: 'Alias must be at least 3 characters.' };
    }
    if (trimmed.length > 30) {
      return { valid: false, message: 'Alias cannot exceed 30 characters.' };
    }
    const slugRegex = /^[a-zA-Z0-9_-]+$/;
    if (!slugRegex.test(trimmed)) {
      return { valid: false, message: 'Alias can only contain letters, numbers, hyphens, and underscores.' };
    }
    return { valid: true };
  }

  /**
   * Format branded URL based on selected domain style and share code
   */
  static formatBrandedUrl(
    domainType: BrandedDomainType,
    shareCode: string,
    originFallback: string = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:6523'
  ): string {
    const cleanCode = encodeURIComponent(shareCode.trim());
    switch (domainType) {
      case 'SHARE_SUBDOMAIN':
        return `https://share.memomes.cloud/${cleanCode}`;
      case 'SHORT_PATH':
        return `https://memomes.cloud/s/${cleanCode}`;
      case 'LOCAL_ORIGIN':
      default:
        return `${originFallback}/s/${cleanCode}`;
    }
  }

  /**
   * Extract share code from pathname or search params
   */
  static extractShareCodeFromLocation(pathname: string, searchParams: URLSearchParams): string {
    const pathParts = pathname.split('/').filter(Boolean);
    if (pathParts.length > 0) {
      const lastPart = pathParts[pathParts.length - 1];
      if (lastPart && lastPart !== 's') {
        return lastPart;
      }
    }
    return searchParams.get('code') || searchParams.get('p') || '';
  }
}
