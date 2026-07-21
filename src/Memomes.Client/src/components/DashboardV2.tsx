import React, { useState, useEffect, useRef } from 'react';
import {
  Search, LogOut, Video, FileText, Archive, RefreshCw, Wifi, Zap, Sparkles, HardDrive,
  Grid, List, ArrowUpDown, MoreVertical, Bell, Star
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { QuickActions } from './QuickActions';
import { SecurityPanelV2 } from './SecurityPanelV2';
import { RecentActivityTimeline } from './RecentActivityTimeline';
import { SharingAnalytics } from './SharingAnalytics';
import { FileContextMenu } from './FileContextMenu';
import { UploadQueueDrawer } from './UploadQueueDrawer';
import { PanicLockButton } from './PanicLockButton';
import { AIOnboardingBanner } from './AIOnboardingBanner';
import { WatermarkedViewer } from './WatermarkedViewer';
import { ZeroRamVideoPlayer } from './ZeroRamVideoPlayer';
import { OfflineP2PSync } from './OfflineP2PSync';
import { PricingModal } from './PricingModal';
import { AccountPurgeModal } from './AccountPurgeModal';
import { UploadPipelineManager, type UploadQueueItem } from '../services/uploadPipeline';

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

  // Dual View Mode & Sorting State
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [sortColumn, setSortColumn] = useState<'name' | 'size' | 'date' | 'type'>('date');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [activeFilter, setActiveFilter] = useState<string>('all');

  // Upload Manager & Queue
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
      tags: ['Personal', 'Goa'],
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'f102-photo',
      fileNameEncrypted: 'Land_Deed_Registry_Document.pdf',
      contentTypeEncrypted: 'application/pdf',
      sizeBytes: 4200000,
      contentHash: 'hash_doc_02',
      thumbnailUrl: undefined,
      accessTier: 'READ_DOWNLOAD',
      isColdStorage: false,
      isFavorite: false,
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
      tags: ['Backup'],
      lastAccessedAt: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 40 * 86400 * 1000).toISOString()
    }
  ]);

  // Context Menu State
  const [contextMenu, setContextMenu] = useState<{ file: FileItem; x: number; y: number } | null>(null);

  // Search & Modals
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLatencyMs, setSearchLatencyMs] = useState<number | null>(null);

  const [viewingWatermarkFile, setViewingWatermarkFile] = useState<FileItem | null>(null);
  const [streamingVideoFile, setStreamingVideoFile] = useState<FileItem | null>(null);
  const [showOfflineP2P, setShowOfflineP2P] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  // Initialize Upload Pipeline & Subscriptions
  useEffect(() => {
    uploadPipelineRef.current = new UploadPipelineManager((newFile) => {
      setFiles(prev => [newFile, ...prev]);
    });

    const unsubscribe = uploadPipelineRef.current.subscribe(queue => {
      setUploadQueue(queue);
    });

    return () => unsubscribe();
  }, []);

  // Filter Chips
  const filterChips = [
    { id: 'all', label: 'All Files' },
    { id: 'recent', label: 'Recent' },
    { id: 'photos', label: 'Photos' },
    { id: 'videos', label: 'Videos' },
    { id: 'documents', label: 'Documents' },
    { id: 'shared', label: 'Shared' },
    { id: 'vault', label: 'Vault' },
    { id: 'favorites', label: 'Favorites' },
    { id: 'trash', label: 'Trash' }
  ];

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    uploadPipelineRef.current?.addFiles(e.target.files);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
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
      if (res.ok) {
        const data = await res.json();
        setSearchLatencyMs(data.searchLatencyMs || (performance.now() - start));
      } else {
        setSearchLatencyMs(performance.now() - start);
      }
    } catch {
      setSearchLatencyMs(performance.now() - start);
    } finally {
      setIsSearching(false);
    }
  };

  // Sorting Logic
  const sortedFiles = [...files].sort((a, b) => {
    let comparison = 0;
    if (sortColumn === 'name') {
      comparison = a.fileNameEncrypted.localeCompare(b.fileNameEncrypted);
    } else if (sortColumn === 'size') {
      comparison = a.sizeBytes - b.sizeBytes;
    } else if (sortColumn === 'date') {
      comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    } else if (sortColumn === 'type') {
      comparison = a.contentTypeEncrypted.localeCompare(b.contentTypeEncrypted);
    }
    return sortDirection === 'asc' ? comparison : -comparison;
  });

  const toggleSort = (col: 'name' | 'size' | 'date' | 'type') => {
    if (sortColumn === col) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(col);
      setSortDirection('asc');
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ file, x: e.clientX, y: e.clientY });
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className="min-h-screen bg-surface text-gray-100 font-sans flex"
    >
      {/* Collapsible Left Sidebar */}
      <Sidebar
        activeSection={activeSection}
        onSelectSection={setActiveSection}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* Main Content Area */}
      <div className={`flex-1 transition-all duration-300 ${isSidebarCollapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Header Bar */}
        <header className="sticky top-0 z-20 glass-panel border-b border-stroke-default px-6 py-3.5 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h2 className="text-base font-extrabold text-white">Welcome Back, Sathiya</h2>
            <span className="text-xs font-mono text-accent-gold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              Pro Solo (100 GB)
            </span>
          </div>

          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowOfflineP2P(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-card border border-stroke-default rounded-lg text-xs font-semibold text-gray-300 transition"
            >
              <Wifi className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">P2P Ready</span>
            </button>

            <button
              onClick={() => setShowPricing(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-bold text-accent-gold transition"
            >
              <Zap className="w-3.5 h-3.5 text-accent-gold" />
              <span>₹149/mo</span>
            </button>

            <button className="p-2 bg-surface rounded-lg border border-stroke-default text-gray-400 hover:text-white relative">
              <Bell className="w-4 h-4" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
            </button>

            <PanicLockButton userId={userId} onLockComplete={onLogout} />

            <button
              onClick={onLogout}
              className="flex items-center space-x-1 px-3 py-1.5 bg-surface-card hover:bg-surface-hover text-gray-300 hover:text-white border border-stroke-default rounded-lg text-xs font-bold transition"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </header>

        {/* Dashboard Body Container */}
        <main className="max-w-7xl mx-auto px-6 pt-6 pb-16">
          {/* Onboarding Zero-Knowledge AI Banner */}
          <AIOnboardingBanner progress={100} isIndexing={false} />

          {/* Quick Actions Grid */}
          <QuickActions
            onUploadClick={() => document.getElementById('main-file-input')?.click()}
            onOpenVault={() => setActiveSection('digital-vault')}
            onNearbyShare={() => setShowOfflineP2P(true)}
            onAISearch={() => document.getElementById('ai-search-input')?.focus()}
            onRequestFiles={() => alert('Dropbox link created.')}
          />
          <input id="main-file-input" type="file" multiple onChange={handleFileUpload} className="hidden" />

          {/* Storage & Security Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            {/* Storage Allocation Card */}
            <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-stroke-default">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
                    <HardDrive className="w-4 h-4 text-accent-gold" /> Storage Allocation Breakdown
                  </h3>
                  <p className="text-xs text-gray-400 mt-0.5">
                    1.05 GB of 100 GB Used (1.05%)
                  </p>
                </div>
                <span className="text-xs font-mono text-accent-gold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                  Pro Solo Plan (₹149/mo)
                </span>
              </div>

              {/* Segmented Bar */}
              <div className="w-full h-3.5 bg-surface border border-stroke-default rounded-full overflow-hidden flex mb-4">
                <div className="bg-primary h-full" style={{ width: '15%' }} title="Video (#A00D3A)" />
                <div className="bg-accent-gold h-full" style={{ width: '8%' }} title="Photo (#FFC928)" />
                <div className="bg-accent-blue h-full" style={{ width: '4%' }} title="Docs (#3B82F6)" />
                <div className="bg-accent-green h-full" style={{ width: '40%' }} title="Archive (#10B981)" />
              </div>

              {/* Storage Legend */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="flex items-center space-x-2 bg-surface p-2 rounded-lg border border-stroke-default">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary" />
                  <span className="text-gray-300 font-medium">Video (154 MB)</span>
                </div>
                <div className="flex items-center space-x-2 bg-surface p-2 rounded-lg border border-stroke-default">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-gold" />
                  <span className="text-gray-300 font-medium">Photo (45 MB)</span>
                </div>
                <div className="flex items-center space-x-2 bg-surface p-2 rounded-lg border border-stroke-default">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-blue" />
                  <span className="text-gray-300 font-medium">Docs (4.2 MB)</span>
                </div>
                <div className="flex items-center space-x-2 bg-surface p-2 rounded-lg border border-stroke-default">
                  <span className="w-2.5 h-2.5 rounded-full bg-accent-green" />
                  <span className="text-gray-300 font-medium">Archive (850 MB)</span>
                </div>
              </div>
            </div>

            {/* Security Score Panel */}
            <SecurityPanelV2 />
          </div>

          {/* Activity & Sharing Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className="lg:col-span-2">
              <SharingAnalytics />
            </div>
            <RecentActivityTimeline />
          </div>

          {/* AI Search Engine Bar */}
          <div className="glass-card rounded-2xl p-4 mb-6 border border-stroke-default">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
                <input
                  id="ai-search-input"
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder='Try natural language AI search: "Show me my mom and father photos", "Find passport", or "Find documents shared with Rahul"...'
                  className="w-full bg-surface border border-stroke-default rounded-xl pl-10 pr-4 py-2.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
                />
              </div>
              <button
                onClick={handleSearch}
                disabled={isSearching}
                className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2"
              >
                {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4 text-accent-gold" />}
                <span>Sub-5ms AI Search</span>
              </button>
            </div>

            {searchLatencyMs !== null && (
              <div className="mt-2 text-[11px] font-mono text-emerald-400 flex items-center gap-1.5 px-2">
                <Zap className="w-3 h-3 text-accent-gold" />
                <span>Cosine Similarity pgvector query completed in {searchLatencyMs.toFixed(2)} ms</span>
              </div>
            )}
          </div>

          {/* Filter Chips Bar */}
          <div className="flex items-center justify-between gap-4 mb-6 overflow-x-auto pb-2">
            <div className="flex items-center space-x-2">
              {filterChips.map(chip => (
                <button
                  key={chip.id}
                  onClick={() => setActiveFilter(chip.id)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-xl whitespace-nowrap transition ${
                    activeFilter === chip.id
                      ? 'bg-primary text-white border border-red-500/40 shadow-sm'
                      : 'bg-surface-container text-gray-400 hover:text-white border border-stroke-default'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>

            {/* Dual View Toggle Buttons */}
            <div className="flex items-center bg-surface p-1 rounded-xl border border-stroke-default shrink-0">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                  viewMode === 'grid' ? 'bg-surface-card text-accent-gold shadow-sm' : 'text-gray-400'
                }`}
                title="Thumbnail Grid View (200x200 Previews)"
              >
                <Grid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className={`p-1.5 rounded-lg text-xs font-semibold transition flex items-center space-x-1 ${
                  viewMode === 'table' ? 'bg-surface-card text-accent-gold shadow-sm' : 'text-gray-400'
                }`}
                title="Tabular List View with Column Sorting"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Files Display: Grid vs. Tabular View */}
          {viewMode === 'grid' ? (
            /* Thumbnail Grid View with 200x200 Previews */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedFiles.map(file => (
                <div
                  key={file.id}
                  onContextMenu={(e) => handleContextMenu(e, file)}
                  className="glass-card rounded-xl p-4 border border-stroke-default flex flex-col justify-between relative group hover:border-primary/60 transition"
                >
                  <div>
                    {/* 200x200 Encrypted Thumbnail Preview Container */}
                    <div className="relative aspect-square w-full rounded-xl bg-surface border border-stroke-default overflow-hidden mb-3 flex items-center justify-center">
                      {file.thumbnailUrl ? (
                        <img src={file.thumbnailUrl} alt="200x200 preview" className="w-full h-full object-cover" />
                      ) : file.contentTypeEncrypted.includes('video') ? (
                        <Video className="w-10 h-10 text-primary" />
                      ) : file.contentTypeEncrypted.includes('pdf') ? (
                        <FileText className="w-10 h-10 text-accent-blue" />
                      ) : (
                        <Archive className="w-10 h-10 text-accent-green" />
                      )}

                      {/* Top Badges */}
                      <div className="absolute top-2 right-2 flex items-center space-x-1">
                        {file.isFavorite && <Star className="w-4 h-4 text-accent-gold fill-accent-gold" />}
                        <span className="text-[10px] font-bold bg-black/70 text-gray-200 backdrop-blur-sm px-2 py-0.5 rounded-full border border-stroke-default">
                          {file.accessTier}
                        </span>
                      </div>
                    </div>

                    <h4 className="font-semibold text-gray-100 text-xs truncate mb-1" title={file.fileNameEncrypted}>
                      {file.fileNameEncrypted}
                    </h4>
                    <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono">
                      <span>{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                      <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                    </div>

                    {file.tags && (
                      <div className="flex gap-1 mt-2">
                        {file.tags.map((t, idx) => (
                          <span key={idx} className="text-[9px] bg-surface-container text-gray-300 border border-stroke-default px-1.5 py-0.5 rounded">
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-stroke-default flex items-center justify-between text-xs">
                    <button
                      onClick={() => setViewingWatermarkFile(file)}
                      className="text-accent-gold font-medium hover:underline text-[11px]"
                    >
                      {file.accessTier === 'VIEW_ONLY' ? 'Watermark Stream' : 'Decrypt Preview'}
                    </button>
                    <button
                      onClick={(e) => handleContextMenu(e, file)}
                      className="p-1 text-gray-400 hover:text-white"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Tabular List View with Column Sorting */
            <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
                  <tr>
                    <th onClick={() => toggleSort('name')} className="p-3.5 cursor-pointer hover:text-white">
                      <div className="flex items-center gap-1">Name <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th onClick={() => toggleSort('type')} className="p-3.5 cursor-pointer hover:text-white">
                      <div className="flex items-center gap-1">Type <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th onClick={() => toggleSort('size')} className="p-3.5 cursor-pointer hover:text-white">
                      <div className="flex items-center gap-1">Size <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th onClick={() => toggleSort('date')} className="p-3.5 cursor-pointer hover:text-white">
                      <div className="flex items-center gap-1">Date Modified <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="p-3.5">Permission Tier</th>
                    <th className="p-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke-default">
                  {sortedFiles.map(file => (
                    <tr
                      key={file.id}
                      onContextMenu={(e) => handleContextMenu(e, file)}
                      className="hover:bg-surface-card transition"
                    >
                      <td className="p-3.5 font-semibold text-gray-200 flex items-center space-x-2">
                        {file.contentTypeEncrypted.includes('video') ? <Video className="w-4 h-4 text-primary" /> : <FileText className="w-4 h-4 text-accent-blue" />}
                        <span className="truncate max-w-xs">{file.fileNameEncrypted}</span>
                      </td>
                      <td className="p-3.5 text-gray-400 font-mono">{file.contentTypeEncrypted}</td>
                      <td className="p-3.5 text-gray-300 font-mono">{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</td>
                      <td className="p-3.5 text-gray-400 font-mono">{new Date(file.createdAt).toLocaleDateString()}</td>
                      <td className="p-3.5">
                        <span className="px-2 py-0.5 bg-surface text-accent-gold border border-stroke-default rounded-full text-[10px]">
                          {file.accessTier}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <button onClick={(e) => handleContextMenu(e, file)} className="p-1 text-gray-400 hover:text-white">
                          <MoreVertical className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </main>
      </div>

      {/* Floating Batch Upload Drawer */}
      <UploadQueueDrawer
        queue={uploadQueue}
        onClose={() => setUploadQueue([])}
        onClearCompleted={() => uploadPipelineRef.current?.clearCompleted()}
      />

      {/* Context Menu Modal */}
      {contextMenu && (
        <FileContextMenu
          file={contextMenu.file}
          position={{ x: contextMenu.x, y: contextMenu.y }}
          onClose={() => setContextMenu(null)}
          onOpen={(file) => setViewingWatermarkFile(file)}
          onDelete={(fileId) => setFiles(prev => prev.filter(f => f.id !== fileId))}
        />
      )}

      {/* Viewers & Modals */}
      {viewingWatermarkFile && (
        <WatermarkedViewer
          srcUrl="https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=80"
          recipientEmail={userEmail}
          userIp={userIp}
          mediaType="image"
          onClose={() => setViewingWatermarkFile(null)}
        />
      )}

      {streamingVideoFile && (
        <ZeroRamVideoPlayer
          fileName={streamingVideoFile.fileNameEncrypted}
          totalSizeMb={Math.round(streamingVideoFile.sizeBytes / 1024 / 1024)}
          onClose={() => setStreamingVideoFile(null)}
        />
      )}

      {showOfflineP2P && (
        <OfflineP2PSync userId={userId} onClose={() => setShowOfflineP2P(false)} />
      )}

      {showPricing && (
        <PricingModal currentTier="PRO_SOLO" onClose={() => setShowPricing(false)} />
      )}

      {showPurgeModal && (
        <AccountPurgeModal
          userId={userId}
          onClose={() => setShowPurgeModal(false)}
          onPurgeComplete={() => {
            setFiles([]);
            setShowPurgeModal(false);
          }}
        />
      )}
    </div>
  );
};
