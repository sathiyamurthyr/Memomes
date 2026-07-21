import React from 'react';
import { Eye, Share2, ShieldX, Download, KeyRound, Clock, Trash2 } from 'lucide-react';

export const RecentActivityTimeline: React.FC = () => {
  const activities = [
    { type: 'view', title: 'Viewed Watermarked Media', file: 'Family_Goa_Vacation_2026.mp4', time: '10 mins ago', icon: Eye, color: 'text-accent-gold bg-amber-500/10' },
    { type: 'share', title: 'Created Zero-Knowledge Link', file: 'Land_Deed_Registry_Document.pdf', time: '1 hour ago', icon: Share2, color: 'text-accent-blue bg-blue-500/10' },
    { type: 'download', title: '60s Presigned S3 Download', file: 'Land_Deed_Registry_Document.pdf', time: '2 hours ago', icon: Download, color: 'text-emerald-400 bg-emerald-500/10' },
    { type: 'login', title: 'New Device Login Verified', file: 'Chrome on macOS (103.21.124.5)', time: 'Today, 14:20 IST', icon: KeyRound, color: 'text-purple-400 bg-purple-500/10' },
    { type: 'revoke', title: 'Revoked Public Share Link', file: 'Financial_Report_Q2.pdf', time: 'Yesterday', icon: ShieldX, color: 'text-red-400 bg-red-500/10' },
    { type: 'trash', title: 'Moved to Vault Trash', file: 'Old_Draft_Archive.zip', time: '2 days ago', icon: Trash2, color: 'text-gray-400 bg-gray-500/10' },
  ];

  return (
    <div className="glass-card rounded-2xl p-6 border border-stroke-default">
      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-gold" /> Recent Audit Activity
        </h3>
        <span className="text-xs text-gray-400 font-mono">180-Day CERT-In Retention</span>
      </div>

      <div className="space-y-3.5 relative before:absolute before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-stroke-default">
        {activities.map((act, i) => {
          const Icon = act.icon;
          return (
            <div key={i} className="flex items-start space-x-3 relative pl-1">
              <div className={`w-7 h-7 rounded-lg ${act.color} border border-stroke-default flex items-center justify-center shrink-0 z-10`}>
                <Icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 flex justify-between items-center text-xs">
                <div>
                  <p className="font-semibold text-gray-200">{act.title}</p>
                  <p className="text-[11px] text-gray-400 font-mono">{act.file}</p>
                </div>
                <span className="text-[10px] text-gray-500 shrink-0">{act.time}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
