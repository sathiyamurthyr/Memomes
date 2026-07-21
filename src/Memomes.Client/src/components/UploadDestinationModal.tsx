import React, { useState } from 'react';
import { Folder, Lock, Users, Share2, Upload, X, ChevronRight } from 'lucide-react';

interface UploadDestinationModalProps {
  onConfirmDestination: (destination: string, folderName: string) => void;
  onClose: () => void;
}

export const UploadDestinationModal: React.FC<UploadDestinationModalProps> = ({
  onConfirmDestination,
  onClose
}) => {
  const [selectedDest, setSelectedDest] = useState<'my-files' | 'digital-vault' | 'team-folder' | 'shared-workspace'>('my-files');
  const [selectedFolder, setSelectedFolder] = useState('Auto (Smart Categorize)');

  const destinations = [
    { id: 'my-files', label: 'My Files', desc: 'Standard encrypted storage organized by categories', icon: Folder, color: 'text-accent-gold' },
    { id: 'digital-vault', label: 'Digital Vault', desc: 'Isolated 3-of-2 Shamir protected zero-access vault', icon: Lock, color: 'text-purple-400' },
    { id: 'team-folder', label: 'Team Folder', desc: 'Shared folder accessible by organization members', icon: Users, color: 'text-accent-blue' },
    { id: 'shared-workspace', label: 'Shared Workspace', desc: 'Collaborative space for external project links', icon: Share2, color: 'text-emerald-400' },
  ];

  const categories = [
    'Auto (Smart Categorize)',
    'Photos',
    'Videos',
    'Documents',
    'Audio',
    'Archives',
    'Office Files'
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="w-full max-w-md glass-card rounded-2xl border border-stroke-default p-6 space-y-5 shadow-2xl relative text-xs">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-card transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div>
          <h3 className="font-extrabold text-white text-base flex items-center gap-2">
            <Upload className="w-5 h-5 text-accent-gold" /> Select Upload Destination
          </h3>
          <p className="text-gray-400 text-xs mt-1">Choose where your encrypted file payload should be saved.</p>
        </div>

        {/* Destination Cards */}
        <div className="space-y-2">
          {destinations.map(d => {
            const Icon = d.icon;
            const isSelected = selectedDest === d.id;
            return (
              <button
                key={d.id}
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

        {/* Subfolder Picker (for My Files) */}
        {selectedDest === 'my-files' && (
          <div>
            <label className="block text-gray-300 font-bold mb-1">Target Folder / Subcategory</label>
            <select
              value={selectedFolder}
              onChange={(e) => setSelectedFolder(e.target.value)}
              className="w-full bg-surface border border-stroke-default rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-accent-gold"
            >
              {categories.map((c, i) => (
                <option key={i} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}

        {/* Confirm Button */}
        <button
          onClick={() => {
            onConfirmDestination(selectedDest, selectedFolder);
            onClose();
          }}
          className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4 text-accent-gold" /> Proceed to Encrypt & Upload
        </button>
      </div>
    </div>
  );
};
