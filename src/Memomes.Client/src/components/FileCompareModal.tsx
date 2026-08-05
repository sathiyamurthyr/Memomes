import React from 'react';
import {
  GitCompare, X, ArrowRight, RefreshCw, PlusCircle, FileText
} from 'lucide-react';
import type { VaultFile } from '../utils/localVaultDb';
import type { DuplicateActionOptions } from '../utils/duplicateDetector';

interface FileCompareModalProps {
  isOpen: boolean;
  existingFile: VaultFile;
  incomingFile: {
    name: string;
    type: string;
    size: number;
    sha256: string;
    dataUrl?: string;
  };
  onResolve: (option: DuplicateActionOptions) => void;
  onClose: () => void;
}

export const FileCompareModal: React.FC<FileCompareModalProps> = ({
  isOpen,
  existingFile,
  incomingFile,
  onResolve,
  onClose
}) => {
  if (!isOpen) return null;

  const fmtBytes = (bytes?: number | string) => {
    if (!bytes) return '0 B';
    if (typeof bytes === 'string') return bytes;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formattedDate = (rawDate?: string) => {
    if (!rawDate) return 'Aug 4, 2026';
    try {
      return new Date(rawDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return rawDate;
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="glass-card max-w-3xl w-full p-6 rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.15)] space-y-6 text-sans text-xs">
        
        {/* ── HEADER ───────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <GitCompare className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                Side-by-Side File Comparison
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Inspect attributes of existing vault asset vs incoming payload before committing.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Close compare dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── COMPARISON CARDS ─────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 gap-4">
          
          {/* CARD 1: EXISTING FILE IN VAULT */}
          <div className="p-4 rounded-2xl bg-[#070B14] border border-amber-500/20 space-y-3 relative shadow-inner">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-[10px] font-bold text-amber-400 uppercase font-mono tracking-wider">
                Existing Vault File
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 text-[9px] font-mono">
                {existingFile.metadata?.version ? `v${existingFile.metadata.version}.0` : 'v1.0'}
              </span>
            </div>

            {/* Thumbnail Box */}
            <div className="h-32 rounded-xl bg-slate-900/80 border border-white/10 overflow-hidden flex items-center justify-center relative">
              {existingFile.type.startsWith('image/') && (existingFile.dataUrl || existingFile.b2FinalUrl) ? (
                <img
                  src={existingFile.dataUrl || existingFile.b2FinalUrl}
                  alt={existingFile.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center space-y-1">
                  <FileText className="w-8 h-8 text-amber-400 mx-auto" />
                  <div className="text-[10px] text-slate-400 font-mono uppercase">{existingFile.name.split('.').pop()}</div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">File Name:</span>
                <span className="text-white font-bold truncate max-w-[140px]" title={existingFile.name}>{existingFile.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">File Size:</span>
                <span className="text-amber-400 font-mono font-bold">{fmtBytes(existingFile.size || existingFile.metadata?.file_size)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Uploaded:</span>
                <span className="text-slate-300 font-mono">{formattedDate(existingFile.metadata?.created_at || existingFile.updatedAt)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">SHA-256:</span>
                <span className="text-cyan-400 font-mono text-[10px]" title={existingFile.metadata?.checksum_sha256 || existingFile.id}>
                  {(existingFile.metadata?.checksum_sha256 || existingFile.id).substring(0, 14)}...
                </span>
              </div>
            </div>
          </div>

          {/* CARD 2: NEW INCOMING FILE */}
          <div className="p-4 rounded-2xl bg-[#070B14] border border-cyan-500/20 space-y-3 relative shadow-inner">
            <div className="flex justify-between items-center border-b border-white/10 pb-2">
              <span className="text-[10px] font-bold text-cyan-400 uppercase font-mono tracking-wider">
                New Incoming File
              </span>
              <span className="px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 text-[9px] font-mono font-bold">
                Pending Payload
              </span>
            </div>

            {/* Thumbnail Box */}
            <div className="h-32 rounded-xl bg-slate-900/80 border border-white/10 overflow-hidden flex items-center justify-center relative">
              {incomingFile.type.startsWith('image/') && incomingFile.dataUrl ? (
                <img
                  src={incomingFile.dataUrl}
                  alt={incomingFile.name}
                  className="w-full h-full object-contain p-1"
                />
              ) : (
                <div className="text-center space-y-1">
                  <FileText className="w-8 h-8 text-cyan-400 mx-auto" />
                  <div className="text-[10px] text-slate-400 font-mono uppercase">{incomingFile.name.split('.').pop()}</div>
                </div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-400">File Name:</span>
                <span className="text-white font-bold truncate max-w-[140px]" title={incomingFile.name}>{incomingFile.name}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">File Size:</span>
                <span className="text-cyan-400 font-mono font-bold">{fmtBytes(incomingFile.size)}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">Uploaded:</span>
                <span className="text-slate-300 font-mono">{formattedDate(new Date().toISOString())}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-slate-400">SHA-256:</span>
                <span className="text-cyan-400 font-mono text-[10px]" title={incomingFile.sha256}>
                  {incomingFile.sha256.substring(0, 14)}...
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ── ACTION BUTTONS FOOTER ───────────────────────────────────────────── */}
        <div className="grid grid-cols-4 gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => onResolve({ action: 'SKIP' })}
            className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition border border-white/10"
          >
            Skip Upload
          </button>

          <button
            onClick={() => onResolve({ action: 'REPLACE' })}
            className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Replace
          </button>

          <button
            onClick={() => onResolve({ action: 'CREATE_VERSION' })}
            className="btn-gold !h-9 !text-xs shadow-lg flex items-center justify-center gap-1 font-bold"
          >
            <ArrowRight className="w-3.5 h-3.5" /> Create Version
          </button>

          <button
            onClick={() => onResolve({ action: 'KEEP_BOTH' })}
            className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-1"
          >
            <PlusCircle className="w-3.5 h-3.5" /> Keep Both
          </button>
        </div>

      </div>
    </div>
  );
};
