import React from 'react';
import { CheckCircle2, Folder, Eye, Share2, X, Check } from 'lucide-react';
import type { FileItem } from './DashboardV2';

interface UploadSuccessModalProps {
  file: FileItem;
  destinationPath: string;
  onClose: () => void;
  onOpenFolder: (path: string) => void;
  onViewFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
}

export const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  file,
  destinationPath,
  onClose,
  onOpenFolder,
  onViewFile,
  onShareFile
}) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-md glass-card rounded-2xl border border-stroke-default p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-card transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-full bg-emerald-950/80 border-2 border-emerald-500/50 flex items-center justify-center mx-auto text-emerald-400 shadow-lg">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="font-extrabold text-white text-base">File Encrypted & Saved Successfully</h3>
          <p className="text-xs text-gray-400 font-mono truncate px-4">{file.fileNameEncrypted}</p>
        </div>

        {/* Saved Destination Indicator */}
        <div className="p-3.5 bg-surface rounded-xl border border-stroke-default flex items-center justify-between text-xs">
          <span className="text-gray-400 font-medium">Final Destination:</span>
          <span className="font-bold text-accent-gold flex items-center gap-1 font-mono">
            <Folder className="w-3.5 h-3.5" /> {destinationPath}
          </span>
        </div>

        {/* 4 Action Buttons: Open Folder, View File, Share, Done */}
        <div className="grid grid-cols-4 gap-2 text-xs font-bold pt-2">
          <button
            onClick={() => { onOpenFolder(destinationPath); onClose(); }}
            className="py-2.5 bg-surface hover:bg-surface-card border border-stroke-default rounded-xl text-gray-200 hover:text-white transition flex flex-col items-center justify-center gap-1"
          >
            <Folder className="w-4 h-4 text-accent-blue" />
            <span>Open Folder</span>
          </button>

          <button
            onClick={() => { onViewFile(file); onClose(); }}
            className="py-2.5 bg-surface hover:bg-surface-card border border-stroke-default rounded-xl text-gray-200 hover:text-white transition flex flex-col items-center justify-center gap-1"
          >
            <Eye className="w-4 h-4 text-emerald-400" />
            <span>View File</span>
          </button>

          <button
            onClick={() => { onShareFile(file); onClose(); }}
            className="py-2.5 bg-primary/20 hover:bg-primary/40 border border-primary/40 rounded-xl text-accent-gold transition flex flex-col items-center justify-center gap-1"
          >
            <Share2 className="w-4 h-4 text-accent-gold" />
            <span>Share</span>
          </button>

          <button
            onClick={onClose}
            className="py-2.5 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-emerald-400 transition flex flex-col items-center justify-center gap-1"
          >
            <Check className="w-4 h-4" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
