import React from 'react';
import { Trash2, RefreshCw, AlertTriangle, FileText } from 'lucide-react';

const trashFiles = [
  { id: 't1', name: 'Old_Contract_Draft.docx', size: 1.2, deletedOn: '2026-07-10', daysLeft: 19 },
  { id: 't2', name: 'Temp_Backup_June.zip', size: 420, deletedOn: '2026-07-01', daysLeft: 10 },
];

export const TrashPage: React.FC = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <div>
        <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
          <Trash2 className="w-5 h-5 text-red-400" /> Vault Trash
        </h2>
        <p className="text-xs text-gray-400 mt-1">
          Files in Trash are permanently purged after 30 days per India DPDP Act policy. Ransomware Rollback available.
        </p>
      </div>
      <button className="px-4 py-1.5 bg-red-950/30 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg hover:bg-red-950/50 transition flex items-center gap-1.5">
        <Trash2 className="w-3.5 h-3.5" /> Empty Vault Trash
      </button>
    </div>

    {trashFiles.length === 0 ? (
      <div className="glass-card rounded-2xl p-12 border border-stroke-default text-center">
        <Trash2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
        <span className="text-gray-400 text-sm">Vault Trash is empty.</span>
      </div>
    ) : (
      <div className="space-y-3">
        <div className="flex items-center gap-2 text-xs text-amber-400 font-mono bg-amber-950/20 border border-amber-500/30 px-4 py-2.5 rounded-xl">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Files are permanently deleted after 30 days. Ransomware Rollback allows point-in-time recovery up to 90 days.
        </div>

        {trashFiles.map(f => (
          <div key={f.id} className="glass-card rounded-xl p-4 border border-stroke-default flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface border border-stroke-default flex items-center justify-center">
                <FileText className="w-4 h-4 text-gray-500" />
              </div>
              <div>
                <span className="text-xs font-bold text-gray-300 block">{f.name}</span>
                <span className="text-[10px] text-gray-500 font-mono">
                  {f.size} MB · Deleted {f.deletedOn} · {f.daysLeft} days until permanent purge
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 text-xs text-emerald-400 border border-emerald-500/30 rounded-lg hover:bg-emerald-950/30 transition font-bold flex items-center gap-1">
                <RefreshCw className="w-3 h-3" /> Restore
              </button>
              <button className="px-3 py-1.5 text-xs text-red-400 border border-red-500/30 rounded-lg hover:bg-red-950/30 transition font-bold flex items-center gap-1">
                <Trash2 className="w-3 h-3" /> Delete Now
              </button>
            </div>
          </div>
        ))}
      </div>
    )}
  </div>
);
