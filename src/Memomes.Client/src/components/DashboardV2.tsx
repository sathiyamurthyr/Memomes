import React, { useState, useEffect, useRef } from 'react';
import {
  LogOut, Wifi, Zap, Bell
} from 'lucide-react';
import { Sidebar } from './Sidebar';
import { Breadcrumbs } from './Breadcrumbs';
import { FileContextMenu } from './FileContextMenu';
import { UploadQueueDrawer } from './UploadQueueDrawer';
import { PanicLockButton } from './PanicLockButton';
import { WatermarkedViewer } from './WatermarkedViewer';
import { OfflineP2PSync } from './OfflineP2PSync';
import { PricingModal } from './PricingModal';
import { AccountPurgeModal } from './AccountPurgeModal';
import { SecureShareModal } from './SecureShareModal';
import { FileControlCenterModal } from './FileControlCenterModal';
import { UploadDestinationModal } from './UploadDestinationModal';
import { UploadSuccessModal } from './UploadSuccessModal';
import { UploadPipelineManager, type UploadQueueItem } from '../services/uploadPipeline';

// Section Pages
import { DashboardPage } from '../pages/DashboardPage';
import { MyFilesPage } from '../pages/MyFilesPage';
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

  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const uploadPipelineRef = useRef<UploadPipelineManager | null>(null);

  // Upload Destination & Success Modals State
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [showDestinationModal, setShowDestinationModal] = useState(false);
  const [lastUploadedFile, setLastUploadedFile] = useState<FileItem | null>(null);
  const [lastUploadedPath, setLastUploadedPath] = useState('My Files / Photos');

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
  const [viewingFile, setViewingFile] = useState<FileItem | null>(null);

  const [showOfflineP2P, setShowOfflineP2P] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);

  useEffect(() => {
    uploadPipelineRef.current = new UploadPipelineManager((newFile) => {
      setFiles(prev => [newFile, ...prev]);
      setLastUploadedFile(newFile);
    });
    const unsubscribe = uploadPipelineRef.current.subscribe(queue => {
      setUploadQueue(queue);
    });
    return () => unsubscribe();
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setPendingFiles(e.target.files);
    setShowDestinationModal(true);
  };

  const handleConfirmDestination = (destination: string, folderName: string) => {
    if (!pendingFiles) return;
    const pathLabel = destination === 'digital-vault' ? 'Digital Vault' : `My Files / ${folderName}`;
    setLastUploadedPath(pathLabel);
    uploadPipelineRef.current?.addFiles(pendingFiles);
    setPendingFiles(null);
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) {
      setPendingFiles(e.dataTransfer.files);
      setShowDestinationModal(true);
    }
  };

  const handleContextMenu = (e: React.MouseEvent, file: FileItem) => {
    e.preventDefault();
    setContextMenu({ file, x: e.clientX, y: e.clientY });
  };

  // Section Page Router
  const renderSectionPage = () => {
    switch (activeSection) {
      case 'dashboard':
        return (
          <DashboardPage
            files={files}
            onUploadClick={() => document.getElementById('main-file-input')?.click()}
            onNavigateToMyFiles={() => setActiveSection('my-files')}
            onOpenVault={() => setActiveSection('digital-vault')}
            onNearbyShare={() => setShowOfflineP2P(true)}
            onAISearchFocus={() => setActiveSection('ai-search')}
            onRequestFiles={() => alert('Dropbox link created.')}
            onOpenViewer={(f) => setViewingFile(f)}
            onOpenShareModal={(f) => setShareModalFile(f)}
            onOpenControlCenter={(f) => setControlCenterFile(f)}
          />
        );
      case 'my-files':
        return (
          <MyFilesPage
            files={files}
            onOpenViewer={(f) => setViewingFile(f)}
            onOpenShareModal={(f) => setShareModalFile(f)}
            onOpenControlCenter={(f) => setControlCenterFile(f)}
            onContextMenu={handleContextMenu}
          />
        );
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
          {sectionContent}
        </main>
      </div>

      {/* Hidden File Input */}
      <input id="main-file-input" type="file" multiple onChange={handleFileInputChange} className="hidden" />

      {/* Upload Destination Selector Modal */}
      {showDestinationModal && (
        <UploadDestinationModal
          onConfirmDestination={handleConfirmDestination}
          onClose={() => setShowDestinationModal(false)}
        />
      )}

      {/* Upload Confirmation Success Dialog */}
      {lastUploadedFile && (
        <UploadSuccessModal
          file={lastUploadedFile}
          destinationPath={lastUploadedPath}
          onClose={() => setLastUploadedFile(null)}
          onOpenFolder={() => setActiveSection('my-files')}
          onViewFile={(f) => setViewingFile(f)}
          onShareFile={(f) => setShareModalFile(f)}
        />
      )}

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

      {shareModalFile && (
        <SecureShareModal
          file={shareModalFile}
          onClose={() => setShareModalFile(null)}
          onShareCreated={() => {
            setFiles(prev => prev.map(f => f.id === shareModalFile.id ? { ...f, activeSharesCount: (f.activeSharesCount || 0) + 1 } : f));
          }}
        />
      )}

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
