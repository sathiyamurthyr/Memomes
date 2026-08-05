/**
 * ActivityTimelineWidget.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MEMOMES CLOUD — LIVE ACTIVITY & ACCESS LOG WIDGET
 *
 * Reads real-time events from auditLogger and auto-refreshes on every new event.
 * ZERO hardcoded sample data.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Clock, ArrowUpRight, Eye, ShieldAlert, Upload, Sparkles, Download,
  Share2, Edit3, FolderInput, Trash2, CheckCircle2, Lock, FileText,
  Film, Music, Archive, Code, File
} from 'lucide-react';
import { auditLogger, type AuditLogEntry } from '../utils/auditLogger';

interface ActivityTimelineWidgetProps {
  onOpenActivityPage?: () => void;
}

export const ActivityTimelineWidget: React.FC<ActivityTimelineWidgetProps> = ({
  onOpenActivityPage
}) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    // Load existing audit logs
    const loadLogs = () => {
      setLogs(auditLogger.getAuditLogs());
    };
    loadLogs();

    // Auto-refresh via real-time subscription
    const unsubscribe = auditLogger.subscribe(() => {
      loadLogs();
    });

    return unsubscribe;
  }, []);

  const getEventIcon = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('PREVIEW') || act.includes('VIEW')) return Eye;
    if (act.includes('UPLOAD')) return Upload;
    if (act.includes('DOWNLOAD')) return Download;
    if (act.includes('SHARE')) return Share2;
    if (act.includes('RENAME')) return Edit3;
    if (act.includes('MOVE')) return FolderInput;
    if (act.includes('DELETE') || act.includes('TRASH')) return Trash2;
    if (act.includes('DENIED') || act.includes('BLOCKED') || act.includes('FAILED')) return ShieldAlert;
    if (act.includes('AI') || act.includes('INDEX')) return Sparkles;
    if (act.includes('ENCRYPT') || act.includes('DECRYPT')) return Lock;
    return CheckCircle2;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'document': return <FileText className="w-3 h-3 text-[#F5B700]" />;
      case 'image': return <FileText className="w-3 h-3 text-emerald-400" />;
      case 'video': return <Film className="w-3 h-3 text-purple-400" />;
      case 'audio': return <Music className="w-3 h-3 text-pink-400" />;
      case 'archive': return <Archive className="w-3 h-3 text-orange-400" />;
      case 'sourcecode': return <Code className="w-3 h-3 text-cyan-400" />;
      default: return <File className="w-3 h-3 text-slate-400" />;
    }
  };

  const getEventBadgeColor = (action: string, status?: string) => {
    if (status === 'FAILED' || action.includes('BLOCKED') || action.includes('DENIED')) {
      return 'text-red-400 bg-red-500/10 border-red-500/20';
    }
    if (action.includes('UPLOAD')) return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (action.includes('SHARE')) return 'text-[#F5B700] bg-amber-500/10 border-amber-500/20';
    if (action.includes('PREVIEW') || action.includes('VIEW')) return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (action.includes('AI')) return 'text-purple-400 bg-purple-500/10 border-purple-500/20';
    return 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
  };

  const formatTimeAgo = (isoString: string) => {
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / 60000);
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      return `${Math.floor(diffHours / 24)}d ago`;
    } catch {
      return 'Recent';
    }
  };

  const displayLogs = logs.slice(0, 5);

  return (
    <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-5 md:p-6 shadow-xl space-y-4 font-sans select-none">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#F5B700] animate-pulse" />
          <h3 className="text-sm font-bold text-white">Live Activity & Access Log</h3>
        </div>
        <button
          onClick={onOpenActivityPage}
          className="text-xs text-[#F5B700] hover:underline font-semibold flex items-center gap-1 font-mono"
        >
          <span>Full Audit Log ({logs.length})</span>
          <ArrowUpRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {displayLogs.length === 0 ? (
        <div className="p-6 text-center text-xs text-slate-400 font-mono space-y-2">
          <Clock className="w-8 h-8 text-amber-400/40 mx-auto" />
          <p>No activity logged yet.</p>
          <p className="text-[10px] text-slate-500">File uploads, previews, and share events will appear here in real-time.</p>
        </div>
      ) : (
        <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
          {displayLogs.map((log) => {
            const Icon = getEventIcon(log.action);
            const badgeColor = getEventBadgeColor(log.action, log.status);

            return (
              <div key={log.id} className="relative pl-9 flex items-start justify-between text-xs">
                {/* Timeline Marker Icon */}
                <div className={`absolute left-0 top-0.5 p-1.5 rounded-xl border ${badgeColor} shadow-sm`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>

                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white">{log.action.replace(/_/g, ' ')}</span>
                    <span className="text-[10px] font-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded border border-white/10 uppercase">
                      {log.fileType || 'FILE'}
                    </span>
                  </div>
                  <p className="text-slate-300 font-mono text-[11px] flex items-center gap-1.5">
                    {getCategoryIcon(log.category)}
                    <span className="truncate max-w-[200px]" title={log.fileName || log.details}>{log.fileName || log.details}</span>
                  </p>
                </div>

                <div className="text-right shrink-0 font-mono">
                  <span className="text-[11px] text-slate-300 block">{formatTimeAgo(log.timestamp)}</span>
                  <span className="text-[10px] text-slate-500 block">{log.device || 'Desktop'}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
