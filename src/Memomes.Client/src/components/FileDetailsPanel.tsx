import React from 'react';
import {
  X, ShieldCheck, FileText, Video, Eye, Share2, Copy,
  User, History
} from 'lucide-react';
import type { FileItem } from '../components/DashboardV2';

interface FileDetailsPanelProps {
  file: FileItem;
  onClose: () => void;
  onOpenViewer: (file: FileItem) => void;
  onOpenShareModal: (file: FileItem) => void;
  onOpenControlCenter: (file: FileItem) => void;
}

export const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({
  file,
  onClose,
  onOpenViewer,
  onOpenShareModal,
  onOpenControlCenter
}) => {
  const isVideo = file.contentTypeEncrypted.includes('video');

  return (
    <aside aria-label="File Details Inspector" className="w-80 glass-panel border-l border-stroke-default p-5 space-y-5 text-xs flex flex-col justify-between h-full overflow-y-auto animate-in slide-in-from-right duration-200 shrink-0">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-stroke-default pb-3">
          <div className="font-bold text-gray-200 text-sm flex items-center gap-2 truncate">
            {isVideo ? <Video className="w-4 h-4 text-primary shrink-0" /> : <FileText className="w-4 h-4 text-accent-blue shrink-0" />}
            <span className="truncate">{file.fileNameEncrypted}</span>
          </div>
          <button onClick={onClose} className="p-1 text-gray-400 hover:text-white rounded-lg hover:bg-surface-card transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Thumbnail Preview Card */}
        <div className="relative aspect-video w-full rounded-xl bg-surface border border-stroke-default overflow-hidden flex items-center justify-center">
          {file.thumbnailUrl ? (
            <img src={file.thumbnailUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="text-center p-4">
              <FileText className="w-8 h-8 text-accent-blue mx-auto mb-1" />
              <span className="text-[10px] text-gray-400 font-mono">Encrypted Preview Ready</span>
            </div>
          )}
          <span className="absolute bottom-2 right-2 text-[10px] font-extrabold bg-black/80 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3" /> AES-256
          </span>
        </div>

        {/* Primary Actions Grid */}
        <div className="grid grid-cols-3 gap-1.5 font-bold">
          <button onClick={() => onOpenViewer(file)} className="py-2 bg-surface hover:bg-surface-card border border-stroke-default rounded-lg text-gray-200 transition flex items-center justify-center gap-1">
            <Eye className="w-3.5 h-3.5 text-accent-gold" /> View
          </button>
          <button onClick={() => onOpenShareModal(file)} className="py-2 bg-primary/20 text-accent-gold hover:bg-primary/40 border border-primary/30 rounded-lg transition flex items-center justify-center gap-1">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <button onClick={() => onOpenControlCenter(file)} className="py-2 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg transition flex items-center justify-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" /> Control
          </button>
        </div>

        {/* File Information Section */}
        <div className="space-y-2.5 pt-2">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">File Information</span>

          <div className="p-3 bg-surface rounded-xl border border-stroke-default space-y-2 font-mono text-[11px]">
            <div className="flex justify-between">
              <span className="text-gray-400">Owner:</span>
              <span className="text-gray-200 font-bold flex items-center gap-1"><User className="w-3 h-3 text-accent-gold" /> Sathiya Kumar</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">File Size:</span>
              <span className="text-gray-200">{(file.sizeBytes / 1024 / 1024).toFixed(2)} MB</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Content Type:</span>
              <span className="text-gray-200 truncate max-w-[140px]">{file.contentTypeEncrypted}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Created:</span>
              <span className="text-gray-200">{new Date(file.createdAt).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-400">Last Access:</span>
              <span className="text-gray-200">{new Date(file.lastAccessedAt).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Cryptographic & Security Details */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Cryptographic Security</span>

          <div className="p-3 bg-surface rounded-xl border border-stroke-default space-y-2 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-gray-400 font-mono">ZK SHA-256 Hash:</span>
              <button
                onClick={() => { navigator.clipboard.writeText(file.contentHash); alert('Content hash copied!'); }}
                className="text-accent-gold hover:text-white flex items-center gap-1"
                title="Copy Hash"
              >
                <Copy className="w-3 h-3" />
              </button>
            </div>
            <div className="font-mono text-[10px] text-gray-300 bg-surface-container p-2 rounded border border-stroke-default break-all">
              {file.contentHash}
            </div>

            <div className="flex justify-between font-mono pt-1">
              <span className="text-gray-400">Access Tier:</span>
              <span className="text-accent-gold font-bold">{file.accessTier}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-gray-400">Storage Class:</span>
              <span className={file.isColdStorage ? 'text-blue-400' : 'text-emerald-400'}>
                {file.isColdStorage ? 'Cold Glacier' : 'Hot S3 Tier'}
              </span>
            </div>
          </div>
        </div>

        {/* Sharing Details */}
        <div className="space-y-2.5">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">Sharing & Envelopes</span>
          <div className="p-3 bg-surface rounded-xl border border-stroke-default flex items-center justify-between font-mono text-[11px]">
            <span className="text-gray-400">Active Recipients:</span>
            <span className="text-accent-gold font-bold bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/30">
              {file.activeSharesCount || 0} Recipients
            </span>
          </div>
        </div>
      </div>

      {/* Footer Version Info */}
      <div className="pt-3 border-t border-stroke-default text-[10px] text-gray-500 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1"><History className="w-3 h-3" /> Version 1.0 (Latest)</span>
        <span>MinIO S3</span>
      </div>
    </aside>
  );
};
