import React from 'react';
import {
  ShieldCheck, Lock, Sparkles, Folder, Eye, Share2,
  Upload, Check, X, Clock, Zap, FileText, CheckCircle2, Server
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

  const extension = fileName.split('.').pop()?.toUpperCase() || 'FILE';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-2xl animate-in fade-in duration-300 font-sans select-none">
      
      {/* ── FIXED NON-SCROLLABLE 3-COLUMN DIALOG ────────────────────────────── */}
      <div className="relative w-full max-w-4xl max-h-[600px] bg-[#0F172A] border border-white/10 rounded-3xl shadow-[0_0_80px_rgba(0,0,0,0.9)] overflow-hidden text-white p-6 flex flex-col justify-between space-y-4">
        
        {/* Top Header Row with Modal Close */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-[#F5B700] to-amber-500 flex items-center justify-center font-extrabold text-slate-950 text-xs shadow-md">
              M
            </div>
            <span className="text-xs font-bold text-white tracking-wide font-mono">
              Memomes Cloud Vault • Upload Complete
            </span>
          </div>

          <button
            onClick={onDone}
            className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── THREE COLUMN GRID LAYOUT (FIXED HEIGHT, NO SCROLLING) ───────────── */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 items-center flex-1 py-1">
          
          {/* ── LEFT COLUMN: Speed & Duration Cards (3 Cols) ────────────────── */}
          <div className="md:col-span-3 space-y-3">
            {/* Speed Card */}
            <div className="p-3.5 rounded-2xl bg-[#070B14] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                <Zap className="w-3.5 h-3.5" /> Average Speed
              </div>
              <div className="text-lg font-extrabold text-white font-mono">
                14.2 MB/s
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Zero-Knowledge Stream
              </div>
            </div>

            {/* Duration Card */}
            <div className="p-3.5 rounded-2xl bg-[#070B14] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-cyan-400 uppercase tracking-wider">
                <Clock className="w-3.5 h-3.5" /> Total Duration
              </div>
              <div className="text-lg font-extrabold text-white font-mono">
                0.8 Seconds
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Client-Side GCM Cipher
              </div>
            </div>

            {/* Benchmark Card */}
            <div className="p-3.5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <ShieldCheck className="w-3.5 h-3.5" /> Encryption
              </div>
              <div className="text-sm font-extrabold text-emerald-300 font-mono">
                AES-256-GCM
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                256-Bit Master DEK
              </div>
            </div>
          </div>

          {/* ── CENTER COLUMN: Centerpiece Ring + Logo + Badges (6 Cols) ───── */}
          <div className="md:col-span-6 flex flex-col items-center justify-center text-center space-y-4">
            
            {/* Centerpiece Progress Ring with Centered Memomes Logo */}
            <div className="relative w-28 h-28 flex items-center justify-center my-1">
              {/* SVG Glowing Radial Ring */}
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-slate-800"
                  strokeWidth="5"
                  stroke="currentColor"
                  fill="transparent"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  className="text-[#F5B700] transition-all duration-1000 ease-out"
                  strokeWidth="5"
                  strokeDasharray={264}
                  strokeDashoffset={0}
                  strokeLinecap="round"
                  stroke="currentColor"
                  fill="transparent"
                  style={{ filter: 'drop-shadow(0 0 10px #F5B700)' }}
                />
              </svg>

              {/* Centered Memomes Cloud Logo with Pulse Halo */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F5B700] via-amber-400 to-amber-500 flex items-center justify-center shadow-[0_0_25px_rgba(245,183,0,0.4)] border border-amber-300/40 animate-in zoom-in">
                  <span className="font-extrabold text-slate-950 text-2xl tracking-tighter">M</span>
                </div>
              </div>

              {/* Floating Verified Check Badge */}
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center shadow-lg border-2 border-[#0F172A]">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            {/* Title & Simple Destination Location */}
            <div className="space-y-1">
              <h2 className="text-lg font-extrabold text-white tracking-tight">
                Upload Successfully Encrypted
              </h2>
              <p className="text-xs text-slate-300 font-medium">
                Saved to: <span className="text-[#F5B700] font-bold">My Files &gt; {folderCategory}</span>
              </p>
            </div>

            {/* Consolidated Security Status Badges */}
            <div className="p-3 rounded-2xl bg-emerald-950/25 border border-emerald-500/25 w-full">
              <div className="text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Security Status Verified
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px] font-mono">
                <div className="flex items-center justify-center gap-1.5 text-slate-200 bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>AES-256 Protected</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-slate-200 bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                  <Lock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Zero-Knowledge</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-slate-200 bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Integrity Verified</span>
                </div>
                <div className="flex items-center justify-center gap-1.5 text-slate-200 bg-white/5 py-1 px-2 rounded-lg border border-white/5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  <span>AI Indexed</span>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: Size, Files & Stage Cards (3 Cols) ───────────── */}
          <div className="md:col-span-3 space-y-3">
            {/* File Info Card */}
            <div className="p-3.5 rounded-2xl bg-[#070B14] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-amber-400 uppercase tracking-wider">
                <FileText className="w-3.5 h-3.5" /> File Payload
              </div>
              <div className="text-lg font-extrabold text-white font-mono">
                {fmtBytes(fileSize)}
              </div>
              <div className="text-[10px] text-slate-400 font-mono truncate" title={fileName}>
                {fileName} ({extension})
              </div>
            </div>

            {/* Files Processed Card */}
            <div className="p-3.5 rounded-2xl bg-[#070B14] border border-white/10 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-emerald-400 uppercase tracking-wider">
                <CheckCircle2 className="w-3.5 h-3.5" /> Files Processed
              </div>
              <div className="text-lg font-extrabold text-white font-mono">
                1 / 1 Files
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                100% Verified
              </div>
            </div>

            {/* Stage Card */}
            <div className="p-3.5 rounded-2xl bg-purple-950/20 border border-purple-500/20 space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold text-purple-300 uppercase tracking-wider">
                <Server className="w-3.5 h-3.5" /> Vault Stage
              </div>
              <div className="text-sm font-extrabold text-purple-300 font-mono">
                Stage 8/8
              </div>
              <div className="text-[10px] text-slate-400 font-mono">
                Vault Sealed & Ready
              </div>
            </div>
          </div>

        </div>

        {/* ── BOTTOM ACTION BUTTONS BAR (5 BUTTONS ACROSS) ───────────────────── */}
        <div className="pt-3 border-t border-white/10 grid grid-cols-5 gap-2 shrink-0">
          <button
            onClick={onOpenFolder}
            className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Folder className="w-3.5 h-3.5 text-amber-400" /> Open Folder
          </button>

          <button
            onClick={onPreview}
            className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5 text-cyan-400" /> Preview
          </button>

          <button
            onClick={onShare}
            className="py-2.5 px-3 rounded-xl bg-[#F5B700]/15 border border-[#F5B700]/40 text-[#F5B700] hover:bg-[#F5B700]/25 font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>

          <button
            onClick={onUploadAnother}
            className="py-2.5 px-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Upload className="w-3.5 h-3.5" /> Upload Another
          </button>

          <button
            onClick={onDone}
            className="py-2.5 px-3 rounded-xl bg-[#F5B700] text-slate-950 font-extrabold text-xs hover:brightness-110 transition shadow-lg flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4 stroke-[3]" /> Done
          </button>
        </div>

      </div>
    </div>
  );
};
