import React, { useEffect, useRef } from 'react';
import {
  Eye, Download, Share2, ShieldAlert, Trash2, Edit3, FolderInput,
  Copy, Lock, Flame
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

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const items = [
    { label: 'Open / View Stream', icon: Eye, action: () => { onOpen(file); onClose(); } },
    { label: 'Create Secure 60s Link', icon: Share2, action: () => { alert(`60s Presigned ZK URL generated for ${file.fileNameEncrypted}`); onClose(); } },
    { label: 'Download Decrypted Blob', icon: Download, action: () => { alert(`Downloading decrypted payload for ${file.fileNameEncrypted}`); onClose(); } },
    { label: 'Apply Anti-Leak Watermark', icon: Lock, action: () => { alert('Watermark overlay policy enforced.'); onClose(); } },
    { label: 'Set Self-Destruct Expiry', icon: Flame, action: () => { alert('Self-destruct timer set for 24 hours.'); onClose(); } },
    { label: 'Revoke Access', icon: ShieldAlert, action: () => { alert('Recipients revoked.'); onClose(); } },
    { label: 'Rename Encrypted Meta', icon: Edit3, action: () => { alert('Rename prompt.'); onClose(); } },
    { label: 'Move to Folder', icon: FolderInput, action: () => { alert('Folder selector.'); onClose(); } },
    { label: 'Copy ZK Hash', icon: Copy, action: () => { navigator.clipboard.writeText(file.contentHash); alert('Content Hash copied!'); onClose(); } },
    { label: 'Move to Vault Trash', icon: Trash2, color: 'text-red-400 hover:bg-red-950/40', action: () => { onDelete(file.id); onClose(); } },
  ];

  return (
    <div
      ref={menuRef}
      style={{ top: `${position.y}px`, left: `${position.x}px` }}
      className="fixed z-50 w-56 glass-panel border border-stroke-default rounded-xl p-1.5 shadow-2xl animate-in fade-in zoom-in-95 duration-100"
    >
      <div className="px-3 py-1.5 border-b border-stroke-default mb-1 text-[11px] font-mono text-gray-400 truncate">
        {file.fileNameEncrypted}
      </div>

      <div className="space-y-0.5 text-xs">
        {items.map((item, index) => {
          const Icon = item.icon;
          return (
            <button
              key={index}
              onClick={item.action}
              className={`w-full flex items-center space-x-2.5 px-3 py-2 rounded-lg text-left transition hover:bg-surface-card ${
                item.color || 'text-gray-200 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
