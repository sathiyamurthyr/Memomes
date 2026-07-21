import React from 'react';
import { Activity, Eye, Download, LogIn, ShieldAlert } from 'lucide-react';

const events = [
  { id: 1, action: 'FILE_VIEWED', file: 'Land_Deed_Registry.pdf', actor: 'rahul@example.com', ip: '103.21.124.5', geo: 'Mumbai, MH', time: '2026-07-21 18:43:02', severity: 'INFO' },
  { id: 2, action: 'FILE_DOWNLOADED', file: 'Family_Goa_2026.mp4', actor: 'priya@example.com', ip: '110.93.4.12', geo: 'Bengaluru, KA', time: '2026-07-21 17:12:38', severity: 'INFO' },
  { id: 3, action: 'SHARE_REVOKED', file: 'Encrypted_Backup.zip', actor: 'You', ip: '192.168.1.1', geo: 'Chennai, TN', time: '2026-07-21 15:55:10', severity: 'WARNING' },
  { id: 4, action: 'LOGIN', file: '—', actor: 'You', ip: '192.168.1.1', geo: 'Chennai, TN', time: '2026-07-21 14:00:00', severity: 'INFO' },
  { id: 5, action: 'ACCESS_DENIED', file: 'Crypto_Wallet_Keys.enc', actor: 'unknown@suspicious.net', ip: '45.33.32.156', geo: 'US (Unknown)', time: '2026-07-21 09:12:04', severity: 'CRITICAL' },
];

const actionIcon = (action: string) => {
  if (action === 'FILE_VIEWED') return <Eye className="w-3.5 h-3.5 text-accent-blue" />;
  if (action === 'FILE_DOWNLOADED') return <Download className="w-3.5 h-3.5 text-emerald-400" />;
  if (action === 'SHARE_REVOKED') return <ShieldAlert className="w-3.5 h-3.5 text-red-400" />;
  if (action === 'LOGIN') return <LogIn className="w-3.5 h-3.5 text-accent-gold" />;
  if (action === 'ACCESS_DENIED') return <ShieldAlert className="w-3.5 h-3.5 text-red-500" />;
  return <Activity className="w-3.5 h-3.5 text-gray-400" />;
};

const severityBadge = (severity: string) => {
  if (severity === 'CRITICAL') return 'bg-red-950/60 text-red-400 border-red-500/40';
  if (severity === 'WARNING') return 'bg-amber-950/60 text-accent-gold border-amber-500/40';
  return 'bg-emerald-950/40 text-emerald-400 border-emerald-500/30';
};

export const ActivityLogPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
            <Activity className="w-5 h-5 text-accent-gold" /> Activity Audit Log
          </h2>
          <p className="text-xs text-gray-400 mt-1">
            180-day CERT-In compliant immutable audit trail. All access events logged with Geo-IP resolution.
          </p>
        </div>
        <button className="text-xs text-accent-gold border border-amber-500/30 px-3 py-1.5 rounded-lg hover:bg-amber-500/10 transition font-bold">
          Export CSV Report
        </button>
      </div>

      <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
        <table className="w-full text-xs text-left">
          <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
            <tr>
              <th className="p-3.5">Event</th>
              <th className="p-3.5">File</th>
              <th className="p-3.5">Actor</th>
              <th className="p-3.5">IP / Location</th>
              <th className="p-3.5">Timestamp</th>
              <th className="p-3.5">Severity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stroke-default">
            {events.map(evt => (
              <tr key={evt.id} className="hover:bg-surface-card transition">
                <td className="p-3.5">
                  <div className="flex items-center gap-2">
                    {actionIcon(evt.action)}
                    <span className="font-mono text-gray-200">{evt.action}</span>
                  </div>
                </td>
                <td className="p-3.5 text-gray-400 truncate max-w-[140px]">{evt.file}</td>
                <td className="p-3.5 text-gray-300">{evt.actor}</td>
                <td className="p-3.5 text-gray-400 font-mono text-[10px]">
                  <div>{evt.ip}</div>
                  <div className="text-gray-500">{evt.geo}</div>
                </td>
                <td className="p-3.5 text-gray-400 font-mono text-[10px]">{evt.time}</td>
                <td className="p-3.5">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${severityBadge(evt.severity)}`}>
                    {evt.severity}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
