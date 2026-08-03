/**
 * Enterprise ShareLink Data Store & Access Resolver for Memomes Cloud.
 * Manages persistent share link records, permissions, access validation, and view analytics.
 */

export interface ShareAnalyticsEvent {
  id: string;
  viewedAt: string;
  ipAddress: string;
  country: string;
  deviceType: 'Mobile' | 'Desktop' | 'Tablet';
  browser: string;
  os: string;
  userEmail?: string;
}

export interface ShareLinkRecord {
  id: string;
  shareCode: string;           // Base62 code e.g. "k8Fx2M9a"
  customAlias?: string;        // Optional Pro custom alias e.g. "q3-report"
  fileId: string;              // References local vault file
  fileName: string;
  fileSize: string;
  mimeType: string;
  tenantId: string;
  companyId: string;
  workspaceId: string;
  createdBy: string;
  accessTier: 'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL';
  passwordPin?: string;
  pinProtected: boolean;
  expiresAt: string | null;     // ISO timestamp string or null
  maxViews: number | null;      // e.g. 5 or null (unlimited)
  currentViews: number;
  isExpired: boolean;
  isRevoked: boolean;
  burnOnRead: boolean;
  enableWatermark: boolean;
  watermarkConfig?: {
    text: string;
    font: string;
    density: 'low' | 'medium' | 'high';
    rotation: number;
    opacity: number;
  };
  domainType: 'SHARE_SUBDOMAIN' | 'SHORT_PATH' | 'LOCAL_ORIGIN';
  brandedUrl: string;
  analytics: ShareAnalyticsEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface AccessValidationResult {
  allowed: boolean;
  errorCode?: 'REVOKED' | 'EXPIRED' | 'MAX_VIEWS_EXCEEDED' | 'BURNED' | 'PIN_REQUIRED' | 'NOT_FOUND';
  errorMessage?: string;
  record?: ShareLinkRecord;
}

const LOCAL_STORAGE_KEY = 'memomes_share_links';

export class ShareLinkStore {
  /**
   * Fetch all share links from localStorage
   */
  static getAllShareLinks(): ShareLinkRecord[] {
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Save all share links to localStorage
   */
  private static saveAllShareLinks(records: ShareLinkRecord[]): void {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(records));
    } catch (e) {
      console.error('[ShareLinkStore] Failed to save share links:', e);
    }
  }

  /**
   * Create or update a ShareLink record
   */
  static saveShareLink(record: ShareLinkRecord): ShareLinkRecord {
    const records = this.getAllShareLinks();
    const existingIndex = records.findIndex(r => r.id === record.id || r.shareCode === record.shareCode);
    
    if (existingIndex >= 0) {
      records[existingIndex] = { ...record, updatedAt: new Date().toISOString() };
    } else {
      records.unshift(record);
    }

    this.saveAllShareLinks(records);
    return record;
  }

  /**
   * Find a ShareLink by shareCode or custom alias
   */
  static getShareLinkByCode(codeOrAlias: string): ShareLinkRecord | null {
    if (!codeOrAlias) return null;
    const clean = codeOrAlias.trim();
    const records = this.getAllShareLinks();
    return records.find(r => r.shareCode === clean || (r.customAlias && r.customAlias.toLowerCase() === clean.toLowerCase())) || null;
  }

  /**
   * Check if a share code or alias is already taken
   */
  static isCodeTaken(codeOrAlias: string, currentRecordId?: string): boolean {
    const clean = codeOrAlias.trim().toLowerCase();
    const records = this.getAllShareLinks();
    return records.some(r => r.id !== currentRecordId && (r.shareCode.toLowerCase() === clean || r.customAlias?.toLowerCase() === clean));
  }

  /**
   * Fetch all share links belonging to a specific file ID
   */
  static getShareLinksForFile(fileId: string): ShareLinkRecord[] {
    const records = this.getAllShareLinks();
    return records.filter(r => r.fileId === fileId);
  }

  /**
   * Revoke a share link by ID or code
   */
  static revokeShareLink(idOrCode: string): boolean {
    const records = this.getAllShareLinks();
    const index = records.findIndex(r => r.id === idOrCode || r.shareCode === idOrCode);
    if (index >= 0) {
      records[index].isRevoked = true;
      records[index].updatedAt = new Date().toISOString();
      this.saveAllShareLinks(records);
      return true;
    }
    return false;
  }

