import React from 'react';
import {
  CheckCircle2, ShieldCheck, Lock, Sparkles, Folder, Eye, Share2,
  Upload, Check, X, Clock, Zap, FileText
} from 'lucide-react';

interface UploadSuccessModalProps {
  fileName: string;
  fileSize: number;
  folderCategory?: string;
  onOpenFolder?: () => void;
  onPreview?: () => void;
  onShare?: () => void;
  onUploadAnother?: () => void;
  onDone: () => void;
}

export const UploadSuccessModal: React.FC<UploadSuccessModalProps> = ({
  fileName,
  fileSize,
  folderCategory = 'Documents',
  onOpenFolder,
  onPreview,
  onShare,
  onUploadAnother,
  onDone
}) => {
  const fmtBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-300">
      <div className="relative w-full max-w-md bg-[#0F172A] border border-white/10 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden font-sans text-white p-6 space-y-5 select-none">
        
        {/* Close Button */}
        <button
          onClick={onDone}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* ── 1. CIRCULAR PROGRESS & SUCCESS HEADER (No Clipping) ────────────────── */}
        <div className="pt-4 flex flex-col items-center justify-center text-center space-y-3">
          {/* Centered Circular Ring */}
          <div className="relative w-24 h-24 flex items-center justify-center">
            {/* SVG Glowing Radial Ring */}
            <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-slate-800"
                strokeWidth="6"
                stroke="currentColor"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r="42"
                className="text-[#F5B700] transition-all duration-1000 ease-out"
                strokeWidth="6"
                strokeDasharray={264}
                strokeDashoffset={0}
                strokeLinecap="round"
                stroke="currentColor"
                fill="transparent"
                style={{ filter: 'drop-shadow(0 0 8px #F5B700)' }}
              />
            </svg>

            {/* Inner Success Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-[#F5B700] to-amber-300 flex items-center justify-center shadow-lg animate-in zoom-in">
                <Check className="w-8 h-8 text-slate-950 stroke-[3]" />
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-extrabold text-white tracking-tight">
              Upload Successfully Encrypted
            </h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Saved to: <span className="text-[#F5B700] font-bold">My Files &gt; {folderCategory}</span>
            </p>
          </div>
        </div>

        {/* ── 2. FILE & COMPLETION SUMMARY CARD ─────────────────────────────────── */}
        <div className="p-3.5 rounded-2xl bg-[#070B14] border border-white/10 space-y-2.5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
              <FileText className="w-5 h-5 text-[#F5B700]" />
            </div>
            <div className="truncate flex-1">
              <div className="text-xs font-bold text-white truncate" title={fileName}>
                {fileName}
              </div>
              <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                {fmtBytes(fileSize)} · Memomes Secure Vault
              </div>
            </div>
          </div>

          {/* Completion Metrics */}
          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/5 text-[11px] font-mono">
            <div className="flex items-center gap-1.5 text-slate-300">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Avg Speed: <strong className="text-white">14.2 MB/s</strong></span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Clock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Total Time: <strong className="text-white">0.8s</strong></span>
            </div>
          </div>
        </div>

        {/* ── 3. CONSOLIDATED SECURITY STATUS ──────────────────────────────────── */}
        <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
          <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider font-mono flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> Security Status
            </span>
            <span className="text-[9px] bg-emerald-500/20 px-1.5 py-0.5 rounded text-emerald-300">Protected</span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-[11px] font-mono pt-1">
            <div className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>AES-256 Protected</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span>Zero-Knowledge Enabled</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Integrity Verified</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-300">
              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
              <span>AI Indexed</span>
            </div>
          </div>
        </div>

        {/* ── 4. ACTION BUTTONS ───────────────────────────────────────────────── */}
        <div className="space-y-2 pt-1">
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={onOpenFolder}
              className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Folder className="w-3.5 h-3.5 text-amber-400" /> Open Folder
            </button>

            <button
              onClick={onPreview}
              className="py-2 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
            </button>

            <button
              onClick={onShare}
              className="py-2 px-3 rounded-xl bg-[#F5B700]/15 border border-[#F5B700]/40 text-[#F5B700] hover:bg-[#F5B700]/25 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={onUploadAnother}
              className="py-2.5 px-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5" /> Upload Another
            </button>

            <button
              onClick={onDone}
              className="py-2.5 px-4 rounded-xl bg-[#F5B700] text-slate-950 font-extrabold text-xs hover:brightness-110 transition shadow-lg flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4 stroke-[3]" /> Done
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
