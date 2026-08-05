import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  FolderPlus, ShieldCheck, Grid, List, Star, Trash2, Eye, Share2, Music
} from 'lucide-react';
import { FilePreviewLightboxModal } from './FilePreviewLightboxModal';
import { ShareManagementPage } from './ShareManagementPage';
import { SecureShareModal } from './SecureShareModal';
import { EnterpriseUploadModal } from './EnterpriseUploadModal';
import { EnterpriseFileExplorer } from './EnterpriseFileExplorer';
import { FullScreenUploadOverlay } from './FullScreenUploadOverlay';
import { Navbar } from './Navbar';
import { Sidebar } from './Sidebar';
import { MobileBottomNav } from './MobileBottomNav';
import { WelcomeHeroCard } from './WelcomeHeroCard';
import { AISearchSection } from './AISearchSection';
import { SecurityStatusWidget } from './SecurityStatusWidget';
import { DeviceSecurityModal } from './DeviceSecurityModal';
import { StorageAnalyticsWidget } from './StorageAnalyticsWidget';
import { ActivityTimelineWidget } from './ActivityTimelineWidget';
import { AIIntelligencePage } from '../pages/AIIntelligencePage';
import { ControlCenterPage } from '../pages/ControlCenterPage';
import { ProfileSettingsPage } from '../pages/ProfileSettingsPage';

