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
    { label: 'Upload File', icon: Upload, color: 'from-primary/30 to-primary/60 text-white border-primary/40', onClick: onUploadClick },
    { label: 'Create Folder', icon: FolderPlus, color: 'from-blue-500/20 to-blue-600/40 text-accent-blue border-blue-500/30', onClick: onUploadClick },
    { label: 'Share File', icon: Share2, color: 'from-purple-500/20 to-purple-600/40 text-accent-purple border-purple-500/30', onClick: onUploadClick },
    { label: 'Digital Vault', icon: Lock, color: 'from-amber-500/20 to-amber-600/40 text-accent-gold border-amber-500/30', onClick: onOpenVault },
    { label: 'Nearby Share', icon: Wifi, color: 'from-emerald-500/20 to-emerald-600/40 text-emerald-400 border-emerald-500/30', onClick: onNearbyShare },
    { label: 'Request Files', icon: Download, color: 'from-teal-500/20 to-teal-600/40 text-teal-300 border-teal-500/30', onClick: onRequestFiles },
    { label: 'Scan Document', icon: FileText, color: 'from-indigo-500/20 to-indigo-600/40 text-indigo-400 border-indigo-500/30', onClick: onUploadClick },
    { label: 'AI Search', icon: Sparkles, color: 'from-pink-500/20 to-rose-600/40 text-rose-300 border-rose-500/30', onClick: onAISearch },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
      {actions.map((act, i) => {
        const Icon = act.icon;
        return (
          <button
            key={i}
            onClick={act.onClick}
            className={`glass-card p-3 rounded-2xl border text-left transition duration-200 hover:scale-[1.03] group flex flex-col justify-between h-24 bg-gradient-to-br ${act.color}`}
          >
            <div className="w-7 h-7 rounded-xl bg-surface/60 border border-stroke-default flex items-center justify-center group-hover:scale-110 transition">
              <Icon className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-[11px] leading-tight block text-gray-100">{act.label}</span>
          </button>
        );
      })}
    </div>
  );
};
