import React, { useState, useEffect, useRef } from 'react';
import {
  Search, LogOut, Video, FileText, RefreshCw, Wifi, Zap, Sparkles,
  Grid, List, ArrowUpDown, MoreVertical, Bell, Star, Eye, Share2, ShieldCheck
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { FilePreviewRenderer } from './FilePreviewRenderer';
import { QuickActions } from './QuickActions';
import { FileContextMenu } from './FileContextMenu';
import { UploadQueueDrawer } from './UploadQueueDrawer';
import { PanicLockButton } from './PanicLockButton';
import { AIOnboardingBanner } from './AIOnboardingBanner';
import { WatermarkedViewer } from './WatermarkedViewer';
import { OfflineP2PSync } from './OfflineP2PSync';
import { PricingModal } from './PricingModal';
import { AccountPurgeModal } from './AccountPurgeModal';
import { SecureShareModal } from './SecureShareModal';
import { FileControlCenterModal } from './FileControlCenterModal';
import { UploadPipelineManager, type UploadQueueItem } from '../services/uploadPipeline';

// Section Pages
import { DashboardPage } from '../pages/DashboardPage';
import { SecureSharesPage } from '../pages/SecureSharesPage';
import { DigitalVaultPage } from '../pages/DigitalVaultPage';
import { SharedWithMePage } from '../pages/SharedWithMePage';
import { SharedByMePage } from '../pages/SharedByMePage';
import { FavoritesPage } from '../pages/FavoritesPage';
import { RecentPage } from '../pages/RecentPage';
import { TrashPage } from '../pages/TrashPage';
import { ActivityLogPage } from '../pages/ActivityLogPage';
import { AISearchPage } from '../pages/AISearchPage';
import { NearbySharePage } from '../pages/NearbySharePage';
import { SettingsPage } from '../pages/SettingsPage';

export interface FileItem {
  id: string;
  fileNameEncrypted: string;
  contentTypeEncrypted: string;
  sizeBytes: number;
  contentHash: string;
  thumbnailUrl?: string;
  accessTier: 'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL';
  isColdStorage: boolean;
  isFavorite?: boolean;
  activeSharesCount?: number;
  tags?: string[];
  lastAccessedAt: string;
  createdAt: string;
}

interface DashboardV2Props {
  userEmail: string;
  onLogout: () => void;
}

export const DashboardV2: React.FC<DashboardV2Props> = ({ userEmail, onLogout }) => {
  const [userId] = useState<string>('a1b2c3d4-e5f6-7890-abcd-1234567890ab');
  const [userIp] = useState<string>('103.21.124.5');
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [activeSection, setActiveSection] = useState('dashboard');

  // "My Files" state
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortColumn, setSortColumn] = useState<'name' | 'size' | 'date' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = useState<string>('all');
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const uploadPipelineRef = useRef<UploadPipelineManager | null>(null);

  const [files, setFiles] = useState<FileItem[]>([
    {
      id: 'f101-video',
      fileNameEncrypted: 'Family_Goa_Vacation_2026.mp4',
      contentTypeEncrypted: 'video/mp4',
      sizeBytes: 154000000,
      contentHash: 'hash_video_01',
      thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=200&h=200&fit=crop&q=80',
      accessTier: 'FULL_CONTROL',
      isColdStorage: false,
      isFavorite: true,
      activeSharesCount: 2,
      tags: ['Personal', 'Goa'],
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'f102-pdf',
      fileNameEncrypted: 'Land_Deed_Registry_Document.pdf',
      contentTypeEncrypted: 'application/pdf',
      sizeBytes: 4200000,
      contentHash: 'hash_doc_02',
      thumbnailUrl: undefined,
      accessTier: 'READ_DOWNLOAD',
      isColdStorage: false,
      isFavorite: false,
      activeSharesCount: 1,
      tags: ['Legal', 'Property'],
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'f103-archive',
      fileNameEncrypted: 'Encrypted_Backup_2025.zip',
      contentTypeEncrypted: 'application/zip',
      sizeBytes: 850000000,
      contentHash: 'hash_archive_03',
      thumbnailUrl: undefined,
      accessTier: 'VIEW_ONLY',
      isColdStorage: true,
      isFavorite: true,
      activeSharesCount: 0,
      tags: ['Backup'],
      lastAccessedAt: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 40 * 86400 * 1000).toISOString()
    },
    {
      id: 'f104-docx',
      fileNameEncrypted: 'Q4_Roadmap_Planning.docx',
      contentTypeEncrypted: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      sizeBytes: 1200000,
      contentHash: 'hash_docx_04',
      thumbnailUrl: undefined,
      accessTier: 'FULL_CONTROL',
      isColdStorage: false,
      isFavorite: false,
      activeSharesCount: 3,
      tags: ['Work'],
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    }
  ]);

  const [contextMenu, setContextMenu] = useState<{ file: FileItem; x: number; y: number } | null>(null);
  const [shareModalFile, setShareModalFile] = useState<FileItem | null>(null);
  const [controlCenterFile, setControlCenterFile] = useState<FileItem | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLatencyMs, setSearchLatencyMs] = useState<number | null>(null);
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);
  const [showOfflineP2P, setShowOfflineP2P] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  useEffect(() => {
    uploadPipelineRef.current = new UploadPipelineManager((newFile) => {
      setFiles(prev => [newFile, ...prev]);
    });
    const unsubscribe = uploadPipelineRef.current.subscribe(queue => {
      setUploadQueue(queue);
    });
    return () => unsubscribe();
  }, []);

  const filterChips = [
    { id: 'all', label: 'All Files' },
    { id: 'photos', label: 'Photos' },
    { id: 'videos', label: 'Videos' },
    { id: 'documents', label: 'Documents' },
    { id: 'archives', label: 'Archives' },
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    uploadPipelineRef.current?.addFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) {
      uploadPipelineRef.current?.addFiles(e.dataTransfer.files);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const start = performance.now();
    const dummyVector512 = new Array(512).fill(0).map(() => (Math.random() - 0.5));
    try {
      const res = await fetch('/api/embeddings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, queryVector512: dummyVector512, limit: 5 })
      });
      setSearchLatencyMs(res.ok ? (await res.json()).searchLatencyMs : performance.now() - start);
    } catch {
      setSearchLatencyMs(performance.now() - start);
    } finally {
      setIsSearching(false);
    }
  };

  const sortedFiles = [...files].sort((a, b) => {
    let cmp = 0;
    if (sortColumn === 'name') cmp = a.fileNameEncrypted.localeCompare(b.fileNameEncrypted);
    else if (sortColumn === 'size') cmp = a.sizeBytes - b.sizeBytes;
    else if (sortColumn === 'date') cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    else if (sortColumn === 'type') cmp = a.contentTypeEncrypted.localeCompare(b.contentTypeEncrypted);
    return sortDirection === 'asc' ? cmp : -cmp;
  });

  const toggleSort = (col: 'name' | 'size' | 'date' | 'type') => {
    if (sortColumn === col) setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortColumn(col); setSortDirection('asc'); }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ file, x: e.clientX, y: e.clientY });
  };

  // Section Page Router
  const renderSectionPage = () => {
    switch (activeSection) {
      case 'dashboard': return <DashboardPage />;
      case 'secure-shares': return <SecureSharesPage />;
      case 'digital-vault': return <DigitalVaultPage />;
      case 'shared-with-me': return <SharedWithMePage />;
      case 'shared-by-me': return <SharedByMePage />;
      case 'favorites': return <FavoritesPage />;
      case 'recent': return <RecentPage />;
      case 'trash': return <TrashPage />;
      case 'activity': return <ActivityLogPage />;
      case 'ai-search': return <AISearchPage />;
      case 'nearby-share': return <NearbySharePage />;
      case 'settings': return <SettingsPage />;
      default: return null;
    }
  };

  const sectionContent = renderSectionPage();

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="min-h-screen bg-surface text-gray-100 font-sans flex"
    >
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Header */}
        <header className="sticky top-0 z-20 glass-panel border-b border-stroke-default px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-extrabold text-white">Welcome Back, Sathiya</h2>
            <span className="text-xs font-mono text-accent-gold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">Pro Solo · 100 GB</span>
          </div>
          <div className="flex items-center space-x-3">
            <button onClick={() => setShowOfflineP2P(true)} className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-card border border-stroke-default rounded-lg text-xs font-semibold text-gray-300 transition">
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">P2P Ready</span>
            </button>
            <button onClick={() => setShowPricing(true)} className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-bold text-accent-gold transition">
              <Zap className="w-3.5 h-3.5 text-accent-gold" /><span>₹149/mo</span>
            </button>
            <button className="p-2 bg-surface rounded-lg border border-stroke-default text-gray-400 hover:text-white relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>
            <PanicLockButton userId={userId} onLockComplete={onLogout} />
            <button onClick={onLogout} className="flex items-center space-x-1 px-3 py-1.5 bg-surface-card hover:bg-surface-hover text-gray-300 hover:text-white border border-stroke-default rounded-lg text-xs font-bold transition">
              <LogOut className="w-3.5 h-3.5 text-red-400" /><span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-6 pt-6 pb-16">
          <Breadcrumbs sectionId={activeSection} onNavigateHome={() => setActiveSection('dashboard')} />

          {sectionContent ? (
            sectionContent
          ) : (
            /* My Files Section */
            <>
              <AIOnboardingBanner progress={100} isIndexing={false} />
              <QuickActions
                onUploadClick={() => document.getElementById('main-file-input')?.click()}
                onOpenVault={() => setActiveSection('digital-vault')}
                onNearbyShare={() => setShowOfflineP2P(true)}
                onAISearch={() => setActiveSection('ai-search')}
                onRequestFiles={() => alert('Dropbox link created.')}
              />
              <input id="main-file-input" type="file" multiple onChange={handleFileUpload} className="hidden" />

              {/* AI Search Bar */}
              <div className="glass-card rounded-2xl p-4 mb-6 border border-stroke-default">
                <div className="flex gap-3">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                    <input
                      id="ai-search-input"
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder='Natural language: "Show me family photos from Goa", "Find passport"...'
                      className="w-full bg-surface border border-stroke-default rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
                    />
                  </div>
                  <button
                    onClick={handleSearch}
                    disabled={isSearching}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition flex items-center gap-2"
                  >
                    {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-accent-gold" />}
                    Sub-5ms AI Search
                  </button>
                </div>
                {searchLatencyMs !== null && (
                  <div className="mt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 px-2">
                    <Zap className="w-3 h-3 text-accent-gold" />
                    pgvector query: {searchLatencyMs.toFixed(2)} ms
                  </div>
                )}
              </div>

              {/* Filter Chips & View Toggle */}
              <div className="flex items-center justify-between gap-4 mb-6 overflow-x-auto pb-2">
                <div className="flex items-center space-x-2">
                  {filterChips.map(chip => (
                    <button
                      key={chip.id}
                      onClick={() => setActiveFilter(chip.id)}
                      className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${activeFilter === chip.id ? 'bg-primary text-white border border-red-500/40 shadow-sm' : 'bg-surface-container text-gray-400 hover:text-white border border-stroke-default'}`}
                    >
                      {chip.label}
                    </button>
                  ))}
                </div>
                <div className="flex items-center bg-surface p-1 rounded-xl border border-stroke-default shrink-0">
                  <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-surface-card text-accent-gold' : 'text-gray-400'}`} title="Grid View">
                    <Grid className="w-4 h-4" />
                  </button>
                  <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-surface-card text-accent-gold' : 'text-gray-400'}`} title="Table View">
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* File Grid with 3 Direct Actions: View, Share, Control */}
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {sortedFiles.map(file => (
                    <div
                      key={file.id}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      className="glass-card rounded-xl p-4 border border-stroke-default flex flex-col justify-between group hover:border-primary/60 transition relative"
                    >
                      <div>
                        {/* Real File Preview Container */}
                        <div className="relative">
                          <FilePreviewRenderer
                            fileId={file.id}
                            fileName={file.fileNameEncrypted}
                            contentType={file.contentTypeEncrypted}
                            thumbnailUrl={file.thumbnailUrl}
                            sizeBytes={file.sizeBytes}
                            onOpen={() => setViewingFile(file)}
                          />

                          {/* Shared Badge showing active recipient count */}
                          {file.activeSharesCount !== undefined && file.activeSharesCount > 0 && (
                            <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md border border-accent-gold/50 rounded-full text-[10px] font-bold text-accent-gold flex items-center gap-1">
                              <Share2 className="w-3 h-3 text-accent-gold" /> Shared ({file.activeSharesCount})
                            </div>
                          )}
                        </div>

                        <div className="mt-3 flex items-start justify-between">
                          <h4 className="font-semibold text-gray-100 text-xs truncate flex-1 pr-2" title={file.fileNameEncrypted}>
                            {file.fileNameEncrypted}
                          </h4>
                          {file.isFavorite && <Star className="w-3.5 h-3.5 text-accent-gold fill-accent-gold shrink-0" />}
                        </div>

                        <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mt-1">
                          <span>{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                          <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {/* 3 Prominent Primary Action Buttons: View, Share, Control + Secondary Menu */}
                      <div className="mt-4 pt-3 border-t border-stroke-default space-y-2">
                        <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                          {/* 1. View Button */}
                          <button
                            onClick={() => setViewingFile(file)}
                            className="py-1.5 px-2 bg-surface hover:bg-surface-card border border-stroke-default rounded-lg text-gray-200 hover:text-white transition flex items-center justify-center gap-1"
                            title="Open / View Stream"
                          >
                            <Eye className="w-3.5 h-3.5 text-accent-gold" /> View
                          </button>

                          {/* 2. Share Button */}
                          <button
                            onClick={() => setShareModalFile(file)}
                            className="py-1.5 px-2 bg-primary/20 hover:bg-primary/40 border border-primary/40 rounded-lg text-accent-gold transition flex items-center justify-center gap-1"
                            title="Create Secure Share Link"
                          >
                            <Share2 className="w-3.5 h-3.5 text-accent-gold" /> Share
                          </button>

                          {/* 3. Control Button */}
                          <button
                            onClick={() => setControlCenterFile(file)}
                            className="py-1.5 px-2 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 transition flex items-center justify-center gap-1"
                            title="Manage Shares & Revoke Access"
                          >
                            <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" /> Control
                          </button>
                        </div>

                        <div className="flex justify-end pt-1">
                          <button
                            onClick={(e) => handleContextMenu(e, file)}
                            className="p-1 text-gray-400 hover:text-white flex items-center gap-1 text-[11px]"
                            title="More Actions (Rename, Move, Copy, Delete)"
                          >
                            <MoreVertical className="w-3.5 h-3.5" /> <span className="text-[10px]">More</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Tabular List View with Direct Actions */
                <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
                      <tr>
                        <th onClick={() => toggleSort('name')} className="p-3.5 cursor-pointer hover:text-white"><div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></div></th>
                        <th onClick={() => toggleSort('type')} className="p-3.5 cursor-pointer hover:text-white"><div className="flex items-center gap-1">Type <ArrowUpDown className="w-3 h-3" /></div></th>
                        <th onClick={() => toggleSort('size')} className="p-3.5 cursor-pointer hover:text-white"><div className="flex items-center gap-1">Size <ArrowUpDown className="w-3 h-3" /></div></th>
                        <th className="p-3.5">Sharing Status</th>
                        <th className="p-3.5 text-right">Primary Actions</th>
                        <th className="p-3.5 text-right">More</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stroke-default">
                      {sortedFiles.map(file => (
                        <tr key={file.id} onContextMenu={(e) => handleContextMenu(e, file)} className="hover:bg-surface-card transition">
                          <td className="p-3.5 font-semibold text-gray-200">
                            <div className="flex items-center gap-2">
                              {file.contentTypeEncrypted.includes('video') ? <Video className="w-4 h-4 text-primary shrink-0" /> : <FileText className="w-4 h-4 text-accent-blue shrink-0" />}
                              <span className="truncate max-w-[180px]">{file.fileNameEncrypted}</span>
                            </div>
                          </td>
                          <td className="p-3.5 text-gray-400 font-mono text-[10px]">{file.contentTypeEncrypted.split('/')[1]?.toUpperCase()}</td>
                          <td className="p-3.5 text-gray-300 font-mono">{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</td>
                          <td className="p-3.5">
                            {file.activeSharesCount && file.activeSharesCount > 0 ? (
                              <span className="px-2 py-0.5 bg-amber-950/60 text-accent-gold border border-amber-500/30 rounded-full text-[10px] font-bold">
                                Shared ({file.activeSharesCount})
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-surface text-gray-400 border border-stroke-default rounded-full text-[10px]">
                                Private
                              </span>
                            )}
                          </td>
                          <td className="p-3.5 text-right">
                            <div className="flex items-center justify-end gap-1 font-bold">
                              <button onClick={() => setViewingFile(file)} className="px-2 py-1 bg-surface hover:bg-surface-card text-gray-300 hover:text-white border border-stroke-default rounded text-[11px]">View</button>
                              <button onClick={() => setShareModalFile(file)} className="px-2 py-1 bg-primary/20 text-accent-gold hover:bg-primary/40 border border-primary/30 rounded text-[11px]">Share</button>
                              <button onClick={() => setControlCenterFile(file)} className="px-2 py-1 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 rounded text-[11px]">Control</button>
                            </div>
                          </td>
                          <td className="p-3.5 text-right">
                            <button onClick={(e) => handleContextMenu(e, file)} className="p-1 text-gray-400 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>

      {/* Global Modals & Overlays */}
      <UploadQueueDrawer
        queue={uploadQueue}
        onClose={() => setUploadQueue([])}
        onClearCompleted={() => uploadPipelineRef.current?.clearCompleted()}
      />

      {contextMenu && (
        <FileContextMenu
          file={contextMenu.file}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onOpen={(file) => setViewingFile(file)}
          onDelete={(fileId) => setFiles(prev => prev.filter(f => f.id !== fileId))}
        />
      )}

      {/* Dedicated Secure Share Modal */}
      {shareModalFile && (
        <SecureShareModal
          file={shareModalFile}
          onClose={() => setShareModalFile(null)}
          onShareCreated={() => {
            setFiles(prev => prev.map(f => f.id === shareModalFile.id ? { ...f, activeSharesCount: (f.activeSharesCount || 0) + 1 } : f));
          }}
        />
      )}

      {/* Dedicated File Control Center Modal */}
      {controlCenterFile && (
        <FileControlCenterModal
          file={controlCenterFile}
          onClose={() => setControlCenterFile(null)}
          onRevokeAllShares={() => {
            setFiles(prev => prev.map(f => f.id === controlCenterFile.id ? { ...f, activeSharesCount: 0 } : f));
          }}
        />
      )}

      {viewingFile && (
        <WatermarkedViewer
          srcUrl={viewingFile.thumbnailUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80'}
          recipientEmail={userEmail}
          userIp={userIp}
          mediaType="image"
          onClose={() => setViewingFile(null)}
        />
      )}

      {showOfflineP2P && <OfflineP2PSync userId={userId} onClose={() => setShowOfflineP2P(false)} />}
      {showPricing && <PricingModal currentTier="PRO_SOLO" onClose={() => setShowPricing(false)} />}
      {showPurgeModal && (
        <AccountPurgeModal
          userId={userId}
          onClose={() => setShowPurgeModal(false)}
          onPurgeComplete={() => { setFiles([]); setShowPurgeModal(false); }}
        />
      )}
    </div>
  );
};
