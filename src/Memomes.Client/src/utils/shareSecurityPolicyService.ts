/**
 * Enterprise Password Protection & Security Policy Service for Memomes Cloud.
 * Defines subscription-based security policies, lock action enforcements, and audit notifications.
 */

export type PostLimitAction = 
  | 'TEMP_LOCK_30M'
  | 'LOCK_24H'
  | 'PERMANENT_DISABLE'
  | 'REQUIRE_MANUAL_REACTIVATION';

export interface SecurityPolicyConfig {
  maxFailedAttempts: number;
  postLimitAction: PostLimitAction;
  lockoutDurationMs: number;
  notifyOwnerOnLock: boolean;
}

export interface SecurityNotification {
  id: string;
  shareCode: string;
  fileName: string;
  fileOwner: string;
  failedAttempts: number;
  maxAttempts: number;
  ipAddress: string;
  deviceType: string;
  browser: string;
  os: string;
  actionTaken: PostLimitAction;
  timestamp: string;
  isRead: boolean;
}

const SECURITY_NOTIFICATIONS_KEY = 'memomes_security_notifications';

export class ShareSecurityPolicyService {
  /**
   * Get default security policy based on organization / plan tier
   */
  static getDefaultPolicy(planTier: 'FREE' | 'PRO' | 'ENTERPRISE' = 'ENTERPRISE'): SecurityPolicyConfig {
    switch (planTier) {
      case 'FREE':
        return {
          maxFailedAttempts: 3,
          postLimitAction: 'TEMP_LOCK_30M',
          lockoutDurationMs: 30 * 60 * 1000,
          notifyOwnerOnLock: true
        };
      case 'PRO':
        return {
          maxFailedAttempts: 3,
          postLimitAction: 'LOCK_24H',
          lockoutDurationMs: 24 * 60 * 60 * 1000,
          notifyOwnerOnLock: true
        };
      case 'ENTERPRISE':
      default:
        return {
          maxFailedAttempts: 3,
          postLimitAction: 'TEMP_LOCK_30M',
          lockoutDurationMs: 30 * 60 * 1000,
          notifyOwnerOnLock: true
        };
    }
  }

  /**
   * Format post limit action label for UI
   */
  static formatActionLabel(action: PostLimitAction): string {
    switch (action) {
      case 'TEMP_LOCK_30M':
        return 'Temporary 30-Minute Lockout';
      case 'LOCK_24H':
        return '24-Hour Lockout';
      case 'PERMANENT_DISABLE':
        return 'Permanently Disable Link';
      case 'REQUIRE_MANUAL_REACTIVATION':
        return 'Require Owner Manual Reactivation';
      default:
        return 'Security Lockout';
    }
  }

  /**
   * Fetch all security notifications for file owner
   */
  static getSecurityNotifications(): SecurityNotification[] {
    try {
      const raw = localStorage.getItem(SECURITY_NOTIFICATIONS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  /**
   * Dispatch a security notification to file owner
   */
  static dispatchNotification(notification: SecurityNotification): void {
    try {
      const existing = this.getSecurityNotifications();
      existing.unshift(notification);
      localStorage.setItem(SECURITY_NOTIFICATIONS_KEY, JSON.stringify(existing));
    } catch (e) {
      console.error('[ShareSecurityPolicyService] Failed to dispatch security notification:', e);
    }
  }

  /**
   * Mark security notification as read
   */
  static markAsRead(notificationId: string): void {
    const existing = this.getSecurityNotifications();
    const target = existing.find(n => n.id === notificationId);
    if (target) {
      target.isRead = true;
      localStorage.setItem(SECURITY_NOTIFICATIONS_KEY, JSON.stringify(existing));
    }
  }
}
