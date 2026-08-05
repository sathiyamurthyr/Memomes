import React from 'react';
import {
  History, X, Download, RotateCcw
} from 'lucide-react';
import { VersionManager, type FileVersionRecord } from '../utils/versionManager';
import type { VaultFile } from '../utils/localVaultDb';

interface VersionHistoryModalProps {
  isOpen: boolean;
  file: VaultFile | null;
  onClose: () => void;
  onVersionRestored?: (parentFileId: string) => void;
}

export const VersionHistoryModal: React.FC<VersionHistoryModalProps> = ({
  isOpen,
  file,
  onClose,
  onVersionRestored
}) => {
  if (!isOpen || !file) return null;

  const versions = VersionManager.getVersionsForFile(file.id);

  const handleRestore = (versionNumber: number) => {
    const success = VersionManager.restoreVersion(file.id, versionNumber);
    if (success && onVersionRestored) {
      onVersionRestored(file.id);
    }
  };

  const handleDownloadVersion = (ver: FileVersionRecord) => {
    const a = document.createElement('a');
    a.href = ver.dataUrl;
    a.download = `${ver.fileName.replace(/\.([^.]+)$/, '')}_v${ver.versionNumber}.${ver.fileName.split('.').pop()}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
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
      <div className="glass-card max-w-xl w-full p-6 rounded-3xl border border-purple-500/30 shadow-[0_0_60px_rgba(168,85,247,0.15)] space-y-5 text-sans text-xs">
        
        {/* ── HEADER ───────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-inner">
              <History className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                Version History Inspector
              </h3>
              <p className="text-xs text-purple-300 font-mono mt-0.5 truncate max-w-xs" title={file.name}>
                {file.name} · {versions.length} Historical Versions
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Close version history"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── VERSIONS LIST ────────────────────────────────────────────────────── */}
        <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
          {versions.length === 0 ? (
            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 flex items-center justify-between text-xs">
              <div className="space-y-1">
                <div className="font-bold text-white flex items-center gap-2">
                  <span>Version 1.0</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold">
                    Current / Latest
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {file.size || '1.0 MB'} · Uploaded {formattedDate(file.updatedAt)}
                </div>
              </div>
              <button
                onClick={() => handleDownloadVersion({
                  versionId: file.id,
                  parentFileId: file.id,
                  versionNumber: 1,
                  fileName: file.name,
                  fileSize: 1024,
                  formattedSize: file.size || '1.0 MB',
                  mimeType: file.type,
                  dataUrl: file.dataUrl,
                  checksumSha256: file.metadata?.checksum_sha256 || 'sha256_v1',
                  createdAt: file.updatedAt || new Date().toISOString(),
                  isLatest: true,
                  createdBy: 'You'
                })}
                className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition flex items-center gap-1 text-[11px]"
              >
                <Download className="w-3.5 h-3.5" /> Download
              </button>
            </div>
          ) : (
            versions.map((ver) => (
              <div
                key={ver.versionId}
                className={`p-3.5 rounded-2xl border transition flex items-center justify-between gap-3 ${
                  ver.isLatest
                    ? 'bg-purple-950/20 border-purple-500/40'
                    : 'bg-[#070B14] border-white/10'
                }`}
              >
                <div className="space-y-1">
                  <div className="font-bold text-white flex items-center gap-2">
                    <span className="text-purple-300 font-mono">v{ver.versionNumber}.0</span>
                    <span className="truncate max-w-[160px]" title={ver.fileName}>{ver.fileName}</span>
                    {ver.isLatest && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[9px] font-mono font-bold">
                        Current / Latest
                      </span>
                    )}
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono flex items-center gap-2">
                    <span>{ver.formattedSize}</span>
                    <span>·</span>
                    <span>{formattedDate(ver.createdAt)}</span>
                    <span>·</span>
                    <span className="text-cyan-400">SHA: {ver.checksumSha256.substring(0, 10)}...</span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => handleDownloadVersion(ver)}
                    className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition"
                    title={`Download Version ${ver.versionNumber}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </button>

                  {!ver.isLatest && (
                    <button
                      onClick={() => handleRestore(ver.versionNumber)}
                      className="px-2.5 py-1.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 text-xs font-bold transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" /> Restore
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-mono">
            Zero-Knowledge Immutable Version Control
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-bold text-white transition"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
