import React, { useState } from 'react';
import { 
  Lock, 
  Download, 
  RefreshCw, 
  ShieldAlert
} from 'lucide-react';

export const ControlCenterPage: React.FC = () => {
  const [activeShares, setActiveShares] = useState([
    {
      id: 'share-1',
      fileName: 'Tax_Return_Form_1040_2025.pdf',
      recipient: 'investors@acme.com',
      created: '2026-08-01',
      expires: 'In 3 days',
      views: 14,
      downloadAllowed: false,
      watermarkEnabled: true,
      status: 'Active'
    },
    {
      id: 'share-2',
      fileName: 'Passport_Scan_Official.pdf',
      recipient: 'legal@lawfirm.com',
      created: '2026-07-29',
      expires: 'Burn-on-Read',
      views: 1,
      downloadAllowed: false,
      watermarkEnabled: true,
      status: 'Active'
    },
    {
      id: 'share-3',
      fileName: 'Q3_Financial_Audit_2025.pdf',
      recipient: 'audit@kpmg-demo.com',
      created: '2026-07-15',
      expires: 'Expired',
      views: 45,
      downloadAllowed: true,
      watermarkEnabled: false,
      status: 'Revoked'
    }
  ]);

  const toggleDownload = (id: string) => {
    setActiveShares((prev) =>
      prev.map((s) => (s.id === id ? { ...s, downloadAllowed: !s.downloadAllowed } : s))
    );
  };

  const revokeShare = (id: string) => {
    setActiveShares((prev) =>
      prev.map((s) => (s.id === id ? { ...s, status: 'Revoked' } : s))
    );
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto p-2 md:p-4">
      {/* Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#F5B700]">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
              <span>Security Control Center</span>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                100% Protection Active
              </span>
            </h1>
            <p className="text-xs text-slate-400">Manage, inspect, and instantly revoke permissions on your shared files.</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button className="px-3.5 py-2 rounded-xl bg-slate-800 border border-white/10 text-xs font-semibold text-slate-200 hover:text-white transition-all flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh Logs
          </button>
        </div>
      </div>

      {/* Share Links Management Table */}
      <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-5 shadow-2xl space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Lock className="w-4 h-4 text-[#F5B700]" /> Active Shared File Links
          </h3>
          <span className="text-xs text-slate-400 font-mono">
            {activeShares.filter((s) => s.status === 'Active').length} Active
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase font-mono text-[10px]">
                <th className="pb-3 font-semibold">Shared File</th>
                <th className="pb-3 font-semibold">Recipient / Link</th>
                <th className="pb-3 font-semibold">Views</th>
                <th className="pb-3 font-semibold">Download Policy</th>
                <th className="pb-3 font-semibold">Expiration</th>
                <th className="pb-3 font-semibold text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeShares.map((share) => (
                <tr key={share.id} className="hover:bg-slate-900/50 transition-colors">
                  <td className="py-3.5 font-medium text-white flex items-center gap-2">
                    <span className="p-1.5 rounded-lg bg-amber-500/10 text-[#F5B700]">
                      <Lock className="w-3.5 h-3.5" />
                    </span>
                    <span className="truncate max-w-[180px]">{share.fileName}</span>
                  </td>
                  <td className="py-3.5 text-slate-300 font-mono">{share.recipient}</td>
                  <td className="py-3.5 text-slate-300 font-mono">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 border border-white/5 text-amber-400">
                      {share.views} views
                    </span>
                  </td>
                  <td className="py-3.5">
                    <button
                      onClick={() => toggleDownload(share.id)}
                      className={`px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all ${
                        share.downloadAllowed
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      <Download className="w-3 h-3" />
                      <span>{share.downloadAllowed ? 'Allowed' : 'Disabled'}</span>
                    </button>
                  </td>
                  <td className="py-3.5 text-slate-400 font-mono text-[11px]">
                    {share.expires}
                  </td>
                  <td className="py-3.5 text-right">
                    {share.status === 'Active' ? (
                      <button
                        onClick={() => revokeShare(share.id)}
                        className="px-3 py-1 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500 hover:text-white text-xs font-semibold transition-all"
                      >
                        Revoke Access
                      </button>
                    ) : (
                      <span className="text-slate-500 font-mono italic">Revoked</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
