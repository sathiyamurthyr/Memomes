import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Eye, Download, MoveRight, Trash2, Edit3, Tag, History,
  Share2, Loader2, AlertCircle, Check
} from 'lucide-react';
import type { FileItem } from './DashboardV2';
import { LocalVaultDb } from '../utils/localVaultDb';
import { auditLogger } from '../utils/auditLogger';

interface FileContextMenuProps {
  file: FileItem;
  position: { x: number; y: number };
  onClose: () => void;
  onOpen: (file: FileItem) => void;
  onDelete: (fileId: string) => void;
  onShare?: (file: FileItem) => void;
  onRename?: (file: FileItem) => void;
  onMove?: (file: FileItem) => void;
}

type ToastVariant = 'success' | 'error' | 'warning';

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  file,
  position,
  onClose,
  onOpen,
  onDelete,
  onShare,
  onRename,
  onMove
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [loadingKey, setLoadingKey] = useState<string | null>(null);
  const [inlineToast, setInlineToast] = useState<{ msg: string; variant: ToastVariant } | null>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Keyboard: Esc closes menu
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const showInlineToast = (msg: string, variant: ToastVariant) => {
    setInlineToast({ msg, variant });
    setTimeout(() => setInlineToast(null), 3000);
  };

  const adjustedX = Math.min(position.x, window.innerWidth - 270);
  const adjustedY = Math.min(position.y, window.innerHeight - 470);

  // ── VIEW / STREAM ────────────────────────────────────────────────────────────
  const handleView = useCallback(async () => {
    if (loadingKey) return;
    setLoadingKey('view');
    auditLogger.trackAnalytics('context_view_clicked', { fileId: file.id, fileName: file.name });
    try {
      onOpen(file);
      auditLogger.logAudit('VIEW_FILE', `Context menu: Viewed file ${file.name}`, 'SUCCESS');
    } finally {
      setLoadingKey(null);
      onClose();
    }
  }, [file, loadingKey, onOpen, onClose]);

  // ── DOWNLOAD ─────────────────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    if (loadingKey) return;
    setLoadingKey('download');
    auditLogger.trackAnalytics('context_download_clicked', { fileId: file.id, fileName: file.name });
    try {
      const vaultFile = LocalVaultDb.getFile(file.id);
      if (!vaultFile?.dataUrl) {
        showInlineToast('File payload not available. Please re-upload.', 'warning');
        auditLogger.logAudit('DOWNLOAD_FILE', `Context menu: payload unavailable for ${file.name}`, 'WARNING');
        return;
      }
      const a = document.createElement('a');
      a.href = vaultFile.dataUrl;
      a.download = vaultFile.metadata?.original_file_name || vaultFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      auditLogger.logAudit('DOWNLOAD_FILE', `Context menu: Downloaded ${file.name}`, 'SUCCESS');
      auditLogger.trackAnalytics('context_download_success', { fileId: file.id });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showInlineToast('Download failed. Try again.', 'error');
      auditLogger.logAudit('DOWNLOAD_FILE', `Download failed for ${file.name}: ${msg}`, 'FAILED');
    } finally {
      setLoadingKey(null);
    }
  }, [file, loadingKey, onClose]);

  // ── COPY ZK HASH ─────────────────────────────────────────────────────────────
  const handleCopyHash = useCallback(async () => {
    if (loadingKey) return;
    setLoadingKey('copy');
    try {
      const hashText = (file as any).contentHash || file.id;
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(hashText);
      } else {
        const ta = document.createElement('textarea');
        ta.value = hashText;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      showInlineToast('ZK Hash copied to clipboard.', 'success');
      auditLogger.trackAnalytics('context_hash_copied', { fileId: file.id });
    } catch {
      showInlineToast('Clipboard write denied.', 'error');
    } finally {
      setLoadingKey(null);
    }
  }, [file, loadingKey]);

  // ── SHARE ────────────────────────────────────────────────────────────────────
  const handleShare = useCallback(() => {
    if (loadingKey) return;
    auditLogger.trackAnalytics('context_share_clicked', { fileId: file.id });
    if (onShare) {
      onShare(file);
    }
    onClose();
  }, [file, loadingKey, onShare, onClose]);

  // ── RENAME ───────────────────────────────────────────────────────────────────
  const handleRename = useCallback(() => {
    if (loadingKey) return;
    auditLogger.trackAnalytics('context_rename_clicked', { fileId: file.id });
    if (onRename) {
      onRename(file);
    } else {
      showInlineToast('Rename: select file in info panel for full rename dialog.', 'warning');
    }
    onClose();
  }, [file, loadingKey, onRename, onClose]);

  // ── MOVE ─────────────────────────────────────────────────────────────────────
  const handleMove = useCallback(() => {
    if (loadingKey) return;
    auditLogger.trackAnalytics('context_move_clicked', { fileId: file.id });
    if (onMove) {
      onMove(file);
    } else {
      showInlineToast('Move: select file in info panel for full folder picker.', 'warning');
    }
    onClose();
  }, [file, loadingKey, onMove, onClose]);

  // ── DELETE ───────────────────────────────────────────────────────────────────
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleDeleteClick = useCallback(() => {
    if (loadingKey) return;
    auditLogger.trackAnalytics('context_delete_clicked', { fileId: file.id });
    setConfirmDelete(true);
  }, [file, loadingKey]);

  const handleDeleteConfirm = useCallback(() => {
    if (loadingKey) return;
    setLoadingKey('delete');
    try {
      onDelete(file.id);
      auditLogger.logAudit('DELETE_FILE', `Context menu: Deleted ${file.name}`, 'SUCCESS');
      auditLogger.trackAnalytics('context_delete_success', { fileId: file.id });
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      showInlineToast(`Delete failed: ${msg}`, 'error');
      auditLogger.logAudit('DELETE_FILE', `Context menu delete failed for ${file.name}: ${msg}`, 'FAILED');
    } finally {
      setLoadingKey(null);
      onClose();
    }
  }, [file, loadingKey, onDelete, onClose]);

  return (
    <div
      ref={menuRef}
      role="menu"
      aria-label={`File actions for ${file.fileNameEncrypted || file.name}`}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-64 bg-surface-container/95 border border-stroke-default rounded-xl shadow-2xl backdrop-blur-xl p-1.5 space-y-1 font-sans text-xs animate-in fade-in duration-100"
    >
      {/* Top Header & Security Badges */}
      <div className="px-3 py-2 border-b border-stroke-default space-y-1">
        <div className="font-bold text-gray-100 truncate">{file.fileNameEncrypted || file.name}</div>
        <div className="flex items-center space-x-1 text-[10px] font-mono text-gray-400">
          <span className="text-accent-gold">{(file as any).accessTier || 'PRIVATE'}</span>
          <span>·</span>
          <span>{(((file as any).sizeBytes || 0) / 1024 / 1024).toFixed(1)} MB</span>
        </div>
        <div className="flex items-center space-x-1.5 pt-0.5">
          <span className="px-1.5 py-0.5 bg-emerald-950/60 border border-emerald-500/30 text-emerald-400 text-[9px] font-bold rounded">
            AES-256-GCM
          </span>
          <span className="px-1.5 py-0.5 bg-surface text-gray-400 border border-stroke-default text-[9px] font-mono rounded">
            Zero-Knowledge
          </span>
        </div>
      </div>

      {/* Inline Toast */}
      {inlineToast && (
        <div className={`mx-1.5 px-2.5 py-1.5 rounded-lg text-[11px] font-medium flex items-center gap-1.5 ${
          inlineToast.variant === 'success' ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-500/30' :
          inlineToast.variant === 'error'   ? 'bg-red-950/60    text-red-400    border border-red-500/30'    :
          'bg-amber-950/60 text-amber-400 border border-amber-500/30'
        }`}>
          {inlineToast.variant === 'success' ? <Check className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
          {inlineToast.msg}
        </div>
      )}

      {/* Delete Confirmation Inline */}
      {confirmDelete ? (
        <div className="px-2 py-2 space-y-2">
          <p className="text-[11px] text-red-300 font-medium">Move to Recycle Bin?</p>
          <div className="flex gap-2">
            <button
              onClick={() => setConfirmDelete(false)}
              className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteConfirm}
              disabled={loadingKey === 'delete'}
              className="flex-1 py-1.5 text-[11px] font-semibold rounded-lg bg-red-500/20 text-red-300 hover:bg-red-500/30 transition flex items-center justify-center gap-1"
            >
              {loadingKey === 'delete'
                ? <Loader2 className="w-3 h-3 animate-spin" />
                : <Trash2 className="w-3 h-3" />
              }
              Delete
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Group 1: Core Actions */}
          <div className="py-1" role="group" aria-label="View and download actions">
            <button
              role="menuitem"
              onClick={handleView}
              disabled={!!loadingKey}
              aria-label="Preview file in secure viewer"
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition font-bold disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-white/30"
            >
              {loadingKey === 'view'
                ? <Loader2 className="w-4 h-4 text-accent-gold animate-spin" />
                : <Eye className="w-4 h-4 text-accent-gold" />
              }
              <span>Preview File</span>
            </button>

            <button
              role="menuitem"
              onClick={handleDownload}
              disabled={!!loadingKey}
              aria-label="Download decrypted file"
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition disabled:opacity-50 disabled:cursor-not-allowed focus-visible:ring-1 focus-visible:ring-white/30"
            >
              {loadingKey === 'download'
                ? <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
                : <Download className="w-4 h-4 text-emerald-400" />
              }
              <span>Download File</span>
            </button>

            <button
              role="menuitem"
              onClick={handleShare}
              disabled={!!loadingKey}
              aria-label="Share secure link"
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Share2 className="w-4 h-4 text-amber-400" />
              <span>Share Secure Link</span>
            </button>

            <button
              role="menuitem"
              onClick={handleCopyHash}
              disabled={!!loadingKey}
              aria-label="Copy zero-knowledge hash to clipboard"
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loadingKey === 'copy'
                ? <Loader2 className="w-4 h-4 text-accent-blue animate-spin" />
                : <Tag className="w-4 h-4 text-accent-blue" />
              }
              <span>Copy ZK Hash</span>
            </button>
          </div>

          <div className="border-t border-stroke-default my-1" />

          {/* Group 2: File Management */}
          <div className="py-1" role="group" aria-label="File management actions">
            <button
              role="menuitem"
              onClick={handleRename}
              disabled={!!loadingKey}
              aria-label="Rename file"
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-surface-card transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Edit3 className="w-4 h-4 text-gray-400" />
              <span>Rename File</span>
            </button>

            <button
              role="menuitem"
              onClick={handleMove}
              disabled={!!loadingKey}
              aria-label="Move to folder"
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-surface-card transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <MoveRight className="w-4 h-4 text-gray-400" />
              <span>Move to Folder</span>
            </button>

            <button
              role="menuitem"
              onClick={() => { auditLogger.trackAnalytics('context_history_clicked', { fileId: file.id }); onClose(); }}
              aria-label="View version history"
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-surface-card transition"
            >
              <History className="w-4 h-4 text-gray-400" />
              <span>Version History</span>
            </button>

            <button
              role="menuitem"
              onClick={handleDeleteClick}
              disabled={!!loadingKey}
              aria-label="Delete file — move to recycle bin"
              className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>Delete to Trash</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
