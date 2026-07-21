import React from 'react';
import { Users, Download, Eye, Clock } from 'lucide-react';

const sharedFiles = [
  { id: 1, name: 'Q4_Budget_2026.xlsx', sharedBy: 'amit.mehta@corp.com', tier: 'VIEW_ONLY', received: '2026-07-19', size: '2.1 MB' },
  { id: 2, name: 'Project_Roadmap_v3.pptx', sharedBy: 'priya.sharma@startup.io', tier: 'READ_DOWNLOAD', received: '2026-07-18', size: '5.4 MB' },
  { id: 3, name: 'Legal_Agreement_Draft.pdf', sharedBy: 'counsel@lawfirm.in', tier: 'VIEW_ONLY', received: '2026-07-16', size: '0.8 MB' },
];

export const SharedWithMePage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
        <Users className="w-5 h-5 text-accent-gold" /> Shared With Me
      </h2>
      <p className="text-xs text-gray-400 mt-1">Files shared with you by other Memomes users. Asymmetric key envelopes enforce your access tier.</p>
    </div>

    <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
      <table className="w-full text-xs text-left">
        <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
          <tr>
            <th className="p-3.5">File Name</th>
            <th className="p-3.5">Shared By</th>
            <th className="p-3.5">Access Tier</th>
            <th className="p-3.5">Size</th>
            <th className="p-3.5">Received</th>
            <th className="p-3.5 text-right">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-stroke-default">
          {sharedFiles.map(f => (
            <tr key={f.id} className="hover:bg-surface-card transition">
              <td className="p-3.5 font-semibold text-gray-200">{f.name}</td>
              <td className="p-3.5 text-gray-400 font-mono">{f.sharedBy}</td>
              <td className="p-3.5">
                <span className="px-2 py-0.5 bg-surface text-accent-gold border border-stroke-default rounded-full text-[10px] font-bold">{f.tier}</span>
              </td>
              <td className="p-3.5 text-gray-400 font-mono">{f.size}</td>
              <td className="p-3.5 text-gray-400 font-mono flex items-center gap-1">
                <Clock className="w-3 h-3 text-accent-blue" />{f.received}
              </td>
              <td className="p-3.5 text-right flex items-center justify-end gap-2">
                <button className="p-1 text-accent-gold hover:text-white transition"><Eye className="w-4 h-4" /></button>
                {f.tier === 'READ_DOWNLOAD' && <button className="p-1 text-emerald-400 hover:text-white transition"><Download className="w-4 h-4" /></button>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </div>
);
