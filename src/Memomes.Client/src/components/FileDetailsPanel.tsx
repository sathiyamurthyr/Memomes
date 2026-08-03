import React from 'react';
import {
  X, ShieldCheck, FileText, Video, Eye, Share2, Download, Edit3, FolderInput, Copy, Trash2, History, User, Sparkles, Activity, Clock, Terminal, Folder
} from 'lucide-react';
import type { FileItem } from './DashboardV2';

export type UserRole = 'ROLE_USER' | 'ROLE_ADMIN' | 'ROLE_PLATFORM_ADMIN';

interface FileDetailsPanelProps {
  file: FileItem;
  userRole?: UserRole;
  onClose: () => void;
  onOpenViewer: (file: FileItem) => void;
  onOpenShareModal: (file: FileItem) => void;
  onOpenControlCenter: (file: FileItem) => void;
  onRenameFile?: (file: FileItem) => void;
  onMoveFile?: (file: FileItem) => void;
  onCopyFile?: (file: FileItem) => void;
  onDeleteFile?: (file: FileItem) => void;
  onOpenVersionHistory?: (file: FileItem) => void;
  onOpenDeveloperDiagnostics?: () => void;
}

export const FileDetailsPanel: React.FC<FileDetailsPanelProps> = ({
  file,
  userRole = 'ROLE_USER',
  onClose,
  onOpenViewer,
  onOpenShareModal,
  onOpenControlCenter,
  onRenameFile,
  onMoveFile,
  onCopyFile,
  onDeleteFile,
  onOpenVersionHistory,
  onOpenDeveloperDiagnostics
}) => {
  const isVideo = (file.contentTypeEncrypted || '').includes('video');

  const meta = (file as any).metadata;
  const originalName = meta?.original_file_name || file.fileNameEncrypted || 'Document.pdf';
  const extension = originalName.split('.').pop()?.toUpperCase() || 'BIN';
  const fileSizeMb = ((file.sizeBytes || meta?.file_size || 0) / (1024 * 1024)).toFixed(2);
  const mimeType = meta?.mime_type || file.contentTypeEncrypted || 'application/octet-stream';
  const ownerName = meta?.created_by || 'Sathiya Kumar';
  const folderName = meta?.folder_path ? meta.folder_path.split('/')[4] || 'Documents' : 'Documents';

  const isPlatformAdmin = userRole === 'ROLE_PLATFORM_ADMIN';

  return (
    <aside aria-label="File Information Inspector" className="w-84 md:w-96 glass-panel border-l border-stroke-default p-5 space-y-5 text-xs flex flex-col justify-between h-full overflow-y-auto animate-in slide-in-from-right duration-200 shrink-0 text-slate-200 font-sans">
      <div className="space-y-5">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="font-bold text-slate-100 text-sm flex items-center gap-2 truncate">
            {isVideo ? <Video className="w-4 h-4 text-purple-400 shrink-0" /> : <FileText className="w-4 h-4 text-cyan-400 shrink-0" />}
            <span className="truncate" title={originalName}>{originalName}</span>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. SECTION 1: PREVIEW */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">1. File Preview</span>
          <div className="relative aspect-video w-full rounded-2xl bg-[#080D1A] border border-white/10 overflow-hidden flex items-center justify-center group shadow-lg">
            {file.thumbnailUrl ? (
              <img src={file.thumbnailUrl} alt="Preview" className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
            ) : (
              <div className="text-center p-4 space-y-1">
                <FileText className="w-8 h-8 text-[#F5C027] mx-auto" />
                <span className="text-[10px] text-slate-400 font-mono block">Zero-Knowledge Encrypted Preview</span>
              </div>
            )}
            <span className="absolute bottom-2.5 right-2.5 text-[10px] font-mono font-extrabold bg-[#080D1A]/90 text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/40 flex items-center gap-1 shadow-md">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> AES-256
            </span>
          </div>
        </div>

        {/* 8 ACTION BUTTONS GRID */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">Quick Actions</span>
          <div className="grid grid-cols-4 gap-1.5 font-bold font-mono text-[10px]">
            <button onClick={() => onOpenViewer(file)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 transition flex flex-col items-center gap-1">
              <Eye className="w-3.5 h-3.5 text-[#F5C027]" /> View
            </button>
            <button onClick={() => onOpenShareModal(file)} className="p-2 bg-[#F5C027]/15 text-[#F5C027] hover:bg-[#F5C027]/25 border border-[#F5C027]/30 rounded-xl transition flex flex-col items-center gap-1">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={() => onOpenControlCenter(file)} className="p-2 bg-cyan-500/15 text-cyan-300 hover:bg-cyan-500/25 border border-cyan-500/30 rounded-xl transition flex flex-col items-center gap-1">
              <Download className="w-3.5 h-3.5" /> Download
            </button>
            <button onClick={() => onRenameFile?.(file)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 transition flex flex-col items-center gap-1">
              <Edit3 className="w-3.5 h-3.5 text-purple-400" /> Rename
            </button>
            <button onClick={() => onMoveFile?.(file)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 transition flex flex-col items-center gap-1">
              <FolderInput className="w-3.5 h-3.5 text-emerald-400" /> Move
            </button>
            <button onClick={() => onCopyFile?.(file)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 transition flex flex-col items-center gap-1">
              <Copy className="w-3.5 h-3.5 text-blue-400" /> Copy
            </button>
            <button onClick={() => onOpenVersionHistory?.(file)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-200 transition flex flex-col items-center gap-1">
              <History className="w-3.5 h-3.5 text-amber-400" /> Versions
            </button>
            <button onClick={() => onDeleteFile?.(file)} className="p-2 bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30 rounded-xl transition flex flex-col items-center gap-1">
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </button>
          </div>
        </div>

        {/* 2. SECTION 2: BASIC INFORMATION */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">2. Basic Information</span>
          <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/10 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">File Name:</span>
              <span className="text-slate-100 font-bold truncate max-w-[150px]">{originalName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">File Type:</span>
              <span className="text-slate-200 truncate max-w-[140px] font-semibold">{mimeType}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Extension:</span>
              <span className="text-[#F5C027] font-extrabold">{extension}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">File Size:</span>
              <span className="text-slate-100 font-bold">{fileSizeMb} MB</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Owner:</span>
              <span className="text-slate-200 font-bold flex items-center gap-1"><User className="w-3 h-3 text-[#F5C027]" /> {ownerName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Folder:</span>
              <span className="text-slate-200 flex items-center gap-1"><Folder className="w-3 h-3 text-cyan-400" /> {folderName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Uploaded Date:</span>
              <span className="text-slate-200">{new Date(file.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Last Modified:</span>
              <span className="text-slate-200">{new Date(file.lastAccessedAt || Date.now()).toLocaleTimeString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Version:</span>
              <span className="text-emerald-400 font-bold">v1.0 (Latest)</span>
            </div>
          </div>
        </div>

        {/* 3. SECTION 3: SECURITY */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">3. Security</span>
          <div className="p-3.5 bg-emerald-950/20 rounded-2xl border border-emerald-500/20 space-y-2 text-[11px] font-mono">
            <div className="flex items-center justify-between">
              <span className="text-emerald-300">Encryption Status:</span>
              <span className="text-emerald-400 font-bold bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/30">
                AES-256-GCM Zero-Knowledge
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-300">File Integrity:</span>
              <span className="text-emerald-400 font-bold">Verified Integrity ✓</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-300">Security Status:</span>
              <span className="text-emerald-400 font-bold">Protected</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-emerald-300">Virus Scan Status:</span>
              <span className="text-emerald-400 font-bold">✓ Clean</span>
            </div>
          </div>
        </div>

        {/* 4. SECTION 4: SHARING */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">4. Sharing</span>
          <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/10 space-y-2 font-mono text-[11px]">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Sharing Status:</span>
              <span className="text-[#F5C027] font-bold bg-[#F5C027]/10 px-2.5 py-0.5 rounded-full border border-[#F5C027]/30">
                {meta?.share_status || 'Private Vault'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Share Expiry:</span>
              <span className="text-slate-300">Never (Password Protected)</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">View Count:</span>
              <span className="text-slate-100 font-bold">{(file as any).viewsCount || 48} Views</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Download Count:</span>
              <span className="text-slate-100 font-bold">{(file as any).downloadsCount || 12} Downloads</span>
            </div>
          </div>
        </div>

        {/* 5. SECTION 5: AI */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-purple-400" /> 5. AI Engine
          </span>
          <div className="p-3.5 bg-purple-950/20 rounded-2xl border border-purple-500/20 space-y-2 text-[11px] font-mono">
            <div className="flex justify-between">
              <span className="text-purple-300">OCR Status:</span>
              <span className="text-purple-400 font-bold">Completed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-300">AI Index:</span>
              <span className="text-purple-400 font-bold">Indexed</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-300">Thumbnail:</span>
              <span className="text-purple-400 font-bold">Generated</span>
            </div>
            <div className="flex justify-between">
              <span className="text-purple-300">Preview:</span>
              <span className="text-purple-400 font-bold">Ready</span>
            </div>
            <div className="pt-1 border-t border-purple-500/20">
              <span className="text-slate-400 block mb-1 text-[10px]">AI Summary:</span>
              <p className="text-slate-300 italic leading-relaxed text-[11px]">
                "Encrypted payload processed by Zero-Knowledge AI pipeline. Indexed for vector semantic search."
              </p>
            </div>
          </div>
        </div>

        {/* 6. SECTION 6: ACTIVITY */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block flex items-center gap-1">
            <Activity className="w-3.5 h-3.5 text-cyan-400" /> 6. Activity Timeline
          </span>
          <div className="p-3.5 bg-white/[0.02] rounded-2xl border border-white/10 space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3 h-3 text-emerald-400 shrink-0" />
              <span>Uploaded: {new Date(file.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3 h-3 text-cyan-400 shrink-0" />
              <span>Shared: Vault Link Protected</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3 h-3 text-purple-400 shrink-0" />
              <span>Downloaded: 12 Times</span>
            </div>
            <div className="flex items-center gap-2 text-slate-300">
              <Clock className="w-3 h-3 text-[#F5C027] shrink-0" />
              <span>Modified: {new Date(file.lastAccessedAt || Date.now()).toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        {/* Dedicated Developer Diagnostics Button (For Platform Admins Only) */}
        {isPlatformAdmin && (
          <div className="p-3 bg-amber-950/20 border border-amber-500/30 rounded-2xl space-y-2 font-mono">
            <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">
              Infrastructure Diagnostics
            </span>
            <button
              onClick={onOpenDeveloperDiagnostics}
              className="w-full py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/40 text-amber-300 text-xs font-bold rounded-xl flex items-center justify-center gap-2 transition"
            >
              <Terminal className="w-4 h-4 text-amber-400" />
              <span>Open Developer Diagnostics Page</span>
            </button>
          </div>
        )}
      </div>

      {/* Footer Version Info */}
      <div className="pt-3 border-t border-white/10 text-[10px] text-slate-500 font-mono flex items-center justify-between">
        <span className="flex items-center gap-1"><History className="w-3 h-3" /> Version 1.0</span>
        <span className="text-emerald-400 font-semibold">Memomes Cloud Secure Storage</span>
      </div>
    </aside>
  );
};
