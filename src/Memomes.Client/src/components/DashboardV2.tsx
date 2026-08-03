import React, { useState, useEffect } from 'react';
import {
  FolderPlus, ShieldCheck, Grid, List, Star, Trash2, Eye, Upload
} from 'lucide-react';
import { SecureShareModal } from './SecureShareModal';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { WelcomeHeroCard } from './WelcomeHeroCard';
import { AISearchSection } from './AISearchSection';
import { SecurityStatusWidget } from './SecurityStatusWidget';
import { StorageAnalyticsWidget } from './StorageAnalyticsWidget';
import { ActivityTimelineWidget } from './ActivityTimelineWidget';
import { AIIntelligencePage } from '../pages/AIIntelligencePage';
import { ControlCenterPage } from '../pages/ControlCenterPage';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage';

import { LocalVaultDb } from '../utils/localVaultDb';
import { b2SyncWorker } from '../utils/b2SyncWorker';

export interface FileItem {
  id: string;
  name: string;
  size: string;
  type: string;
  updatedAt: string;
  isFavorite: boolean;
  sharesCount: number;
  fileNameEncrypted: string;
  previewUrl?: string;
  category: 'image' | 'video' | 'document' | 'archive' | 'other';
  badgeColor?: string;
  badgeType?: string;
  b2Synced?: boolean;
  accessTier?: string;
  sizeBytes?: number;
  contentHash?: string;
  contentTypeEncrypted?: string;
  thumbnailUrl?: string;
  tags?: string[];
  createdAt?: string;
  activeSharesCount?: number;
  lastAccessedAt?: string;
  isColdStorage?: boolean;
}

export interface ActivityLogEntry {
  id: string;
  action: string;
  timestamp: string;
  status: 'Success' | 'Encrypted' | 'Warning' | 'Purged';
  details: string;
}

interface DashboardV2Props {
  userEmail: string;
  onLogout: () => void;
}

