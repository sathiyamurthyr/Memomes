import React, { useEffect, useRef } from 'react';
import {
  Eye, Download, MoveRight, Copy, Trash2, Edit3, Tag, History
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
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const adjustedX = Math.min(position.x, window.innerWidth - 260);
  const adjustedY = Math.min(position.y, window.innerHeight - 450);

  return (
    <div
      ref={menuRef}
      style={{ top: `${adjustedY}px`, left: `${adjustedX}px` }}
      className="fixed z-50 w-64 bg-surface-container/95 border border-stroke-default rounded-xl shadow-2xl backdrop-blur-xl p-1.5 space-y-1 font-sans text-xs animate-in fade-in duration-100"
    >
      {/* Top Header & Security Badges */}
      <div className="px-3 py-2 border-b border-stroke-default space-y-1">
        <div className="font-bold text-gray-100 truncate">{file.fileNameEncrypted}</div>
        <div className="flex items-center space-x-1 text-[10px] font-mono text-gray-400">
          <span className="text-accent-gold">{file.accessTier}</span>
          <span>·</span>
          <span>{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
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

      {/* Group 1: Core Viewing & Stream Actions */}
      <div className="py-1">
        <button
          onClick={() => { onOpen(file); onClose(); }}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition font-bold"
        >
          <Eye className="w-4 h-4 text-accent-gold" />
          <span>View Stream</span>
        </button>

        <button
          onClick={() => { onClose(); }}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          <span>Download Encrypted Payload</span>
        </button>

        <button
          onClick={() => { navigator.clipboard.writeText(file.contentHash); onClose(); }}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-200 hover:text-white hover:bg-surface-card transition"
        >
          <Copy className="w-4 h-4 text-accent-blue" />
          <span>Copy ZK Hash</span>
        </button>
      </div>

      <div className="border-t border-stroke-default my-1" />

      {/* Group 2: Secondary Operations */}
      <div className="py-1">
        <button
          onClick={() => { onClose(); }}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-surface-card transition"
        >
          <Edit3 className="w-4 h-4 text-gray-400" />
          <span>Rename File</span>
        </button>

        <button
          onClick={() => { onClose(); }}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-surface-card transition"
        >
          <MoveRight className="w-4 h-4 text-gray-400" />
          <span>Move to Folder</span>
        </button>

        <button
          onClick={() => { onClose(); }}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-surface-card transition"
        >
          <Tag className="w-4 h-4 text-gray-400" />
          <span>Edit Tags</span>
        </button>

        <button
          onClick={() => { onClose(); }}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-gray-300 hover:text-white hover:bg-surface-card transition"
        >
          <History className="w-4 h-4 text-gray-400" />
          <span>Version History</span>
        </button>

        <button
          onClick={() => { onDelete(file.id); onClose(); }}
          className="w-full flex items-center space-x-2 px-2.5 py-1.5 rounded-lg text-red-400 hover:bg-red-950/40 transition font-bold"
        >
          <Trash2 className="w-4 h-4 text-red-400" />
          <span>Delete to Trash</span>
        </button>
      </div>
    </div>
  );
};
