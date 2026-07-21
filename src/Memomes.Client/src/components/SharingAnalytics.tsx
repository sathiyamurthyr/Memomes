import React from 'react';
import { Share2, Link, ShieldOff, Download, Eye, Flame } from 'lucide-react';

export const SharingAnalytics: React.FC = () => {
  const metrics = [
    { label: 'Files Shared', value: '12', change: '+2 this week', icon: Share2, color: 'text-accent-blue' },
    { label: 'Active Links', value: '8', change: 'Enforced 60s presign', icon: Link, color: 'text-accent-gold' },
    { label: 'Total Downloads', value: '142', change: 'Decrypted locally', icon: Download, color: 'text-emerald-400' },
    { label: 'Stream Views', value: '389', change: 'Watermark overlay', icon: Eye, color: 'text-purple-400' },
    { label: 'Revoked Links', value: '4', change: 'Access terminated', icon: ShieldOff, color: 'text-red-400' },
    { label: 'Self Destruct Events', value: '2', change: 'Burned after read', icon: Flame, color: 'text-orange-400' },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-stroke-default mb-8">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
          <Share2 className="w-4 h-4 text-accent-gold" /> Sharing Analytics & Control Center
        </h3>
        <span className="text-xs text-gray-400">Zero-Server-Master-Key Policy</span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {metrics.map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="p-3.5 bg-surface rounded-xl border border-stroke-default flex flex-col justify-between">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs text-gray-400 font-medium">{m.label}</span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>
              <div>
                <span className="text-2xl font-extrabold text-white">{m.value}</span>
                <p className="text-[10px] text-gray-400 mt-0.5">{m.change}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
