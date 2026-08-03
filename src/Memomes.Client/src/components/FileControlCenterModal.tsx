import React, { useState } from 'react';
import {
  ShieldAlert, ShieldCheck, Eye, Download, Users, Clock, Flame, BarChart2,
  FileText, X, KeyRound, Check, Copy, ExternalLink, Plus, MoreVertical, Shield
} from 'lucide-react';
import type { FileItem } from './DashboardV2';

interface FileControlCenterModalProps {
  file: FileItem;
  onClose: () => void;
  onRevokeAllShares?: () => void;
  onOpenShareModal?: () => void;
}

export const FileControlCenterModal: React.FC<FileControlCenterModalProps> = ({
  file,
  onClose,
  onRevokeAllShares,
  onOpenShareModal
}) => {
  const [activeTab, setActiveTab] = useState<'SHARES' | 'PERMISSIONS' | 'ANALYTICS' | 'AUDIT'>('SHARES');
  const [statusFeedback, setStatusFeedback] = useState<string | null>(null);
  
  const [sharesList, setSharesList] = useState([
    {
      id: 's1',
      recipient: 'rahu@example.com',
      initials: 'RN',
      tier: 'VIEW ONLY',
      passwordProtected: true,
      expiry: 'Expires in 60s',
      views: 12,
      downloads: 0,
      location: 'India',
      permissionsTitle: 'View Only',
      permissionsSub: 'Can view but cannot download',
      accessed: 'Today, 10:32 AM',
      status: 'Active'
    },
    {
      id: 's2',
      recipient: 'priya@example.com',
      initials: 'PS',
      tier: 'READ & DOWNLOAD',
      passwordProtected: true,
      expiry: 'Expires in 24h',
      views: 3,
      downloads: 1,
      location: 'India',
      permissionsTitle: 'Read & Download',
      permissionsSub: 'Can view and download',
      accessed: 'Yesterday, 04:45 PM',
      status: 'Active'
    },
  ]);

  const [disableDownloads, setDisableDownloads] = useState(true);
  const [selfDestructEnabled, setSelfDestructEnabled] = useState(false);

  const showFeedback = (msg: string) => {
    setStatusFeedback(msg);
    setTimeout(() => setStatusFeedback(null), 3000);
  };

  const handleCopyEmail = (email: string) => {
    try {
      navigator.clipboard.writeText(email);
      showFeedback(`Copied email: ${email}`);
    } catch {
      showFeedback(`Email selected: ${email}`);
    }
  };

  const handleRevokeShare = (id: string) => {
    setSharesList(prev => prev.filter(s => s.id !== id));
    showFeedback('Recipient access key revoked instantly.');
  };

  const handleRevokeAll = () => {
    setSharesList([]);
    if (onRevokeAllShares) onRevokeAllShares();
    showFeedback('All recipient access keys revoked permanently.');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-4xl bg-[#0E1524] rounded-3xl border border-[#F5C027]/30 p-6 md:p-8 space-y-6 shadow-2xl relative max-h-[92vh] overflow-y-auto font-sans">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-6 top-6 p-2 text-[#94A3B8] hover:text-white rounded-xl bg-white/[0.06] hover:bg-white/[0.12] transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Feedback Banner */}
        {statusFeedback && (
          <div className="p-3 bg-[#22C55E]/15 border border-[#22C55E]/40 text-[#22C55E] text-xs font-mono rounded-xl flex items-center gap-2">
            <Check className="w-4 h-4 text-[#22C55E]" /> {statusFeedback}
          </div>
        )}

        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#F5C027]/20 to-[#F5C027]/5 border border-[#F5C027]/50 flex items-center justify-center text-[#F5C027] shadow-lg shadow-[#F5C027]/10">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div>
              <h2 className="text-xl md:text-2xl font-black text-white font-heading tracking-tight">File Control Center</h2>
              <p className="text-xs text-[#CBD5E1] font-mono mt-0.5">
                <span className="text-[#F5C027] font-bold">"Stay in Control After Sharing"</span> · {file.name || 'Family Trip Goa 2024.jpg'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-3.5 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold font-mono flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#22C55E] animate-pulse" />
              {sharesList.length} Active Shares
            </span>
          </div>
        </div>

        {/* Navigation Tabs (Matching Reference Screenshot) */}
        <div className="flex border-b border-white/10 space-x-4 text-xs font-bold overflow-x-auto pb-0.5">
          {[
            { id: 'SHARES', label: 'Active Shares', icon: Users },
            { id: 'PERMISSIONS', label: 'Access Policies', icon: KeyRound },
            { id: 'ANALYTICS', label: 'Real-time Analytics', icon: BarChart2 },
            { id: 'AUDIT', label: 'Audit Log', icon: FileText },
          ].map(tab => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 border-b-2 transition whitespace-nowrap ${
                  isSelected
                    ? 'border-[#F5C027] text-[#F5C027] bg-[#F5C027]/5 font-extrabold'
                    : 'border-transparent text-[#94A3B8] hover:text-white'
                }`}
              >
                <Icon className={`w-4 h-4 ${isSelected ? 'text-[#F5C027]' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* TAB 1: ACTIVE SHARES & RECIPIENT ACCESS ENVELOPES */}
        {activeTab === 'SHARES' && (
          <div className="space-y-6">
            
            {/* Metric Summary Cards Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              
              <div className="p-4 rounded-2xl bg-[#070B14] border border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-[#F5C027]/15 border border-[#F5C027]/30 flex items-center justify-center text-[#F5C027]">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">Active Shares</div>
                  <div className="text-xl font-black text-white font-mono">{sharesList.length}</div>
                  <div className="text-[9px] text-[#94A3B8]">Currently active</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070B14] border border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#22C55E]/15 border border-[#22C55E]/30 flex items-center justify-center text-[#22C55E]">
                  <Eye className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">Total Views</div>
                  <div className="text-xl font-black font-mono text-[#22C55E]">15</div>
                  <div className="text-[9px] text-[#94A3B8]">Across all shares</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070B14] border border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#3B82F6]/15 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6]">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">Downloads</div>
                  <div className="text-xl font-black font-mono text-[#3B82F6]">1</div>
                  <div className="text-[9px] text-[#94A3B8]">Total downloads</div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-[#070B14] border border-white/[0.06] flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F5C027]/15 border border-[#F5C027]/30 flex items-center justify-center text-[#F5C027]">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[10px] text-[#94A3B8] font-mono">Expiring Soon</div>
                  <div className="text-xl font-black font-mono text-[#F5C027]">1</div>
                  <div className="text-[9px] text-[#94A3B8]">Within 24 hours</div>
                </div>
              </div>

            </div>

            {/* Recipient Access Envelopes Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs font-extrabold text-white font-heading flex items-center gap-1.5">
                Recipient Access Envelopes <span className="text-[#94A3B8] font-normal font-sans">ℹ️</span>
              </div>

              {sharesList.length > 0 && (
                <button
                  onClick={handleRevokeAll}
                  className="px-3.5 py-1.5 rounded-xl bg-[#070B14] border border-[#F5C027]/40 hover:border-[#F5C027] text-[#F5C027] text-xs font-bold transition flex items-center gap-2"
                >
                  <ShieldAlert className="w-4 h-4 text-[#F5C027]" /> Revoke All Access Keys
                </button>
              )}
            </div>

            {/* Recipient Cards List (Matching Reference Screenshot) */}
            {sharesList.length === 0 ? (
              <div className="p-8 bg-[#070B14] rounded-2xl border border-white/10 text-center text-xs text-[#94A3B8] space-y-2">
                <ShieldCheck className="w-8 h-8 text-[#94A3B8] mx-auto" />
                <div className="font-bold text-white">No active recipient shares</div>
                <div>All access keys have been permanently revoked from recipient devices.</div>
              </div>
            ) : (
              <div className="space-y-4">
                {sharesList.map((share) => (
                  <div key={share.id} className="p-5 rounded-2xl bg-[#070B14] border border-white/[0.06] hover:border-[#F5C027]/40 transition space-y-4">
                    
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      
                      {/* Left: Avatar & Recipient Details */}
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-[#F5C027]/20 border-2 border-[#F5C027] flex items-center justify-center text-[#F5C027] font-black text-sm shadow-md">
                            {share.initials}
                          </div>
                          <span className="w-3.5 h-3.5 rounded-full bg-[#22C55E] border-2 border-[#070B14] absolute bottom-0 right-0" />
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white text-sm font-mono">{share.recipient}</span>
                            <button 
                              onClick={() => handleCopyEmail(share.recipient)} 
                              className="text-[#94A3B8] hover:text-[#F5C027] transition"
                              title="Copy Email"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono">
                            <span className="px-2 py-0.5 rounded bg-[#F5C027]/15 border border-[#F5C027]/30 text-[#F5C027] font-bold">
                              {share.tier}
                            </span>
                            {share.passwordProtected && (
                              <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[#CBD5E1]">
                                🔒 Password Protected
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[#CBD5E1]">
                              ⏳ {share.expiry}
                            </span>
                            {share.downloads > 0 && (
                              <span className="px-2 py-0.5 rounded bg-[#3B82F6]/15 text-[#3B82F6]">
                                📥 Downloads: {share.downloads}
                              </span>
                            )}
                            <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[#CBD5E1]">
                              👁️ Views: {share.views}
                            </span>
                            <span className="px-2 py-0.5 rounded bg-white/[0.06] text-[#CBD5E1]">
                              📍 {share.location}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Middle: Permissions Column */}
                      <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/[0.06] pt-3 md:pt-0 md:pl-6 text-xs">
                        <div className="text-[10px] text-[#94A3B8] font-mono font-bold uppercase">Permissions</div>
                        <div className="font-bold text-white flex items-center gap-1.5">
                          {share.tier.includes('DOWNLOAD') ? <Download className="w-4 h-4 text-[#3B82F6]" /> : <Eye className="w-4 h-4 text-[#F5C027]" />}
                          {share.permissionsTitle}
                        </div>
                        <div className="text-[10px] text-[#94A3B8]">{share.permissionsSub}</div>
                      </div>

                      {/* Right: Accessed Column & Revoke Action */}
                      <div className="space-y-1 border-t md:border-t-0 md:border-l border-white/[0.06] pt-3 md:pt-0 md:pl-6 text-xs">
                        <div className="text-[10px] text-[#94A3B8] font-mono font-bold uppercase">Accessed</div>
                        <div className="text-xs text-[#CBD5E1] font-mono">📅 {share.accessed}</div>
                        <div className="text-[10px] font-mono font-bold text-[#22C55E]">🟢 {share.status}</div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-2 pt-2 md:pt-0 justify-end">
                        <button
                          onClick={() => handleRevokeShare(share.id)}
                          className="px-4 py-2 bg-[#070B14] hover:bg-red-950/60 text-[#F5C027] hover:text-[#EF4444] border border-[#F5C027]/40 hover:border-[#EF4444]/40 font-bold rounded-xl text-xs transition"
                        >
                          Revoke
                        </button>
                        <button className="p-2 text-[#94A3B8] hover:text-white rounded-xl bg-white/[0.06]">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </div>

                    </div>

                  </div>
                ))}
              </div>
            )}

            {/* Bottom Share with More People Action Box */}
            <div className="p-5 rounded-2xl bg-[#070B14] border border-dashed border-[#F5C027]/40 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-[#0E1524] border border-white/10 flex items-center justify-center text-[#F5C027]">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Share with more people</div>
                  <div className="text-[11px] text-[#94A3B8]">Add people, set permissions, and maintain full control</div>
                </div>
              </div>

              <button 
                onClick={() => { onClose(); if (onOpenShareModal) onOpenShareModal(); }}
                className="btn-gold text-xs h-10 px-5 font-extrabold flex items-center justify-center gap-2"
              >
                Share New Link +
              </button>
            </div>

            {/* Bottom Security Control Banner */}
            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#F5C027]/15 border border-[#F5C027]/30 flex items-center justify-center text-[#F5C027]">
                  <Shield className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-xs font-extrabold text-[#F5C027]">You're in Control</div>
                  <div className="text-[10px] text-[#94A3B8]">You can revoke access anytime. Recipients will lose access immediately.</div>
                </div>
              </div>

              <button className="px-4 py-2 rounded-xl bg-[#0E1524] border border-white/10 text-xs font-bold text-white hover:border-[#F5C027] transition flex items-center gap-1">
                Learn More <ExternalLink className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>
        )}

        {/* TAB 2: ACCESS POLICIES */}
        {activeTab === 'PERMISSIONS' && (
          <div className="space-y-4 text-xs">
            <div className="p-5 bg-[#070B14] rounded-2xl border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="font-bold text-white text-sm">Disable Payload Downloads</div>
                <div className="text-xs text-[#94A3B8] mt-0.5">Force View-Only watermarked media stream</div>
              </div>
              <input
                type="checkbox"
                checked={disableDownloads}
                onChange={(e) => {
                  setDisableDownloads(e.target.checked);
                  showFeedback(`Downloads ${e.target.checked ? 'disabled' : 'enabled'} for active links.`);
                }}
                className="w-5 h-5 accent-[#F5C027]"
              />
            </div>

            <div className="p-5 bg-[#070B14] rounded-2xl border border-white/[0.06] flex items-center justify-between">
              <div>
                <div className="font-bold text-[#F5C027] text-sm flex items-center gap-1.5">
                  <Flame className="w-4 h-4" /> Burn-on-Read Self-Destruct
                </div>
                <div className="text-xs text-[#94A3B8] mt-0.5">Purge encryption envelope after first view</div>
              </div>
              <input
                type="checkbox"
                checked={selfDestructEnabled}
                onChange={(e) => {
                  setSelfDestructEnabled(e.target.checked);
                  showFeedback(`Self-Destruct ${e.target.checked ? 'activated' : 'deactivated'}.`);
                }}
                className="w-5 h-5 accent-[#F5C027]"
              />
            </div>
          </div>
        )}

        {/* TAB 3: REAL-TIME ANALYTICS */}
        {activeTab === 'ANALYTICS' && (
          <div className="space-y-4 text-xs">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-5 bg-[#070B14] rounded-2xl border border-white/[0.06] text-center">
                <Eye className="w-6 h-6 text-[#F5C027] mx-auto mb-2" />
                <div className="text-3xl font-black text-white font-mono">15</div>
                <div className="text-xs text-[#94A3B8] font-mono mt-1">Total Views</div>
              </div>
              <div className="p-5 bg-[#070B14] rounded-2xl border border-white/[0.06] text-center">
                <Download className="w-6 h-6 text-[#3B82F6] mx-auto mb-2" />
                <div className="text-3xl font-black text-white font-mono">1</div>
                <div className="text-xs text-[#94A3B8] font-mono mt-1">Total Downloads</div>
              </div>
              <div className="p-5 bg-[#070B14] rounded-2xl border border-white/[0.06] text-center">
                <ShieldAlert className="w-6 h-6 text-[#22C55E] mx-auto mb-2" />
                <div className="text-3xl font-black text-white font-mono">0</div>
                <div className="text-xs text-[#94A3B8] font-mono mt-1">Blocked Violations</div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: AUDIT LOGS */}
        {activeTab === 'AUDIT' && (
          <div className="space-y-3 text-xs">
            <div className="p-5 bg-[#070B14] rounded-2xl border border-white/[0.06] font-mono text-xs space-y-3 max-h-56 overflow-y-auto">
              <div className="text-[#22C55E]">[2026-07-30 18:43:02] FILE_VIEWED by rahu@example.com (IP: 103.21.124.5 - India)</div>
              <div className="text-[#3B82F6]">[2026-07-30 16:12:38] FILE_DOWNLOADED by priya@example.com (IP: 110.93.4.12 - India)</div>
              <div className="text-[#F5C027]">[2026-07-30 14:00:00] SHARE_CREATED with View Only Policy</div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
