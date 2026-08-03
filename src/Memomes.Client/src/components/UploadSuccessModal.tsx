import React from 'react';
import { CheckCircle2, Folder, Eye, Share2, X, Check, Plus, ShieldCheck, Sparkles, Image as IconImage } from 'lucide-react';
import type { FileItem } from './DashboardV2';

interface UploadSuccessModalProps {
  file: FileItem;
  destinationPath: string;
  onClose: () => void;
  onOpenFolder: (path: string) => void;
  onViewFile: (file: FileItem) => void;
  onShareFile: (file: FileItem) => void;
  onUploadAnother?: () => void;
}

export const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  file,
  destinationPath,
  onClose,
  onOpenFolder,
  onViewFile,
  onShareFile,
  onUploadAnother
}) => {
  const meta = (file as any).metadata;
  const originalName = meta?.original_file_name || file.fileNameEncrypted || 'File.png';
  const fileSizeMb = ((file.sizeBytes || meta?.file_size || 0) / (1024 * 1024)).toFixed(2);
  const mimeType = meta?.mime_type || file.contentTypeEncrypted || 'PNG Image';

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200 select-none font-sans">
      <div className="w-full max-w-md glass-card rounded-3xl border border-white/10 p-6 space-y-5 shadow-2xl relative text-slate-100 bg-[#080D1A]/95">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center space-y-2">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center mx-auto text-emerald-400 shadow-[0_0_25px_rgba(16,185,129,0.4)]">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-extrabold text-white text-xl tracking-tight">✔ Upload Successful</h3>
          <p className="text-xs text-slate-400 font-mono">Your file has been safely stored in Memomes Cloud.</p>
        </div>

        {/* File Details Summary Card */}
        <div className="p-4 bg-white/[0.02] rounded-2xl border border-white/10 space-y-2 text-xs font-mono">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#F5C027]">
              <IconImage className="w-5 h-5" />
            </div>
            <div className="truncate flex-1">
              <span className="font-bold text-slate-100 block text-sm truncate" title={originalName}>{originalName}</span>
              <span className="text-[11px] text-slate-400">{mimeType} • {fileSizeMb} MB</span>
            </div>
          </div>

          {/* Badges Grid */}
          <div className="grid grid-cols-2 gap-1.5 pt-2 text-[10px] text-center font-bold">
            <span className="px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Stored Securely
            </span>
            <span className="px-2 py-1 rounded-lg bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-1">
              <ShieldCheck className="w-3 h-3" /> Encrypted (AES-256)
            </span>
            <span className="px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 flex items-center justify-center gap-1">
              <Sparkles className="w-3 h-3 text-purple-400" /> AI Indexed
            </span>
            <span className="px-2 py-1 rounded-lg bg-purple-950/40 border border-purple-500/30 text-purple-300 flex items-center justify-center gap-1">
              <Eye className="w-3 h-3 text-purple-400" /> Preview Ready
            </span>
          </div>
        </div>

        {/* Saved Destination Indicator */}
        <div className="p-3 bg-white/[0.02] rounded-xl border border-white/10 flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Destination:</span>
          <span className="font-bold text-[#F5C027] flex items-center gap-1">
            <Folder className="w-3.5 h-3.5" /> {destinationPath}
          </span>
        </div>

        {/* 5 Action Buttons: Open Folder, Preview, Share, Upload Another, Done */}
        <div className="grid grid-cols-5 gap-1.5 text-[10px] font-bold font-mono pt-1">
          <button
            onClick={() => { onOpenFolder(destinationPath); onClose(); }}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 hover:text-white transition flex flex-col items-center justify-center gap-1"
          >
            <Folder className="w-3.5 h-3.5 text-cyan-400" />
            <span>Open Folder</span>
          </button>

          <button
            onClick={() => { onViewFile(file); onClose(); }}
            className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 hover:text-white transition flex flex-col items-center justify-center gap-1"
          >
            <Eye className="w-3.5 h-3.5 text-[#F5C027]" />
            <span>Preview</span>
          </button>

          <button
            onClick={() => { onShareFile(file); onClose(); }}
            className="p-2 bg-[#F5C027]/15 hover:bg-[#F5C027]/25 border border-[#F5C027]/30 rounded-xl text-[#F5C027] transition flex flex-col items-center justify-center gap-1"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share</span>
          </button>

          <button
            onClick={() => { onUploadAnother?.(); onClose(); }}
            className="p-2 bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 rounded-xl text-purple-300 transition flex flex-col items-center justify-center gap-1"
          >
            <Plus className="w-3.5 h-3.5 text-purple-400" />
            <span>Upload Another</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 bg-emerald-950/60 hover:bg-emerald-900/60 border border-emerald-500/40 rounded-xl text-emerald-400 transition flex flex-col items-center justify-center gap-1"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Done</span>
          </button>
        </div>
      </div>
    </div>
  );
};
