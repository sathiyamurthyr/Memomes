import React from 'react';
import { Shield, Eye, ExternalLink, Flame, Clock, Users } from 'lucide-react';

const shares = [
  { id: 1, fileName: 'Land_Deed_Registry.pdf', recipient: 'rahul@example.com', tier: 'VIEW_ONLY', expiry: '60s Presigned', views: 12, created: '2026-07-20' },
  { id: 2, fileName: 'Family_Goa_2026.mp4', recipient: 'priya@example.com', tier: 'READ_DOWNLOAD', expiry: 'Burn-on-Read', views: 3, created: '2026-07-19' },
  { id: 3, fileName: 'Encrypted_Backup.zip', recipient: 'amit@company.com', tier: 'VIEW_ONLY', expiry: '24 Hours', views: 0, created: '2026-07-18' },
];

export const SecureSharesPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-accent-gold" /> Secure Shares
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            All links enforce Zero-Knowledge 60s presigned URLs — unencrypted file bytes never leave your device.
          </p>
        </div>
        <button className="px-4 py-2 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition flex items-center gap-2">
          <ExternalLink className="w-3.5 h-3.5" /> Create New Share Link
        </button>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Active Links', value: '8', icon: ExternalLink, color: 'text-accent-blue' },
          { label: 'Total Views', value: '389', icon: Eye, color: 'text-accent-gold' },
          { label: 'Burned Links', value: '2', icon: Flame, color: 'text-orange-400' },
          { label: 'Recipients', value: '14', icon: Users, color: 'text-purple-400' },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="glass-card rounded-xl p-4 border border-stroke-default">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[11px] text-gray-400">{m.label}</span>
                <Icon className={`w-3.5 h-3.5 ${m.color}`} />
              </div>
              <span className="text-xl font-extrabold text-white">{m.value}</span>
            </div>
          );
        })}
      </div>

      {/* Shares Table */}
      <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
            <tr>
              <th className="p-3.5">File</th>
              <th className="p-3.5">Recipient</th>
              <th className="p-3.5">Access Tier</th>
              <th className="p-3.5">Expiry Policy</th>
              <th className="p-3.5">Views</th>
              <th className="p-3.5">Created</th>
              <th className="p-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke-default">
            {shares.map(share => (
              <tr key={share.id} className="hover:bg-surface-card transition">
                <td className="p-3.5 font-semibold text-gray-200">{share.fileName}</td>
                <td className="p-3.5 text-gray-400 font-mono">{share.recipient}</td>
                <td className="p-3.5">
                  <span className="px-2 py-0.5 bg-surface text-accent-gold border border-stroke-default rounded-full text-[10px] font-bold">
                    {share.tier}
                  </span>
                </td>
                <td className="p-3.5 text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 text-accent-blue" /> {share.expiry}
                </td>
                <td className="p-3.5 text-gray-300">{share.views}</td>
                <td className="p-3.5 text-gray-400 font-mono">{share.created}</td>
                <td className="p-3.5 text-right">
                  <button className="text-red-400 hover:text-red-300 text-[11px] font-bold transition">
                    Revoke
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
