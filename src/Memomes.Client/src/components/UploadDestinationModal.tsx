import React, { useState } from 'react';
import {
  Folder, Lock, Users, Share2, Upload, X, ChevronRight, Plus, ShieldCheck,
  FileText
} from 'lucide-react';
import { CreateFolderModal } from './CreateFolderModal';

interface UploadDestinationModalProps {
  filesToUpload?: FileList | null;
  onConfirmDestination: (destination: string, folderPath: string) => void;
  onClose: () => void;
}

export const UploadDestinationModal: React.FC<UploadDestinationModalProps> = ({
  filesToUpload,
  onConfirmDestination,
  onClose
}) => {
  const [selectedDest, setSelectedDest] = useState<'my-files' | 'digital-vault' | 'team-folder' | 'shared-workspace'>('my-files');
  const [selectedCategory, setSelectedCategory] = useState('Photos');
  const [selectedSubfolder, setSelectedSubfolder] = useState('Goa_Vacation_2026');
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);

  const [customFolders, setCustomFolders] = useState<string[]>([
    'Goa_Vacation_2026',
    'Legal_Deeds_2025',
    'Tax_Receipts'
  ]);

  const destinations = [
    { id: 'my-files', label: 'My Files', desc: 'Standard encrypted storage organized by categories & subfolders', icon: Folder, color: 'text-accent-gold' },
    { id: 'digital-vault', label: 'Digital Vault', desc: 'Isolated 3-of-2 Shamir protected zero-access vault', icon: Lock, color: 'text-purple-400' },
    { id: 'team-folder', label: 'Team Folder', desc: 'Shared folder accessible by organization members', icon: Users, color: 'text-accent-blue' },
    { id: 'shared-workspace', label: 'Shared Workspace', desc: 'Collaborative space for external project links', icon: Share2, color: 'text-emerald-400' },
  ];

  const categories = [
    'Photos',
    'Videos',
    'Documents',
    'Audio',
    'Archives',
    'Office Files'
  ];

  const firstFile = filesToUpload && filesToUpload.length > 0 ? filesToUpload[0] : null;
  const fileCount = filesToUpload ? filesToUpload.length : 1;
  const totalSizeBytes = filesToUpload
    ? Array.from(filesToUpload).reduce((acc, f) => acc + f.size, 0)
    : 154000000;

  const targetPathDisplay = selectedDest === 'digital-vault'
    ? 'Digital Vault'
    : `My Files > ${selectedCategory} > ${selectedSubfolder}`;

  const handleCreateCustomFolder = (folderDetails: { name: string }) => {
    setCustomFolders(prev => [...prev, folderDetails.name]);
    setSelectedSubfolder(folderDetails.name);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-lg glass-card rounded-2xl border border-stroke-default p-6 space-y-5 shadow-2xl relative text-xs">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-card transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div>
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent-gold" /> Upload Destination & Payload Summary
          </h3>
          <p className="text-gray-400 text-xs mt-1">Select where your client-encrypted files will be saved in S3 object storage.</p>
        </div>

        {/* Upload Summary Box */}
        {firstFile && (
          <div className="p-3.5 bg-surface rounded-xl border border-stroke-default space-y-2">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-200 flex items-center gap-1.5 font-mono">
                <FileText className="w-4 h-4 text-accent-blue" /> {firstFile.name} {fileCount > 1 ? `(+${fileCount - 1} more)` : ''}
              </span>
              <span className="text-emerald-400 font-bold font-mono text-[10px] bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> AES-256-GCM
              </span>
            </div>
            <div className="flex items-center justify-between text-[11px] font-mono text-gray-400">
              <span>Total Payload Size: {(totalSizeBytes / 1024 / 1024).toFixed(2)} MB</span>
              <span className="text-accent-gold font-bold">{targetPathDisplay}</span>
            </div>
          </div>
        )}

        {/* Destination Cards Selector */}
        <div className="space-y-2">
          {destinations.map(d => {
            const Icon = d.icon;
            const isSelected = selectedDest === d.id;
            return (
              <button
                key={d.id}
                type="button"
                onClick={() => setSelectedDest(d.id as any)}
                className={`w-full p-3 rounded-xl border text-left transition flex items-center justify-between ${
                  isSelected
                    ? 'bg-surface-card border-accent-gold text-white shadow-sm'
                    : 'bg-surface border-stroke-default text-gray-400 hover:text-white'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-stroke-default">
                    <Icon className={`w-4 h-4 ${d.color}`} />
                  </div>
                  <div>
                    <div className="font-bold text-gray-200">{d.label}</div>
                    <div className="text-[10px] text-gray-500">{d.desc}</div>
                  </div>
                </div>
                {isSelected && <ChevronRight className="w-4 h-4 text-accent-gold" />}
              </button>
            );
          })}
        </div>

        {/* Folder & Subfolder Selectors (When My Files is chosen) */}
        {selectedDest === 'my-files' && (
          <div className="space-y-3 p-3.5 bg-surface rounded-xl border border-stroke-default">
            <div className="flex justify-between items-center">
              <span className="font-bold text-gray-300">Target Folder & Subfolder</span>
              <button
                type="button"
                onClick={() => setShowCreateFolderModal(true)}
                className="text-[11px] text-accent-gold hover:underline font-bold flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> New Folder
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Category Folder</label>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full bg-surface-container border border-stroke-default rounded-xl px-2.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-accent-gold"
                >
                  {categories.map((c, i) => (
                    <option key={i} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-gray-400 mb-1">Subfolder</label>
                <select
                  value={selectedSubfolder}
                  onChange={(e) => setSelectedSubfolder(e.target.value)}
                  className="w-full bg-surface-container border border-stroke-default rounded-xl px-2.5 py-2 text-white font-mono text-xs focus:outline-none focus:border-accent-gold"
                >
                  {customFolders.map((sf, i) => (
                    <option key={i} value={sf}>{sf}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-surface hover:bg-surface-card border border-stroke-default text-gray-300 font-bold rounded-xl transition"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirmDestination(selectedDest, targetPathDisplay);
              onClose();
            }}
            className="flex-2 py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2 px-6"
          >
            <Upload className="w-4 h-4 text-accent-gold" /> Encrypt & Save to {targetPathDisplay}
          </button>
        </div>
      </div>

      {/* Embedded Create Folder Modal */}
      {showCreateFolderModal && (
        <CreateFolderModal
          parentFolder={`My Files / ${selectedCategory}`}
          onClose={() => setShowCreateFolderModal(false)}
          onCreateFolder={handleCreateCustomFolder}
        />
      )}
    </div>
  );
};
