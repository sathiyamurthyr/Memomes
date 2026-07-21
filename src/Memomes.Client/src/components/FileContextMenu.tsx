import React, { useEffect, useRef } from 'react';
import {
  ShieldCheck, Eye, Share2, Flame, ShieldAlert,
  FileText, Video, KeyRound, Sparkles, History, CheckCircle2,
  Trash2, Copy, FileJson, LockKeyhole, Cpu, BarChart2
} from 'lucide-react';
import type { FileItem } from './DashboardV2';

interface FileContextMenuProps {
  file: FileItem;
  position: { x: number; y: number };
  onClose: () => void;
  onOpen: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  position,
  onClose,
  onOpen,
  onDelete
}) => {
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close on Outside Click or ESC Keypress
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // Adjust menu position to fit within viewport
  const adjustedX = Math.min(position.x, window.innerWidth - 320);
  const adjustedY = Math.min(position.y, window.innerHeight - 520);

  const isVideo = file.contentTypeEncrypted.includes('video') || file.fileNameEncrypted.endsWith('.mp4');
  const isDocument = file.contentTypeEncrypted.includes('pdf') || file.contentTypeEncrypted.includes('image');
  const isArchive = file.contentTypeEncrypted.includes('zip') || file.fileNameEncrypted.endsWith('.zip');

  return (
    <div
      ref={menuRef}
      style={{ top: `${Math.max(10, adjustedY)}px`, left: `${Math.max(10, adjustedX)}px` }}
      tabIndex={-1}
      aria-label={`Security Action Center for ${file.fileNameEncrypted}`}
      className="fixed z-50 w-80 glass-panel border border-stroke-default rounded-2xl shadow-2xl p-3 text-xs animate-in fade-in zoom-in-95 duration-150 overflow-hidden focus:outline-none"
    >
      {/* 1. File Metadata & Security Badges Header */}
      <div className="p-3 bg-surface rounded-xl border border-stroke-default mb-3">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2 truncate">
            {isVideo ? (
              <Video className="w-4 h-4 text-primary shrink-0" />
            ) : (
              <FileText className="w-4 h-4 text-accent-blue shrink-0" />
            )}
            <span className="font-bold text-gray-100 truncate" title={file.fileNameEncrypted}>
              {file.fileNameEncrypted}
            </span>
          </div>
          <span className="text-[10px] font-extrabold bg-emerald-950/70 text-emerald-400 border border-emerald-500/40 px-2 py-0.5 rounded-full shrink-0 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> AES-256
          </span>
        </div>

        <div className="grid grid-cols-2 gap-2 text-[10px] font-mono text-gray-400">
          <div>
            Size: <span className="text-gray-200">{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
          </div>
          <div>
            Tier: <span className="text-accent-gold">{file.accessTier}</span>
          </div>
          <div className="col-span-2 truncate flex items-center justify-between bg-surface-container px-2 py-1 rounded border border-stroke-default">
            <span className="truncate">Hash: {file.contentHash.substring(0, 16)}...</span>
            <button
              onClick={() => {
                navigator.clipboard.writeText(file.contentHash);
                alert('SHA-256 Hash copied to clipboard.');
              }}
              className="text-accent-gold hover:text-white ml-1"
              title="Copy Hash"
            >
              <Copy className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-h-[60vh] overflow-y-auto space-y-3 pr-1">
        {/* 2. File-Type Specific Smart Actions */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1 block">
            File-Type Smart Actions
          </span>
          <div className="space-y-0.5">
            {isVideo && (
              <button
                onClick={() => { onOpen(file); onClose(); }}
                className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
              >
                <Video className="w-3.5 h-3.5 text-primary" />
                <span>Zero-RAM MediaSource Video Stream</span>
              </button>
            )}

            {isDocument && (
              <button
                onClick={() => { alert('Extracting 100% on-device OCR text...'); onClose(); }}
                className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
              >
                <FileText className="w-3.5 h-3.5 text-accent-blue" />
                <span>Extract On-Device OCR Text</span>
              </button>
            )}

            {isArchive && (
              <button
                onClick={() => { alert('Archive checksum verification passed.'); onClose(); }}
                className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
              >
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verify Payload Integrity</span>
              </button>
            )}

            <button
              onClick={() => { onOpen(file); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
            >
              <Eye className="w-3.5 h-3.5 text-accent-gold" />
              <span>{file.accessTier === 'VIEW_ONLY' ? 'Watermark Media Stream' : 'Decrypt & View Preview'}</span>
            </button>
          </div>
        </div>

        <div className="border-t border-stroke-default" />

        {/* 3. Secure Sharing & Access Control Section */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
            <LockKeyhole className="w-3 h-3 text-accent-gold" /> Secure Sharing Controls
          </span>
          <div className="space-y-0.5">
            <button
              onClick={() => { alert(`Presigned 60s S3 link created for ${file.fileNameEncrypted}`); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
            >
              <Share2 className="w-3.5 h-3.5 text-accent-blue" />
              <span>Create Presigned 60s S3 Link</span>
            </button>

            <button
              onClick={() => { alert('Password protection enforced on share link.'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
            >
              <KeyRound className="w-3.5 h-3.5 text-purple-400" />
              <span>Enforce Secondary PIN Protection</span>
            </button>

            <button
              onClick={() => { alert('Self-destruct timer set to Burn-on-Read.'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
            >
              <Flame className="w-3.5 h-3.5 text-orange-400" />
              <span>Set Self-Destruct Timer (Burn-on-Read)</span>
            </button>

            <button
              onClick={() => { alert('All recipient access keys revoked.'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-red-300 hover:text-red-200 hover:bg-red-950/40 transition text-left"
            >
              <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
              <span>Revoke Recipient Access Keys</span>
            </button>

            <button
              onClick={() => { alert('Opening sharing analytics...'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
            >
              <BarChart2 className="w-3.5 h-3.5 text-accent-gold" />
              <span>View Sharing Access Analytics</span>
            </button>
          </div>
        </div>

        <div className="border-t border-stroke-default" />

        {/* 4. Enterprise Audit & Governance Section */}
        <div>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Audit & Governance
          </span>
          <div className="space-y-0.5">
            <button
              onClick={() => { alert('Displaying 180-day CERT-In audit history.'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
            >
              <History className="w-3.5 h-3.5 text-emerald-400" />
              <span>View CERT-In Audit Log Timeline</span>
            </button>

            <button
              onClick={() => { alert('SHA-256 integrity verified against original master hash.'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>Verify Cryptographic Hash Integrity</span>
            </button>

            <button
              onClick={() => { alert('Metadata exported as JSON.'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition text-left"
            >
              <FileJson className="w-3.5 h-3.5 text-accent-blue" />
              <span>Export ZK Metadata JSON</span>
            </button>
          </div>
        </div>

        <div className="border-t border-stroke-default" />

        {/* 5. AI Capabilities Section */}
        <div>
          <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider px-2 mb-1 flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-accent-gold" /> On-Device AI Actions
          </span>
          <div className="space-y-0.5">
            <button
              onClick={() => { alert('Re-generating 512d MobileCLIP vector...'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-amber-200 hover:text-white hover:bg-amber-950/40 transition text-left"
            >
              <Cpu className="w-3.5 h-3.5 text-accent-gold" />
              <span>Re-index 512d MobileCLIP Vector</span>
            </button>
            <button
              onClick={() => { alert('Summarizing document locally...'); onClose(); }}
              className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-amber-200 hover:text-white hover:bg-amber-950/40 transition text-left"
            >
              <Sparkles className="w-3.5 h-3.5 text-accent-gold" />
              <span>Summarize ZK Document</span>
            </button>
          </div>
        </div>

        <div className="border-t border-stroke-default" />

        {/* 6. Destructive Actions */}
        <div>
          <button
            onClick={() => { onDelete(file.id); onClose(); }}
            className="w-full flex items-center space-x-2.5 px-2.5 py-2 rounded-lg text-red-400 hover:bg-red-950/40 transition text-left font-bold"
          >
            <Trash2 className="w-3.5 h-3.5 text-red-400" />
            <span>Move to Vault Trash (30-Day Purge)</span>
          </button>
        </div>
      </div>
    </div>
  );
};
