/**
 * ActivityLogPage.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * MEMOMES CLOUD — UNIVERSAL ACTIVITY LOG PAGE
 *
 * Full audit log table connected directly to auditLogger in real-time.
 * Features:
 *   - Zero hardcoded sample entries
 *   - Category & Event Filter Tabs (All, Uploads, Downloads, Preview, Shares, Security, AI, Deleted, Restored, Version History)
 *   - Multi-field Search (Filename, Extension, User, Action, Date)
 *   - Export CSV capability
 *   - Auto-refresh via real-time subscription
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useEffect } from 'react';
import {
  Activity, Eye, Download, ShieldAlert, Upload, Share2, Sparkles,
  Search, Trash2, RotateCcw, History, FileText, Film, Music, Archive, Code, File
} from 'lucide-react';
import { auditLogger, type AuditLogEntry } from '../utils/auditLogger';

export const ActivityLogPage: React.FC = () => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [activeTab, setActiveTab] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

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

  const tabs = [
    { id: 'all', label: 'All Events' },
    { id: 'uploads', label: 'Uploads' },
    { id: 'downloads', label: 'Downloads' },
    { id: 'preview', label: 'Previews' },
    { id: 'shares', label: 'Shares' },
    { id: 'security', label: 'Security' },
    { id: 'ai', label: 'AI Events' },
    { id: 'deleted', label: 'Deleted' },
    { id: 'restored', label: 'Restored' },
    { id: 'history', label: 'Version History' }
  ];

  // Filter Logic
  const filteredLogs = logs.filter(log => {
    const act = (log.action || '').toUpperCase();

    // Tab Filter
    if (activeTab === 'uploads' && !act.includes('UPLOAD')) return false;
    if (activeTab === 'downloads' && !act.includes('DOWNLOAD')) return false;
    if (activeTab === 'preview' && !act.includes('PREVIEW') && !act.includes('VIEW')) return false;
    if (activeTab === 'shares' && !act.includes('SHARE')) return false;
    if (activeTab === 'security' && !act.includes('SECURITY') && !act.includes('BLOCKED') && !act.includes('DENIED') && !act.includes('PASSWORD') && !act.includes('ACCESS')) return false;
    if (activeTab === 'ai' && !act.includes('AI') && !act.includes('INDEX') && !act.includes('OCR')) return false;
    if (activeTab === 'deleted' && !act.includes('DELETE') && !act.includes('TRASH')) return false;
    if (activeTab === 'restored' && !act.includes('RESTORE') && !act.includes('UNDO')) return false;
    if (activeTab === 'history' && !act.includes('VERSION')) return false;

    // Search Filter (Filename, Extension, User, Action, Date)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchFile = (log.fileName || '').toLowerCase().includes(q);
      const matchType = (log.fileType || '').toLowerCase().includes(q);
      const matchUser = (log.user || '').toLowerCase().includes(q);
      const matchAction = (log.action || '').toLowerCase().includes(q);
      const matchDate = (log.timestamp || '').toLowerCase().includes(q);
      return matchFile || matchType || matchUser || matchAction || matchDate;
    }

    return true;
  });

  const getActionIcon = (action: string) => {
    const act = (action || '').toUpperCase();
    if (act.includes('UPLOAD')) return <Upload className="w-3.5 h-3.5 text-blue-400" />;
    if (act.includes('DOWNLOAD')) return <Download className="w-3.5 h-3.5 text-emerald-400" />;
    if (act.includes('PREVIEW') || act.includes('VIEW')) return <Eye className="w-3.5 h-3.5 text-amber-400" />;
    if (act.includes('SHARE')) return <Share2 className="w-3.5 h-3.5 text-cyan-400" />;
    if (act.includes('AI') || act.includes('OCR')) return <Sparkles className="w-3.5 h-3.5 text-purple-400" />;
    if (act.includes('DELETE') || act.includes('TRASH')) return <Trash2 className="w-3.5 h-3.5 text-red-400" />;
    if (act.includes('RESTORE')) return <RotateCcw className="w-3.5 h-3.5 text-emerald-400" />;
    if (act.includes('VERSION')) return <History className="w-3.5 h-3.5 text-amber-400" />;
    if (act.includes('DENIED') || act.includes('BLOCKED') || act.includes('FAILED')) return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
    return <Activity className="w-3.5 h-3.5 text-slate-400" />;
  };

  const getCategoryIcon = (category?: string) => {
    switch (category?.toLowerCase()) {
      case 'document': return <FileText className="w-4 h-4 text-amber-400" />;
      case 'image': return <FileText className="w-4 h-4 text-emerald-400" />;
      case 'video': return <Film className="w-4 h-4 text-purple-400" />;
      case 'audio': return <Music className="w-4 h-4 text-pink-400" />;
      case 'archive': return <Archive className="w-4 h-4 text-orange-400" />;
      case 'sourcecode': return <Code className="w-4 h-4 text-cyan-400" />;
      default: return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const exportCsvReport = () => {
    const headers = ['ID', 'Timestamp', 'Action', 'File Name', 'File Type', 'User', 'Device', 'Status'];
    const rows = filteredLogs.map(l => [
      l.id,
      l.timestamp,
      l.action,
      l.fileName || '',
      l.fileType || '',
      l.user,
      l.device || 'Desktop',
      l.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.map(c => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Memomes_Cloud_Audit_Report_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      {/* ── HEADER ──────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400 animate-pulse" /> Activity Audit Log Engine
          </h2>
          <p className="text-xs text-slate-400 mt-1 font-mono">
            180-day CERT-In compliant immutable audit trail • Powered by real-time event streaming ({filteredLogs.length} events)
          </p>
        </div>
        <button
          onClick={exportCsvReport}
          className="btn-gold !h-9 !px-4 !text-xs shadow-lg flex items-center gap-2 font-mono shrink-0"
        >
          <Download className="w-4 h-4" /> Export CSV Report
        </button>
      </div>

      {/* ── SEARCH & FILTER CONTROLS ────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row gap-3 items-center justify-between bg-[#0B1120] p-4 rounded-2xl border border-white/10">
        {/* Multi-Field Search Bar */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by filename, ext, user, action..."
            className="w-full bg-[#070C18] border border-white/10 rounded-xl pl-9 pr-4 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-400 font-mono"
          />
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 scrollbar-none font-mono text-xs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1.5 rounded-xl transition whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-amber-400 text-slate-950 font-bold shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── AUDIT LOG TABLE ─────────────────────────────────────────────────── */}
      <div className="glass-card rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        <table className="w-full text-xs text-left font-sans">
          <thead className="bg-[#0B1120] border-b border-white/10 text-slate-400 font-mono text-[11px]">
            <tr>
              <th className="p-3.5">Event Action</th>
              <th className="p-3.5">Target File</th>
              <th className="p-3.5">File Type</th>
              <th className="p-3.5">User & Device</th>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#070C18]">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400 font-mono">
                  No activity events found for the selected filter.
                </td>
              </tr>
            ) : (
              filteredLogs.map((evt) => (
                <tr key={evt.id} className="hover:bg-white/[0.02] transition">
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      {getActionIcon(evt.action)}
                      <span className="font-mono text-white font-bold">{evt.action.replace(/_/g, ' ')}</span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-2">
                      {getCategoryIcon(evt.category)}
                      <span className="text-slate-200 font-medium truncate max-w-[180px]" title={evt.fileName || evt.details}>
                        {evt.fileName || evt.details}
                      </span>
                    </div>
                  </td>
                  <td className="p-3.5">
                    <span className="px-2 py-0.5 rounded bg-slate-800 border border-white/10 font-mono text-[10px] text-amber-400 uppercase font-bold">
                      {evt.fileType || 'FILE'}
                    </span>
                  </td>
                  <td className="p-3.5 text-slate-300 font-mono text-[11px]">
                    <div>{evt.user}</div>
                    <div className="text-slate-500 text-[10px]">{evt.device || 'Desktop'}</div>
                  </td>
                  <td className="p-3.5 text-slate-400 font-mono text-[10px]">
                    {new Date(evt.timestamp).toLocaleString()}
                  </td>
                  <td className="p-3.5">
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border font-mono ${
                      evt.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                        : evt.status === 'WARNING'
                        ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                        : 'bg-red-500/10 text-red-400 border-red-500/30'
                    }`}>
                      {evt.status}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
