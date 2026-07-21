import React from 'react';
import { Share2, ShieldAlert, Eye } from 'lucide-react';

const sentShares = [
  { id: 1, name: 'Passport_Scan_2026.pdf', recipient: 'rahul@example.com', tier: 'VIEW_ONLY', views: 3, status: 'Active', expiry: '60s Presigned' },
  { id: 2, name: 'Family_Goa_2026.mp4', recipient: 'priya@example.com', tier: 'READ_DOWNLOAD', views: 1, status: 'Active', expiry: 'Burn-on-Read' },
  { id: 3, name: 'Old_Backup_2024.zip', recipient: 'amit@company.com', tier: 'VIEW_ONLY', views: 0, status: 'Revoked', expiry: 'Expired' },
];

export const SharedByMePage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
        <Share2 className="w-5 h-5 text-accent-gold" /> Shared By Me
      </h2>
      <p className="text-xs text-gray-400 mt-1">Files you have shared. You can revoke access instantly at any time.</p>
    </div>

    <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
      <table className="w-full text-xs text-left">
        <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
          <tr>
            <th className="p-3.5">File</th>
            <th className="p-3.5">Recipient</th>
            <th className="p-3.5">Access Tier</th>
            <th className="p-3.5">Expiry</th>
            <th className="p-3.5">Views</th>
            <th className="p-3.5">Status</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke-default">
          {sentShares.map(f => (
            <tr key={f.id} className="hover:bg-surface-card transition">
              <td className="p-3.5 font-semibold text-gray-200">{f.name}</td>
              <td className="p-3.5 text-gray-400 font-mono">{f.recipient}</td>
              <td className="p-3.5"><span className="px-2 py-0.5 bg-surface text-accent-gold border border-stroke-default rounded-full text-[10px] font-bold">{f.tier}</span></td>
              <td className="p-3.5 text-gray-400">{f.expiry}</td>
              <td className="p-3.5 text-gray-300"><Eye className="inline w-3 h-3 mr-1 text-accent-blue" />{f.views}</td>
              <td className="p-3.5">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${f.status === 'Active' ? 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30' : 'bg-red-950/40 text-red-400 border-red-500/30'}`}>
                  {f.status}
                </span>
              </td>
              <td className="p-3.5 text-right">
                {f.status === 'Active' && (
                  <button className="text-red-400 hover:text-red-300 text-[11px] font-bold flex items-center gap-1 ml-auto transition">
                    <ShieldAlert className="w-3.5 h-3.5" /> Revoke
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
