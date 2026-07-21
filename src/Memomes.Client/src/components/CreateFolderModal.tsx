import React, { useState } from 'react';
import { FolderPlus, Lock, X, Sparkles, Check } from 'lucide-react';

interface CreateFolderModalProps {
  parentFolder?: string;
  onClose: () => void;
  onCreateFolder: (folderDetails: { name: string; parent: string; color: string; isEncrypted: boolean }) => void;
}

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  parentFolder = 'My Files',
  onClose,
  onCreateFolder
}) => {
  const [folderName, setFolderName] = useState('');
  const [selectedParent, setSelectedParent] = useState(parentFolder);
  const [folderColor, setFolderColor] = useState('#FFC928');
  const [isEncrypted, setIsEncrypted] = useState(true);

  const colors = [
    { label: 'Gold', hex: '#FFC928' },
    { label: 'Primary Maroon', hex: '#A00D3A' },
    { label: 'Accent Blue', hex: '#3B82F6' },
    { label: 'Emerald Green', hex: '#10B981' },
    { label: 'Purple', hex: '#A855F7' },
    { label: 'Amber', hex: '#F59E0B' },
  ];

  const parentOptions = [
    'My Files',
    'Photos',
    'Videos',
    'Documents',
    'Audio',
    'Archives',
    'Office Files'
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    onCreateFolder({
      name: folderName.trim(),
      parent: selectedParent,
      color: folderColor,
      isEncrypted
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-md glass-card rounded-2xl border border-stroke-default p-6 space-y-5 shadow-2xl relative text-xs">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-card transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-stroke-default pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
            <FolderPlus className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Create New Folder</h3>
            <p className="text-xs text-gray-400">Zero-Knowledge Encrypted Folder Envelope</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Folder Name */}
          <div>
            <label className="block text-gray-300 font-bold mb-1">Folder Name</label>
            <input
              type="text"
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Legal Documents 2026, Tax Receipts..."
              className="w-full bg-surface border border-stroke-default rounded-xl px-3.5 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold font-mono text-xs"
            />
          </div>

          {/* Parent Folder Selector */}
          <div>
            <label className="block text-gray-300 font-bold mb-1">Parent Location</label>
            <select
              value={selectedParent}
              onChange={(e) => setSelectedParent(e.target.value)}
              className="w-full bg-surface border border-stroke-default rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-accent-gold"
            >
              {parentOptions.map((opt, i) => (
                <option key={i} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          {/* Color Accent Selector */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">Folder Accent Color</label>
            <div className="flex items-center space-x-3">
              {colors.map(c => (
                <button
                  key={c.hex}
                  type="button"
                  onClick={() => setFolderColor(c.hex)}
                  className="w-7 h-7 rounded-full flex items-center justify-center border transition"
                  style={{ backgroundColor: c.hex, borderColor: folderColor === c.hex ? '#FFFFFF' : 'transparent' }}
                >
                  {folderColor === c.hex && <Check className="w-3.5 h-3.5 text-black font-extrabold" />}
                </button>
              ))}
            </div>
          </div>

          {/* Encrypt Folder Envelope Toggle */}
          <div className="p-3 bg-surface rounded-xl border border-stroke-default flex items-center justify-between">
            <div>
              <div className="font-bold text-gray-200 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-400" /> Zero-Knowledge Envelope
              </div>
              <div className="text-[10px] text-gray-500">Encrypt folder metadata on client</div>
            </div>
            <input
              type="checkbox"
              checked={isEncrypted}
              onChange={(e) => setIsEncrypted(e.target.checked)}
              className="rounded border-stroke-default accent-primary w-4 h-4"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 bg-surface hover:bg-surface-card border border-stroke-default text-gray-300 font-bold rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!folderName.trim()}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white font-bold rounded-xl transition flex items-center justify-center gap-1.5 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-accent-gold" /> Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
