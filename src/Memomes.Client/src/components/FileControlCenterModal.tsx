import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Eye, Download, Users, Clock, Flame, BarChart2,
  FileText, X, KeyRound, DownloadCloud
} from 'lucide-react';
import type { FileItem } from './DashboardV2';

interface FileControlCenterModalProps {
  file: FileItem;
  onClose: () => void;
  onRevokeAllShares?: () => void;
}

export const FileControlCenterModal: React.FC<FileControlCenterModalProps> = ({
  file,
  onClose,
  onRevokeAllShares
}) => {
  const [activeTab, setActiveTab] = useState<'SHARES' | 'PERMISSIONS' | 'ANALYTICS' | 'AUDIT'>('SHARES');
  
  const [sharesList, setSharesList] = useState([
    { id: 's1', recipient: 'rahul@example.com', tier: 'VIEW_ONLY', expiry: '60s Presigned', views: 12, downloads: 0, status: 'Active', created: '2026-07-21' },
    { id: 's2', recipient: 'priya@example.com', tier: 'READ_DOWNLOAD', expiry: '24 Hours', views: 3, downloads: 1, status: 'Active', created: '2026-07-20' },
  ]);

  const [disableDownloads, setDisableDownloads] = useState(true);
  const [selfDestructEnabled, setSelfDestructEnabled] = useState(false);

  const handleRevokeShare = (id: string) => {
    setSharesList(prev => prev.filter(s => s.id !== id));
  };

  const handleRevokeAll = () => {
    setSharesList([]);
    if (onRevokeAllShares) onRevokeAllShares();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl glass-card rounded-2xl border border-stroke-default p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-card transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header with File Info & Core Promise Banner */}
        <div className="flex items-center justify-between border-b border-stroke-default pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5 text-accent-gold" />
            </div>
            <div>
              <h3 className="font-extrabold text-white text-base">File Control Center</h3>
              <p className="text-xs text-accent-gold font-mono flex items-center gap-1">
                "Stay in Control After Sharing" · {file.fileNameEncrypted}
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            {sharesList.length} Active Shares
          </span>
        </div>

        {/* Tab Bar */}
        <div className="flex border-b border-stroke-default space-x-2 text-xs">
          {[
            { id: 'SHARES', label: 'Active Shares', icon: Users },
            { id: 'PERMISSIONS', label: 'Access Policies', icon: KeyRound },
            { id: 'ANALYTICS', label: 'Real-time Analytics', icon: BarChart2 },
            { id: 'AUDIT', label: 'CERT-In Audit Log', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-1.5 px-3 py-2 border-b-2 font-bold transition ${
                  isSelected
                    ? 'border-accent-gold text-accent-gold'
                    : 'border-transparent text-gray-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {tab.label}
              </button>
            );
          })}
        </div>

        {/* Tab 1: Active Shares Management */}
        {activeTab === 'SHARES' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400 font-mono">Recipient Access Envelopes</span>
              {sharesList.length > 0 && (
                <button
                  onClick={handleRevokeAll}
                  className="px-3 py-1 bg-red-950/40 border border-red-500/30 text-red-400 font-bold rounded-lg hover:bg-red-950/60 transition flex items-center gap-1"
                >
                  <ShieldAlert className="w-3.5 h-3.5" /> Revoke All Access Keys
                </button>
              )}
            </div>

            {sharesList.length === 0 ? (
              <div className="p-8 bg-surface rounded-xl border border-stroke-default text-center text-xs text-gray-400">
                No active recipient shares. Access keys are completely revoked.
              </div>
            ) : (
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {sharesList.map(share => (
                  <div key={share.id} className="p-3 bg-surface rounded-xl border border-stroke-default flex items-center justify-between text-xs">
                    <div>
                      <div className="font-bold text-gray-200 font-mono">{share.recipient}</div>
                      <div className="text-[10px] text-gray-400 flex items-center gap-2 mt-0.5">
                        <span className="text-accent-gold">{share.tier}</span>
                        <span>· Expiry: {share.expiry}</span>
                        <span>· Views: {share.views}</span>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRevokeShare(share.id)}
                      className="px-2.5 py-1 bg-red-950/40 text-red-400 hover:bg-red-950/70 border border-red-500/30 font-bold rounded-lg transition"
                    >
                      Revoke
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Access Policies */}
        {activeTab === 'PERMISSIONS' && (
          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-surface rounded-xl border border-stroke-default flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-200">Disable Payload Downloads</div>
                <div className="text-[10px] text-gray-500">Force View-Only watermarked media stream</div>
              </div>
              <input
                type="checkbox"
                checked={disableDownloads}
                onChange={(e) => setDisableDownloads(e.target.checked)}
                className="rounded border-stroke-default accent-primary w-4 h-4"
              />
            </div>

            <div className="p-3.5 bg-surface rounded-xl border border-stroke-default flex items-center justify-between">
              <div>
                <div className="font-bold text-orange-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Burn-on-Read Self-Destruct
                </div>
                <div className="text-[10px] text-gray-500">Purge encryption envelope after first view</div>
              </div>
              <input
                type="checkbox"
                checked={selfDestructEnabled}
                onChange={(e) => setSelfDestructEnabled(e.target.checked)}
                className="rounded border-stroke-default accent-orange-500 w-4 h-4"
              />
            </div>

            <div className="p-3.5 bg-surface rounded-xl border border-stroke-default flex items-center justify-between">
              <div>
                <div className="font-bold text-accent-blue flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Extend Share Timer
                </div>
                <div className="text-[10px] text-gray-500">Add time to active presigned URLs</div>
              </div>
              <button
                onClick={() => alert('Extended active share timers by +24 hours.')}
                className="px-3 py-1.5 bg-surface-card border border-stroke-default text-accent-gold font-bold rounded-lg hover:bg-surface-hover transition"
              >
                +24 Hours
              </button>
            </div>
          </div>
        )}

        {/* Tab 3: Real-time Analytics */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-surface rounded-xl border border-stroke-default text-center">
                <Eye className="w-4 h-4 text-accent-gold mx-auto mb-1" />
                <div className="text-xl font-extrabold text-white">15</div>
                <div className="text-[10px] text-gray-400">Total Views</div>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-stroke-default text-center">
                <Download className="w-4 h-4 text-emerald-400 mx-auto mb-1" />
                <div className="text-xl font-extrabold text-white">1</div>
                <div className="text-[10px] text-gray-400">Total Downloads</div>
              </div>
              <div className="p-3 bg-surface rounded-xl border border-stroke-default text-center">
                <ShieldAlert className="w-4 h-4 text-red-400 mx-auto mb-1" />
                <div className="text-xl font-extrabold text-white">0</div>
                <div className="text-[10px] text-gray-400">Unauthorized Attempts</div>
              </div>
            </div>

            <div className="p-3 bg-surface rounded-xl border border-stroke-default font-mono text-[11px] space-y-1">
              <div className="text-gray-400 font-bold">Last Access Location</div>
              <div className="text-gray-200">IP: 103.21.124.5 · Mumbai, Maharashtra</div>
              <div className="text-gray-500 text-[10px]">2026-07-21 18:43:02 UTC</div>
            </div>
          </div>
        )}

        {/* Tab 4: Audit Logs */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-3 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-mono">180-Day CERT-In Access Trail</span>
              <button
                onClick={() => alert('CERT-In Audit Log JSON exported.')}
                className="px-3 py-1 bg-surface-card border border-stroke-default text-accent-gold font-bold rounded-lg hover:bg-surface-hover transition flex items-center gap-1"
              >
                <DownloadCloud className="w-3.5 h-3.5" /> Export JSON
              </button>
            </div>
            <div className="p-3 bg-surface rounded-xl border border-stroke-default font-mono text-[10px] space-y-1.5 max-h-48 overflow-y-auto">
              <div className="text-emerald-400">[2026-07-21 18:43:02] FILE_VIEWED by rahul@example.com (IP: 103.21.124.5)</div>
              <div className="text-emerald-400">[2026-07-20 17:12:38] FILE_DOWNLOADED by priya@example.com (IP: 110.93.4.12)</div>
              <div className="text-accent-gold">[2026-07-19 14:00:00] SHARE_CREATED with View Only Policy</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
