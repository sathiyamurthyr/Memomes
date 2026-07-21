import React from 'react';
import {
  Upload, FolderPlus, Share2, Lock, Wifi, Download, FileText, Sparkles
} from 'lucide-react';

interface QuickActionsProps {
  onUploadClick: () => void;
  onOpenVault: () => void;
  onNearbyShare: () => void;
  onAISearch: () => void;
  onRequestFiles: () => void;
}

export const QuickActions: React.FC<QuickActionsProps> = ({
  onUploadClick,
  onOpenVault,
  onNearbyShare,
  onAISearch,
  onRequestFiles
}) => {
  const actions = [
    { label: 'Upload File', icon: Upload, color: 'from-primary/20 to-primary/40 text-primary border-primary/30', onClick: onUploadClick },
    { label: 'Create Folder', icon: FolderPlus, color: 'from-blue-500/20 to-blue-600/40 text-accent-blue border-blue-500/30', onClick: () => alert('Folder creation initialized.') },
    { label: 'Share File', icon: Share2, color: 'from-purple-500/20 to-purple-600/40 text-accent-purple border-purple-500/30', onClick: () => alert('Select a file to create a zero-knowledge link.') },
    { label: 'Digital Vault', icon: Lock, color: 'from-amber-500/20 to-amber-600/40 text-accent-gold border-amber-500/30', onClick: onOpenVault },
    { label: 'Nearby Share', icon: Wifi, color: 'from-emerald-500/20 to-emerald-600/40 text-accent-green border-emerald-500/30', onClick: onNearbyShare },
    { label: 'Request Files', icon: Download, color: 'from-pink-500/20 to-pink-600/40 text-pink-400 border-pink-500/30', onClick: onRequestFiles },
    { label: 'Scan Document', icon: FileText, color: 'from-indigo-500/20 to-indigo-600/40 text-indigo-400 border-indigo-500/30', onClick: () => alert('Document scanner ready.') },
    { label: 'AI Search', icon: Sparkles, color: 'from-amber-500/20 to-amber-600/40 text-accent-gold border-amber-500/30', onClick: onAISearch },
  ];

  return (
    <div className="mb-8">
      <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
        {actions.map((act, i) => {
          const Icon = act.icon;
          return (
            <button
              key={i}
              onClick={act.onClick}
              className="glass-card p-3 rounded-xl border border-stroke-default flex flex-col items-center justify-center text-center group hover:scale-[1.02] active:scale-95 transition"
            >
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${act.color} border flex items-center justify-center mb-2 shadow-md`}>
                <Icon className="w-5 h-5 group-hover:scale-110 transition" />
              </div>
              <span className="text-[11px] font-semibold text-gray-200 group-hover:text-white truncate w-full">
                {act.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
