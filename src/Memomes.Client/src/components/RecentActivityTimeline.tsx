import React, { useState, useEffect } from 'react';
import { Eye, Share2, ShieldX, Download, KeyRound, Clock, Trash2, FileText } from 'lucide-react';
import { auditLogger, type AuditLogEntry } from '../utils/auditLogger';

export const RecentActivityTimeline: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    const loadLogs = () => {
      setLogs(auditLogger.getAuditLogs());
    };
    loadLogs();

    const unsubscribe = auditLogger.subscribe(() => {
      loadLogs();
    });

    return unsubscribe;
  }, []);

  const getIcon = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('PREVIEW') || act.includes('VIEW')) return Eye;
    if (act.includes('SHARE')) return Share2;
    if (act.includes('DOWNLOAD')) return Download;
    if (act.includes('LOGIN')) return KeyRound;
    if (act.includes('DELETE') || act.includes('TRASH')) return Trash2;
    return ShieldX;
  };

  const getColor = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('SHARE')) return 'text-accent-blue bg-blue-500/10';
    if (act.includes('DOWNLOAD')) return 'text-emerald-400 bg-emerald-500/10';
    if (act.includes('PREVIEW') || act.includes('VIEW')) return 'text-accent-gold bg-amber-500/10';
    if (act.includes('DELETE')) return 'text-gray-400 bg-gray-500/10';
    return 'text-purple-400 bg-purple-500/10';
  };

  const formatTime = (iso: string) => {
    try {
      const diffMs = Date.now() - new Date(iso).getTime();
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

  const displayLogs = logs.slice(0, 6);

  return (
    <div className="glass-card rounded-2xl p-6 border border-stroke-default select-none font-sans">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-gold" /> Recent Audit Activity
        </h3>
        <span className="text-xs text-gray-400 font-mono">Real-Time Event Stream ({logs.length})</span>
      </div>

      {displayLogs.length === 0 ? (
        <div className="p-6 text-center text-xs text-gray-400 font-mono space-y-1">
          <FileText className="w-6 h-6 text-accent-gold/40 mx-auto mb-1" />
          <p>No audit activity recorded.</p>
        </div>
      ) : (
        <div className="space-y-3.5 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stroke-default">
          {displayLogs.map((act) => {
            const Icon = getIcon(act.action);
            const color = getColor(act.action);

            return (
              <div key={act.id} className="flex items-start space-x-3 relative pl-1">
                <div className={`w-7 h-7 rounded-lg ${color} border border-stroke-default flex items-center justify-center shrink-0 z-10`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div className="flex-1 flex justify-between items-center text-xs">
                  <div>
                    <p className="font-semibold text-gray-200">{act.action.replace(/_/g, ' ')}</p>
                    <p className="text-[11px] text-gray-400 font-mono truncate max-w-[200px]" title={act.fileName || act.details}>
                      {act.fileName || act.details}
                    </p>
                  </div>
                  <span className="text-[10px] text-gray-500 font-mono shrink-0">{formatTime(act.timestamp)}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
