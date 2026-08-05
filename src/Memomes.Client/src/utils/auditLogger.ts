/**
 * Audit Logging and Real-Time Event Engine for Memomes Cloud.
 * Tracks user interactions, file actions, security audit trails, and analytics.
 */

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  fileName?: string;
  fileType?: string;
  category?: string;
  user: string;
  device?: string;
  ip: string;
  location?: string;
  status: 'SUCCESS' | 'WARNING' | 'FAILED';
}

const AUDIT_STORAGE_KEY = 'memomes_audit_logs';
const ANALYTICS_STORAGE_KEY = 'memomes_analytics_events';

export const auditLogger = {
  logAudit(
    action: string,
    details: string,
    status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS',
    fileName?: string,
    fileType?: string,
    user: string = 'sathiya@memomes.com',
    device: string = 'Desktop'
  ) {
    try {
      const derivedExt = fileType || (fileName ? fileName.split('.').pop()?.toLowerCase() : 'file');
      
      const entry: AuditLogEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        timestamp: new Date().toISOString(),
        action,
        details,
        fileName: fileName || details.split(' ')[1] || 'File',
        fileType: derivedExt,
        category: this.getCategoryFromExt(derivedExt || ''),
        user,
        device,
        ip: '127.0.0.1 (Zero-Knowledge Tunnel)',
        location: 'Local Vault Sync',
        status
      };

      const existing = this.getAuditLogs();
      const updated = [entry, ...existing].slice(0, 300); // keep last 300 logs
      localStorage.setItem(AUDIT_STORAGE_KEY, JSON.stringify(updated));

      // Dispatch custom window event for real-time auto refresh across all widgets
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memomes_audit_logged', { detail: entry }));
      }
      return entry;
    } catch (e) {
      console.debug('Failed to write audit log', e);
      return null;
    }
  },

  logFileActivity(
    fileName: string,
    action: string,
    details?: string,
    fileType?: string,
    status: 'SUCCESS' | 'WARNING' | 'FAILED' = 'SUCCESS',
    user: string = 'sathiya@memomes.com',
    device: string = 'Desktop'
  ) {
    return this.logAudit(
      action,
      details || `${action} action performed on ${fileName}`,
      status,
      fileName,
      fileType,
      user,
      device
    );
  },

  trackAnalytics(eventName: string, payload?: Record<string, any>) {
    try {
      const event = {
        eventName,
        payload: payload || {},
        timestamp: new Date().toISOString()
      };
      const existingStr = localStorage.getItem(ANALYTICS_STORAGE_KEY);
      const existing = existingStr ? JSON.parse(existingStr) : [];
      const updated = [event, ...existing].slice(0, 100);
      localStorage.setItem(ANALYTICS_STORAGE_KEY, JSON.stringify(updated));

      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('memomes_analytics_tracked', { detail: event }));
      }
    } catch (e) {
      console.debug('Failed to track analytics event', e);
    }
  },

  getAuditLogs(): AuditLogEntry[] {
    try {
      const raw = localStorage.getItem(AUDIT_STORAGE_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  },

  /** Real-time Pub/Sub subscription helper */
  subscribe(callback: (log: AuditLogEntry) => void): () => void {
    if (typeof window === 'undefined') return () => {};
    const handler = (e: Event) => {
      const customEvent = e as CustomEvent<AuditLogEntry>;
      if (customEvent.detail) {
        callback(customEvent.detail);
      }
    };
    window.addEventListener('memomes_audit_logged', handler);
    return () => window.removeEventListener('memomes_audit_logged', handler);
  },

  getCategoryFromExt(ext: string): string {
    const cleanExt = (ext || '').toLowerCase().replace('.', '');
    if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'csv', 'json', 'xml', 'md'].includes(cleanExt)) return 'document';
    if (['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'tiff', 'heic'].includes(cleanExt)) return 'image';
    if (['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(cleanExt)) return 'video';
    if (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a'].includes(cleanExt)) return 'audio';
    if (['zip', 'rar', '7z', 'tar', 'gz'].includes(cleanExt)) return 'archive';
    if (['py', 'js', 'ts', 'java', 'cs', 'cpp', 'go', 'php', 'sql', 'html', 'css'].includes(cleanExt)) return 'sourcecode';
    return 'other';
  }
};
