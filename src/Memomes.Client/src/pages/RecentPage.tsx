import React from 'react';
import { Clock, Video, FileText, Archive, Eye } from 'lucide-react';

const recentFiles = [
  { id: 'r1', name: 'Land_Deed_Registry_Document.pdf', type: 'application/pdf', size: 4.2, action: 'Viewed', time: '2 minutes ago' },
  { id: 'r2', name: 'Family_Goa_Vacation_2026.mp4', type: 'video/mp4', size: 154, action: 'Streamed', time: '1 hour ago' },
  { id: 'r3', name: 'Encrypted_Backup_2025.zip', type: 'application/zip', size: 850, action: 'Uploaded', time: '3 days ago' },
];

const fileIcon = (type: string) => {
  if (type.includes('video')) return <Video className="w-4 h-4 text-primary" />;
  if (type.includes('pdf')) return <FileText className="w-4 h-4 text-accent-blue" />;
  return <Archive className="w-4 h-4 text-accent-green" />;
};

export const RecentPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
        <Clock className="w-5 h-5 text-accent-gold" /> Recent Files
      </h2>
      <p className="text-xs text-gray-400 mt-1">Files you have recently accessed, uploaded, or streamed.</p>
    </div>
    <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
      <table className="w-full text-xs text-left">
        <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
          <tr>
            <th className="p-3.5">File</th>
            <th className="p-3.5">Size</th>
            <th className="p-3.5">Action</th>
            <th className="p-3.5">When</th>
            <th className="p-3.5 text-right">Open</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke-default">
          {recentFiles.map(f => (
            <tr key={f.id} className="hover:bg-surface-card transition">
              <td className="p-3.5 font-semibold text-gray-200 flex items-center gap-2">
                {fileIcon(f.type)}
                <span className="truncate max-w-xs">{f.name}</span>
              </td>
              <td className="p-3.5 text-gray-400 font-mono">{f.size} MB</td>
              <td className="p-3.5"><span className="text-accent-gold font-mono text-[11px]">{f.action}</span></td>
              <td className="p-3.5 text-gray-400 font-mono">{f.time}</td>
              <td className="p-3.5 text-right">
                <button className="p-1 text-gray-400 hover:text-accent-gold transition"><Eye className="w-4 h-4" /></button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