export const DashboardV2: React.FC<DashboardV2Props> = ({ userEmail, onLogout }) => {
  // Navigation State
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Search & View mode
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals
  const [selectedFileForShare, setSelectedFileForShare] = useState<FileItem | null>(null);

  // Recycle Bin / Trash collection & Activity Logs
  const [, setTrashFiles] = useState<FileItem[]>([]);
  const [, setActivityLogs] = useState<ActivityLogEntry[]>([]);

  // Main file collection
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: 'file-01',
      name: 'Passport_Scan_Official.pdf',
      size: '1.8 MB',
      type: 'Documents',
      updatedAt: 'Just now',
      isFavorite: true,
      sharesCount: 1,
      fileNameEncrypted: 'e3b0c442...pdf.enc',
      category: 'document',
      badgeColor: '#EF4444',
      badgeType: 'PDF',
      b2Synced: true
    },
    {
      id: 'file-02',
      name: 'Tax_Return_Form_1040_2025.pdf',
      size: '2.4 MB',
      type: 'Documents',
      updatedAt: '1 hour ago',
      isFavorite: true,
      sharesCount: 3,
      fileNameEncrypted: 'f8a1d990...pdf.enc',
      category: 'document',
      badgeColor: '#22C55E',
      badgeType: 'PDF',
      b2Synced: true
    },
    {
      id: 'file-03',
      name: 'Q3_Financial_Audit_2025.pdf',
      size: '4.2 MB',
      type: 'Documents',
      updatedAt: 'Yesterday',
      isFavorite: false,
      sharesCount: 12,
      fileNameEncrypted: 'c90a1b22...pdf.enc',
      category: 'document',
      badgeColor: '#F5B700',
      badgeType: 'DOC',
      b2Synced: true
    },
    {
      id: 'file-04',
      name: 'Executive_Presentation_Keynote.png',
      size: '6.5 MB',
      type: 'Images',
      updatedAt: '2 days ago',
      isFavorite: false,
      sharesCount: 0,
      fileNameEncrypted: 'a1b2c3d4...png.enc',
      category: 'image',
      badgeColor: '#8B5CF6',
      badgeType: 'IMG',
      b2Synced: true,
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
    }
  ]);

  // Load persistent vault files on mount
  useEffect(() => {
    try {
      const stored = LocalVaultDb.getAllFiles();
      if (stored && stored.length > 0) {
        const mapped: FileItem[] = stored.map(s => ({
          id: s.id,
          name: s.name,
          size: s.size || '1.2 MB',
          type: s.type || 'Encrypted Payload',
          updatedAt: s.updatedAt || 'Recently',
          isFavorite: false,
          sharesCount: 0,
          fileNameEncrypted: s.fileNameEncrypted || `${s.id.slice(0, 8)}.enc`,
          previewUrl: s.dataUrl || (s.type.includes('image') || s.type.includes('video') ? s.dataUrl : undefined),
          category: s.category || (s.type.includes('image') ? 'image' : s.type.includes('video') ? 'video' : 'document'),
          badgeColor: '#F5B700',
          badgeType: 'FILE',
          b2Synced: s.b2Synced || false
        }));

        setFiles(prev => {
          const prevIds = new Set(prev.map(p => p.id));
          const newUnique = mapped.filter(m => !prevIds.has(m.id));
          return [...newUnique, ...prev];
        });
      }
    } catch (e) {
      console.warn('Could not load stored files from LocalVaultDb', e);
    }
  }, []);

  // Subscribe to B2 sync worker — refresh b2Synced badge on files after each sync cycle
  useEffect(() => {
    const unsubscribe = b2SyncWorker.subscribe(() => {
      // Re-read all files from storage to pick up latest b2Synced flags
      const updated = LocalVaultDb.getAllFiles();
      if (updated.length === 0) return;
      const b2Map = new Map(updated.map(f => [f.id, f.b2Synced ?? false]));
      setFiles(prev => prev.map(f => ({
        ...f,
        b2Synced: b2Map.has(f.id) ? b2Map.get(f.id)! : f.b2Synced
      })));
    });
    return unsubscribe;
  }, []);


  const addActivityLog = (action: string, details: string, status: 'Success' | 'Encrypted' | 'Warning' | 'Purged' = 'Success') => {
    const newLog: ActivityLogEntry = {
      id: `act-${Date.now()}`,
      action,
      timestamp: new Date().toLocaleTimeString(),
      status,
      details
    };
    setActivityLogs(prev => [newLog, ...prev]);
  };

  const handleUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'video/*,image/*,application/pdf,.doc,.docx,.zip';
    input.onchange = (e: any) => {
      const file = e.target.files?.[0];
      if (file) {
        const fileId = `file-${Date.now()}`;
        const isVideo = file.type.includes('video') || file.name.endsWith('.mp4') || file.name.endsWith('.mov') || file.name.endsWith('.mkv');
        const isImage = file.type.includes('image');
        
        const reader = new FileReader();
        reader.onload = (event: any) => {
          const dataUrl = event.target?.result as string || '';
          const newFileItem: FileItem = {
            id: fileId,
            name: file.name,
            size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
            type: isVideo ? 'Videos' : isImage ? 'Images' : 'Documents',
            updatedAt: 'Just now',
            isFavorite: false,
            sharesCount: 0,
            fileNameEncrypted: `${Math.random().toString(36).slice(2, 10)}.enc`,
            category: isVideo ? 'video' : isImage ? 'image' : 'document',
            previewUrl: dataUrl,
            badgeColor: isVideo ? '#8B5CF6' : isImage ? '#22C55E' : '#EF4444',
            badgeType: isVideo ? 'MP4' : isImage ? 'IMG' : 'DOC',
            b2Synced: false
          };

          LocalVaultDb.saveFile(fileId, file.name, file.type, dataUrl, newFileItem);
          setFiles(prev => [newFileItem, ...prev]);

          addActivityLog('FILE_UPLOADED', `Uploaded & Encrypted ${file.name} (${newFileItem.size})`, 'Encrypted');

          b2SyncWorker.triggerSync(`Upload: ${file.name}`);
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const toggleFavorite = (id: string) => {
    setFiles(prev => prev.map(f => {
      if (f.id === id) {
        const updated = !f.isFavorite;
        addActivityLog(updated ? 'FAVORITE_ADDED' : 'FAVORITE_REMOVED', `${updated ? 'Pinned' : 'Unpinned'} ${f.name}`);
        return { ...f, isFavorite: updated };
      }
      return f;
    }));
  };

  const deleteFile = (id: string) => {
    const fileToDelete = files.find(f => f.id === id);
    if (fileToDelete) {
      setFiles(prev => prev.filter(f => f.id !== id));
      setTrashFiles(prev => [fileToDelete, ...prev]);
      addActivityLog('FILE_TRASHED', `Moved ${fileToDelete.name} to Recycle Bin`, 'Warning');
    }
  };

  // Filter files based on current tab & query
  const filteredFiles = files.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchQuery.toLowerCase());
    if (activeTab === 'favorites') return f.isFavorite && matchesSearch;
    if (activeTab === 'shared') return f.sharesCount > 0 && matchesSearch;
    if (activeTab === 'recent') return matchesSearch;
    return matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#070B14] text-white flex flex-col selection:bg-[#F5B700] selection:text-slate-950">
      {/* Top Navbar */}
      <Navbar
        userEmail={userEmail}
        onOpenUpload={handleUploadClick}
        onOpenAISearch={() => setActiveTab('ai-intelligence')}
        onLogout={onLogout}
        onNavigateTab={(tab) => setActiveTab(tab)}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onSelectTab={(tab) => setActiveTab(tab)}
          favoritesCount={files.filter(f => f.isFavorite).length}
          sharedCount={files.filter(f => f.sharesCount > 0).length}
        />

        {/* Content View Router */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6 pb-24 md:pb-6">
          {activeTab === 'dashboard' && (
            <>
              {/* Emotional Hero Section */}
              <WelcomeHeroCard
                userEmail={userEmail}
                onOpenUpload={handleUploadClick}
                onOpenShare={() => {
                  if (files.length > 0) setSelectedFileForShare(files[0]);
                }}
                onOpenVault={() => setActiveTab('secure-vault')}
                onOpenAskAI={() => setActiveTab('ai-intelligence')}
              />

              {/* Dominant AI Search Bar */}
              <AISearchSection
                onSearchQuery={(q) => setSearchQuery(q)}
                onOpenAIIntelligence={() => setActiveTab('ai-intelligence')}
              />

              {/* Security & Storage Analytics Widgets */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <SecurityStatusWidget
                  onOpenControlCenter={() => setActiveTab('control-center')}
                />
                <StorageAnalyticsWidget
                  onUpgradeClick={() => setActiveTab('settings')}
                />
              </div>

              {/* Activity Log & Files Preview */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-4">
                  {/* Section Title & Controls */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-3">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <FolderPlus className="w-4 h-4 text-[#F5B700]" /> Protected File Vault
                    </h3>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-1.5 rounded-lg border transition-all ${
                          viewMode === 'grid' ? 'bg-[#F5B700] text-slate-950 border-[#F5B700]' : 'text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        <Grid className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-1.5 rounded-lg border transition-all ${
                          viewMode === 'list' ? 'bg-[#F5B700] text-slate-950 border-[#F5B700]' : 'text-slate-400 border-white/10 hover:text-white'
                        }`}
                      >
                        <List className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* File Grid */}
                  <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'}`}>
                    {filteredFiles.map((file) => (
                      <div
                        key={file.id}
                        className="glass-card p-4 rounded-2xl relative group flex flex-col justify-between"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[#F5B700] flex items-center justify-center font-bold text-xs shrink-0">
                              {file.badgeType || 'FILE'}
                            </div>
                            <div className="overflow-hidden">
                              <h4 className="text-xs font-bold text-white truncate max-w-[150px]">{file.name}</h4>
                              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{file.size} • {file.updatedAt}</p>
                            </div>
                          </div>

                          <button
                            onClick={() => toggleFavorite(file.id)}
                            className="text-slate-500 hover:text-amber-400 transition-colors"
                          >
                            <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                          </button>
                        </div>

                        {/* File Preview */}
                        {file.previewUrl && (
                          <div className="my-3 h-28 rounded-xl overflow-hidden bg-slate-900 border border-white/5 relative">
                            <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                onClick={() => setSelectedFileForShare(file)}
                                className="px-3 py-1.5 rounded-xl bg-[#F5B700] text-slate-950 font-bold text-xs flex items-center gap-1 shadow-lg"
                              >
                                <Eye className="w-3.5 h-3.5" /> Quick Preview
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Card Actions */}
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> AES-256
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedFileForShare(file)}
                              className="px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 text-xs font-medium transition-colors"
                            >
                              Share
                            </button>
                            <button
                              onClick={() => deleteFile(file.id)}
                              className="p-1 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Right Side Activity Timeline Widget */}
                <div>
                  <ActivityTimelineWidget
                    onOpenActivityPage={() => setActiveTab('control-center')}
                  />
                </div>
              </div>
            </>
          )}

          {activeTab === 'files' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-4">
                <h1 className="text-xl font-bold text-white flex items-center gap-2">
                  <FolderPlus className="w-6 h-6 text-[#F5B700]" /> All Protected Files
                </h1>
                <button onClick={handleUploadClick} className="btn-gold !h-9 !px-4 !text-xs">
                  <Upload className="w-3.5 h-3.5" /> Upload File
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {files.map((file) => (
                  <div key={file.id} className="glass-card p-4 rounded-2xl space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="p-2.5 rounded-xl bg-amber-500/10 text-[#F5B700] font-bold text-xs">
                        {file.badgeType || 'FILE'}
                      </div>
                      <button onClick={() => toggleFavorite(file.id)}>
                        <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-500'}`} />
                      </button>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white truncate">{file.name}</h4>
                      <p className="text-[11px] text-slate-400 font-mono">{file.size} • {file.updatedAt}</p>
                    </div>
                    <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                      <button 
                        onClick={() => setSelectedFileForShare(file)}
                        className="text-xs text-[#F5B700] hover:underline font-semibold"
                      >
                        Configure Sharing
                      </button>
                      <button onClick={() => deleteFile(file.id)} className="text-slate-500 hover:text-red-400">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'ai-intelligence' && <AIIntelligencePage />}
          {activeTab === 'control-center' && <ControlCenterPage />}
          {activeTab === 'settings' && <ProfileSettingsPage userEmail={userEmail} />}
          {activeTab === 'secure-vault' && <ControlCenterPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenUpload={handleUploadClick}
      />

      {/* Secure Share Modal */}
      {selectedFileForShare && (
        <SecureShareModal
          file={selectedFileForShare}
          onClose={() => setSelectedFileForShare(null)}
        />
      )}
    </div>
  );
};
