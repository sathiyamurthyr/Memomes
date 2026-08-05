import {
  ShareSecurityPolicyService,
  type PostLimitAction,
  type SecurityNotification
} from './shareSecurityPolicyService';
import { SecurityCenterStore } from './securityCenterStore';

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
  /** Direct preview URL (remote URL or base64 data URL) for rendering in the share viewer */
  previewUrl?: string;
  /** Raw file data URL for download (may be omitted to save space) */
  fileDataUrl?: string;
  tenantId: string;
  companyId: string;
  workspaceId: string;
  createdBy: string;
  accessTier: 'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL';
  passwordPin?: string;
  pinProtected: boolean;
  failedAttempts: number;            // Counter of failed PIN attempts
  maxFailedAttempts: number;         // Default: 3
  postLimitAction: PostLimitAction;   // 'TEMP_LOCK_30M' | 'LOCK_24H' | 'PERMANENT_DISABLE' | 'REQUIRE_MANUAL_REACTIVATION'
  lockedUntil: string | null;         // ISO timestamp if locked
  isLockedOut: boolean;
  securityEvents: SecurityNotification[];
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
  errorCode?: 'REVOKED' | 'EXPIRED' | 'MAX_VIEWS_EXCEEDED' | 'BURNED' | 'PIN_REQUIRED' | 'LOCKED_OUT' | 'NOT_FOUND';
  errorMessage?: string;
  remainingAttempts?: number;
  lockedUntil?: string | null;
  postLimitAction?: PostLimitAction;
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
   * Validate access to a share link based on security policies & failed attempt lockouts
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

    // Check Lockout Status & Expiry
    if (record.isLockedOut || record.lockedUntil) {
      if (record.lockedUntil) {
        const lockExpiryTime = new Date(record.lockedUntil).getTime();
        if (Date.now() >= lockExpiryTime) {
          // Lockout window has passed — auto unlock
          record.isLockedOut = false;
          record.lockedUntil = null;
          record.failedAttempts = 0;
          this.saveShareLink(record);
        } else {
          const minutesLeft = Math.ceil((lockExpiryTime - Date.now()) / (1000 * 60));
          return {
            allowed: false,
            errorCode: 'LOCKED_OUT',
            errorMessage: `Security Lockout: Link is temporarily locked for ${minutesLeft} more minute(s) due to multiple failed PIN attempts.`,
            lockedUntil: record.lockedUntil,
            postLimitAction: record.postLimitAction,
            record
          };
        }
      } else if (record.isLockedOut) {
        return {
          allowed: false,
          errorCode: 'LOCKED_OUT',
          errorMessage: 'Security Lockout: Maximum failed PIN attempts reached. This link requires manual reactivation by the file owner.',
          postLimitAction: record.postLimitAction,
          record
        };
      }
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
        const remaining = Math.max(0, (record.maxFailedAttempts || 3) - (record.failedAttempts + 1));
        return {
          allowed: false,
          errorCode: 'PIN_REQUIRED',
          errorMessage: `Incorrect PIN password. ${remaining} attempt(s) remaining before security lockout.`,
          remainingAttempts: remaining,
          record
        };
      }
    }

    return { allowed: true, record };
  }

  /**
   * Register a failed PIN attempt, increment counter, enforce post-limit security actions
   */
  static registerFailedAttempt(codeOrAlias: string, userAgentStr?: string): {
    remainingAttempts: number;
    isLockedOut: boolean;
    postLimitAction: PostLimitAction;
    lockedUntil: string | null;
  } {
    const record = this.getShareLinkByCode(codeOrAlias);
    const maxAttempts = record?.maxFailedAttempts || 3;
    const postAction = record?.postLimitAction || 'TEMP_LOCK_30M';

    if (!record) {
      return { remainingAttempts: 0, isLockedOut: false, postLimitAction: postAction, lockedUntil: null };
    }

    record.failedAttempts += 1;
    const remainingAttempts = Math.max(0, maxAttempts - record.failedAttempts);

    // Trigger SecurityCenterStore Engine (12 Security Actions)
    SecurityCenterStore.recordFailedPasswordAttempt(
      record.shareCode,
      record.fileName,
      record.failedAttempts,
      record.createdBy || 'sathiya@memomes.com'
    );

    if (record.failedAttempts >= maxAttempts) {
      record.isLockedOut = true;

      const now = new Date();
      if (postAction === 'TEMP_LOCK_30M') {
        const unlockTime = new Date(now.getTime() + 30 * 60 * 1000);
        record.lockedUntil = unlockTime.toISOString();
      } else if (postAction === 'LOCK_24H') {
        const unlockTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        record.lockedUntil = unlockTime.toISOString();
      } else if (postAction === 'PERMANENT_DISABLE') {
        record.isRevoked = true;
        record.lockedUntil = null;
      } else if (postAction === 'REQUIRE_MANUAL_REACTIVATION') {
        record.lockedUntil = null;
      }

      // Create Security Notification
      const ua = userAgentStr || (typeof navigator !== 'undefined' ? navigator.userAgent : '');
      let deviceType = 'Desktop';
      if (/Mobile|iPhone|Android/i.test(ua)) deviceType = 'Mobile';

      let browser = 'Chrome';
      if (/Firefox/i.test(ua)) browser = 'Firefox';
      else if (/Safari/i.test(ua)) browser = 'Safari';

      const secEvent: SecurityNotification = {
        id: `sec-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        shareCode: record.shareCode,
        fileName: record.fileName,
        fileOwner: record.createdBy,
        failedAttempts: record.failedAttempts,
        maxAttempts,
        ipAddress: '103.21.124.5',
        deviceType,
        browser,
        os: 'Windows',
        actionTaken: postAction,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isRead: false
      };

      if (!record.securityEvents) record.securityEvents = [];
      record.securityEvents.unshift(secEvent);

      ShareSecurityPolicyService.dispatchNotification(secEvent);
    }

    this.saveShareLink(record);

    return {
      remainingAttempts,
      isLockedOut: record.isLockedOut,
      postLimitAction: record.postLimitAction,
      lockedUntil: record.lockedUntil
    };
  }

  /**
   * Reset failed attempt counter to zero upon successful PIN entry
   */
  static registerSuccessfulAttempt(codeOrAlias: string): void {
    const record = this.getShareLinkByCode(codeOrAlias);
    if (record) {
      record.failedAttempts = 0;
      record.isLockedOut = false;
      record.lockedUntil = null;
      this.saveShareLink(record);
    }
  }

  /**
   * Owner action: Manually unlock link and reset security counter
   */
  static resetFailedAttemptsAndUnlock(idOrCode: string): boolean {
    const records = this.getAllShareLinks();
    const target = records.find(r => r.id === idOrCode || r.shareCode === idOrCode);
    if (target) {
      target.failedAttempts = 0;
      target.isLockedOut = false;
      target.lockedUntil = null;
      target.isRevoked = false;
      target.updatedAt = new Date().toISOString();
      this.saveAllShareLinks(records);
      return true;
    }
    return false;
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
      ipAddress: '103.21.124.5',
      country: 'US',
      deviceType,
      browser,
      os
    };

    record.currentViews += 1;
    if (!record.analytics) record.analytics = [];
    record.analytics.unshift(event);
    record.updatedAt = new Date().toISOString();

    if (record.maxViews !== null && record.currentViews >= record.maxViews) {
      record.isExpired = true;
    }

    this.saveShareLink(record);
    return record;
  }
}