import { LocalVaultDb } from '../utils/localVaultDb';
import { b2SyncWorker } from '../utils/b2SyncWorker';
import { auditLogger } from '../utils/auditLogger';
import { StoragePathBuilder } from '../utils/storagePathBuilder';

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
  category: 'image' | 'video' | 'document' | 'archive' | 'audio' | 'spreadsheet' | 'presentation' | 'code' | 'pdf' | 'other' | string;
  badgeColor?: string;
  badgeType?: string;
  b2Synced?: boolean;
  accessTier?: string;
  sizeBytes?: number;
  contentHash?: string;
  contentTypeEncrypted?: string;
  thumbnailUrl?: string;
  dataUrl?: string;
  b2FinalUrl?: string;
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
  const [activeCategory, setActiveCategory] = useState<string | undefined>(undefined);

  // Search & View mode
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Modals & Navigation Views
  const [selectedFileForShare, setSelectedFileForShare] = useState<FileItem | null>(null);
  const [selectedFileForPreview, setSelectedFileForPreview] = useState<FileItem | null>(null);
  const [selectedFileForShareManagement, setSelectedFileForShareManagement] = useState<FileItem | null>(null);
  const [showEnterpriseUploadModal, setShowEnterpriseUploadModal] = useState(false);
  const [showDeviceSecurityModal, setShowDeviceSecurityModal] = useState(false);

  // Full Screen Upload Experience Overlay State
  const [showFullScreenUploadOverlay, setShowFullScreenUploadOverlay] = useState(false);
  const [uploadOverlayFiles, setUploadOverlayFiles] = useState<File[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Recycle Bin / Trash collection & Activity Logs
  const [, setTrashFiles] = useState<FileItem[]>([]);
  const [, setActivityLogs] = useState<ActivityLogEntry[]>([]);

  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    } else {
      setShowEnterpriseUploadModal(true);
    }
  };

  const handleFileSelectionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selected = Array.from(e.target.files);
      setUploadOverlayFiles(selected);
      setShowFullScreenUploadOverlay(true);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFiles = Array.from(e.dataTransfer.files);
      setUploadOverlayFiles(droppedFiles);
      setShowFullScreenUploadOverlay(true);
    }
  };

  // Main file collection — driven strictly by real database metadata and storage objects
  const [files, setFiles] = useState<FileItem[]>([]);

  // Shared helper to reload files from vault DB into Dashboard state
  const reloadDashboardFiles = useCallback(() => {
    try {
      const stored = LocalVaultDb.getAllFiles();
      const mapped: FileItem[] = stored.map(s => {
        const classifiedType = StoragePathBuilder.classifyFileType(s.type, s.name);
        const ext = s.name?.split('.').pop()?.toUpperCase() || 'FILE';
        return {
          id: s.id,
          name: s.name,
          size: s.size || '1.2 MB',
          type: s.type || 'Encrypted Payload',
          updatedAt: s.updatedAt || 'Recently',
          isFavorite: false,
          sharesCount: 0,
          fileNameEncrypted: s.fileNameEncrypted || `${s.id.slice(0, 8)}.enc`,
          previewUrl: s.dataUrl,
          category: classifiedType.toLowerCase() as any,
          badgeColor: classifiedType === 'Audio' ? '#F5B700' : classifiedType === 'Presentations' ? '#EA580C' : classifiedType === 'Videos' ? '#8B5CF6' : classifiedType === 'Images' ? '#22C55E' : '#3B8BEB',
          badgeType: ext,
          b2Synced: s.b2Synced || false
        };
      });
      setFiles(mapped);
    } catch (e) {
      console.warn('Could not load stored files from LocalVaultDb', e);
    }
  }, []);

  // Load persistent vault files on mount & subscribe to B2 sync worker
  useEffect(() => {
    reloadDashboardFiles();
    const unsubscribe = b2SyncWorker.subscribe(() => {
      reloadDashboardFiles();
    });
    return unsubscribe;
  }, [reloadDashboardFiles]);


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
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="min-h-screen bg-[#070B14] text-white flex flex-col selection:bg-[#F5B700] selection:text-slate-950 relative"
    >
      {/* Hidden file input for triggering Full Screen Upload Experience */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelectionChange}
        multiple
        className="hidden"
      />

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
          onSelectTab={(tab, categoryFilter) => {
            setActiveTab(tab);
            setActiveCategory(categoryFilter);
          }}
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
                  if (files.length > 0) {
                    setSelectedFileForShareManagement(files[0]);
                    setActiveTab('share-management');
                  }
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
                  onOpenControlCenter={() => setShowDeviceSecurityModal(true)}
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

                        {/* File Preview — smart renderer based on file category */}
                        <div className="my-3 h-32 rounded-xl overflow-hidden bg-slate-900 border border-white/5 relative group/preview">
                          {file.category === 'video' && file.previewUrl ? (
                            <div className="relative w-full h-full">
                              <video
                                src={file.previewUrl}
                                className="w-full h-full object-cover"
                                preload="metadata"
                                controlsList="nodownload"
                                onContextMenu={e => e.preventDefault()}
                                style={{ userSelect: 'none' }}
                              />
                              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => setSelectedFileForPreview(file)}
                                  className="px-3 py-1.5 rounded-xl bg-[#F5B700] text-slate-950 font-bold text-xs flex items-center gap-1 shadow-lg"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Play Video
                                </button>
                              </div>
                            </div>
                          ) : file.category === 'image' && file.previewUrl ? (
                            <>
                              <img
                                src={file.previewUrl}
                                alt={file.name}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                                onClick={() => setSelectedFileForPreview(file)}
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              <div className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px] opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={() => setSelectedFileForPreview(file)}
                                  className="px-3 py-1.5 rounded-xl bg-[#F5B700] text-slate-950 font-bold text-xs flex items-center gap-1 shadow-lg"
                                >
                                  <Eye className="w-3.5 h-3.5" /> View Full
                                </button>
                              </div>
                            </>
                          ) : file.previewUrl && (file.type?.includes('image') || file.name?.match(/\.(png|jpg|jpeg|gif|webp|svg)$/i)) ? (
                            <img
                              src={file.previewUrl}
                              alt={file.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 cursor-pointer"
                              onClick={() => setSelectedFileForPreview(file)}
                              onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          ) : ((file.category as string) === 'audio' || file.type?.startsWith('audio/') || file.name?.match(/\.(mp3|wav|flac|aac|m4a|ogg)$/i)) ? (
                            <div
                              className="w-full h-full flex flex-col items-center justify-center gap-1.5 bg-gradient-to-br from-amber-950/40 via-slate-900 to-slate-950 cursor-pointer border border-amber-500/20 group/audio"
                              onClick={() => setSelectedFileForPreview(file)}
                            >
                              <div className="w-9 h-9 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-[#F5B700] shadow-md group-hover/audio:scale-110 transition-transform">
                                <Music className="w-4 h-4" />
                              </div>
                              <span className="text-[10px] font-mono text-amber-400 font-bold">Audio Track • {file.name.split('.').pop()?.toUpperCase()}</span>
                              <button className="px-2.5 py-0.5 rounded-lg bg-[#F5B700] text-slate-950 font-bold text-[10px] flex items-center gap-1 shadow-md">
                                <Eye className="w-3 h-3" /> Listen Audio
                              </button>
                            </div>
                          ) : (
                            /* Document / Archive / Unknown — styled placeholder */
                            <div
                              className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-slate-900 to-slate-800 cursor-pointer"
                              onClick={() => setSelectedFileForPreview(file)}
                            >
                              <div className="text-3xl select-none">
                                {file.badgeType === 'PDF' ? '📄' : file.badgeType === 'DOC' ? '📝' : file.badgeType === 'ZIP' ? '🗜️' : '🔒'}
                              </div>
                              <span className="text-[10px] font-mono text-slate-400 max-w-[120px] truncate">{file.name}</span>
                              <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setSelectedFileForPreview(file);
                                  }}
                                  className="px-3 py-1.5 rounded-xl bg-[#F5B700] text-slate-950 font-bold text-xs flex items-center gap-1"
                                >
                                  <Eye className="w-3.5 h-3.5" /> Preview
                                </button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Card Actions */}
                        <div className="mt-3 pt-3 border-t border-white/5 flex items-center justify-between">
                          <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> AES-256
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setSelectedFileForShareManagement(file);
                                setActiveTab('share-management');
                              }}
                              className="px-2.5 py-1 rounded-lg bg-[#F5B700]/15 text-[#F5B700] hover:bg-[#F5B700]/25 text-xs font-bold transition-colors flex items-center gap-1"
                            >
                              <Share2 className="w-3 h-3" /> Share
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

          {(activeTab === 'files' || activeTab.startsWith('files-') || activeTab === 'shared' || activeTab === 'favorites' || activeTab === 'recent' || activeTab === 'recycle-bin') && (
            <EnterpriseFileExplorer
              userEmail={userEmail}
              onOpenUpload={() => setShowEnterpriseUploadModal(true)}
              onOpenShare={(fileToShare) => {
                setSelectedFileForShareManagement(fileToShare);
                setActiveTab('share-management');
              }}
              selectedCategory={activeCategory}
              activeTab={activeTab}
            />
          )}

          {activeTab === 'share-management' && (
            <ShareManagementPage
              file={selectedFileForShareManagement || files[0]}
              userEmail={userEmail}
              onBack={() => setActiveTab('dashboard')}
            />
          )}

          {activeTab === 'ai-intelligence' && <AIIntelligencePage />}
          {activeTab === 'control-center' && <ControlCenterPage />}
          {activeTab === 'settings' && <ProfileSettingsPage userEmail={userEmail} onResetComplete={reloadDashboardFiles} />}
          {activeTab === 'devtools' && <ProfileSettingsPage userEmail={userEmail} onResetComplete={reloadDashboardFiles} />}
          {activeTab === 'secure-vault' && <ControlCenterPage />}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => setActiveTab(tab)}
        onOpenUpload={handleUploadClick}
      />

      {/* Enterprise Storage Upload Modal */}
      {showEnterpriseUploadModal && (
        <EnterpriseUploadModal
          isOpen={showEnterpriseUploadModal}
          onClose={() => setShowEnterpriseUploadModal(false)}
          onUploadSuccess={() => {
            setShowEnterpriseUploadModal(false);
            reloadDashboardFiles();
          }}
        />
      )}

      {/* Full-Screen File Preview Lightbox */}
      {selectedFileForPreview && (
        <FilePreviewLightboxModal
          file={selectedFileForPreview}
          userEmail={userEmail}
          onClose={() => setSelectedFileForPreview(null)}
          onOpenShare={(fileToShare) => {
            setSelectedFileForShareManagement(fileToShare);
            setActiveTab('share-management');
          }}
        />
      )}

      {/* Premium Full-Screen Upload Overlay */}
      {showFullScreenUploadOverlay && (
        <FullScreenUploadOverlay
          files={uploadOverlayFiles}
          isOpen={showFullScreenUploadOverlay}
          onClose={() => {
            setShowFullScreenUploadOverlay(false);
            setUploadOverlayFiles([]);
          }}
          onOpenFolder={() => {
            setShowFullScreenUploadOverlay(false);
            setUploadOverlayFiles([]);
            setActiveTab('files');
          }}
          onUploadMore={() => {
            setShowFullScreenUploadOverlay(false);
            if (fileInputRef.current) {
              setTimeout(() => fileInputRef.current?.click(), 200);
            }
          }}
          onUploadSuccess={(uploadedQueue) => {
            const completeItems = uploadedQueue.filter((i) => i.status === 'Complete');

            Promise.all(
              completeItems.map(
                (item) =>
                  new Promise<{ id: string; name: string; file: File; dataUrl: string }>((resolve) => {
                    const reader = new FileReader();
                    reader.onload = (e) => {
                      const dataUrl = (e.target?.result as string) || '';
                      resolve({ id: item.id, name: item.name, file: item.file, dataUrl });
                    };
                    reader.onerror = () => {
                      resolve({ id: item.id, name: item.name, file: item.file, dataUrl: '' });
                    };
                    reader.readAsDataURL(item.file);
                  })
              )
            ).then((results) => {
              results.forEach(({ id, name, file, dataUrl }) => {
                const classifiedType = StoragePathBuilder.classifyFileType(file.type, name);
                LocalVaultDb.saveFile(id, name, file.type, dataUrl, {
                  size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
                  category: classifiedType.toLowerCase() as any,
                  updatedAt: 'Just now'
                });

                auditLogger.logFileActivity(
                  name,
                  'UPLOAD_COMPLETED',
                  'Stored zero-knowledge encrypted payload in vault',
                  classifiedType
                );
              });

              b2SyncWorker.triggerSync('Full-Screen Upload Complete');
              reloadDashboardFiles();
            });
          }}
        />
      )}

      {/* Secure Share Modal */}
      {selectedFileForShare && (
        <SecureShareModal
          file={selectedFileForShare}
          onClose={() => setSelectedFileForShare(null)}
        />
      )}

      {/* Device & Session Security Center Modal */}
      {showDeviceSecurityModal && (
        <DeviceSecurityModal
          userEmail={userEmail}
          onClose={() => setShowDeviceSecurityModal(false)}
        />
      )}
    </div>
  );
};