  /**
   * Delete a share link permanently
   */
  static deleteShareLink(idOrCode: string): boolean {
    const records = this.getAllShareLinks();
    const filtered = records.filter(r => r.id !== idOrCode && r.shareCode !== idOrCode);
    if (filtered.length !== records.length) {
      this.saveAllShareLinks(filtered);
      return true;
    }
    return false;
  }

  /**
   * Validate access to a share link based on security policies
   */
  static validateAccess(codeOrAlias: string, providedPin?: string): AccessValidationResult {
    const record = this.getShareLinkByCode(codeOrAlias);
    if (!record) {
      return {
        allowed: false,
        errorCode: 'NOT_FOUND',
        errorMessage: 'Share link not found or link has expired.'
      };
    }

    if (record.isRevoked) {
      return {
        allowed: false,
        errorCode: 'REVOKED',
        errorMessage: 'This share link has been revoked by the file owner.',
        record
      };
    }

    // Check expiration timestamp
    if (record.expiresAt) {
      const expiryTime = new Date(record.expiresAt).getTime();
      if (Date.now() > expiryTime) {
        record.isExpired = true;
        this.saveShareLink(record);
        return {
          allowed: false,
          errorCode: 'EXPIRED',
          errorMessage: 'This share link has expired.',
          record
        };
      }
    }

    // Check maximum view count limit
    if (record.maxViews !== null && record.currentViews >= record.maxViews) {
      return {
        allowed: false,
        errorCode: 'MAX_VIEWS_EXCEEDED',
        errorMessage: `Maximum view limit (${record.maxViews}) has been reached.`,
        record
      };
    }

    // Check burn on read policy
    if (record.burnOnRead && record.currentViews >= 1) {
      return {
        allowed: false,
        errorCode: 'BURNED',
        errorMessage: 'This single-view link has self-destructed.',
        record
      };
    }

    // Check password PIN protection
    if (record.pinProtected && record.passwordPin) {
      if (!providedPin) {
        return {
          allowed: false,
          errorCode: 'PIN_REQUIRED',
          errorMessage: 'PIN required to decrypt payload.',
          record
        };
      }
      if (providedPin.trim() !== record.passwordPin.trim()) {
        return {
          allowed: false,
          errorCode: 'PIN_REQUIRED',
          errorMessage: 'Incorrect PIN password.',
          record
        };
      }
    }

    return { allowed: true, record };
  }

  /**
   * Record a view analytics event for a share link
   */
  static recordViewEvent(codeOrAlias: string, userAgentStr?: string): ShareLinkRecord | null {
    const record = this.getShareLinkByCode(codeOrAlias);
    if (!record) return null;

    const ua = userAgentStr || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
    
    // Simple device detection
    let deviceType: 'Mobile' | 'Desktop' | 'Tablet' = 'Desktop';
    if (/iPad|Android(?!.*Mobile)/i.test(ua)) deviceType = 'Tablet';
    else if (/Mobile|iPhone|Android/i.test(ua)) deviceType = 'Mobile';

    // Simple browser detection
    let browser = 'Chrome';
    if (/Firefox/i.test(ua)) browser = 'Firefox';
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = 'Safari';
    else if (/Edg/i.test(ua)) browser = 'Edge';

    // Simple OS detection
    let os = 'Windows';
    if (/Macintosh|Mac OS X/i.test(ua)) os = 'macOS';
    else if (/Linux/i.test(ua)) os = 'Linux';
    else if (/iPhone|iPad/i.test(ua)) os = 'iOS';
    else if (/Android/i.test(ua)) os = 'Android';

    const event: ShareAnalyticsEvent = {
      id: `evt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
      viewedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      ipAddress: '103.21.124.5', // Standard mock client IP or real IP
      country: 'US',
      deviceType,
      browser,
      os
    };

    record.currentViews += 1;
    record.analytics.unshift(event);
    record.updatedAt = new Date().toISOString();

    if (record.maxViews !== null && record.currentViews >= record.maxViews) {
      record.isExpired = true;
    }

    this.saveShareLink(record);
    return record;
  }
}
