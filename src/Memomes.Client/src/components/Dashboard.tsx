import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, Search, Upload, Lock, Trash2, Video, FileText, LogOut,
  Archive, RefreshCw, Eye, Download, Wifi, Zap, Sparkles, HardDrive
} from 'lucide-react';
import { PanicLockButton } from './PanicLockButton';
import { AIOnboardingBanner } from './AIOnboardingBanner';
import { WatermarkedViewer } from './WatermarkedViewer';
import { ZeroRamVideoPlayer } from './ZeroRamVideoPlayer';
import { OfflineP2PSync } from './OfflineP2PSync';
import { PricingModal } from './PricingModal';
import { AccountPurgeModal } from './AccountPurgeModal';
import { ZkCrypto } from '../crypto/zkCrypto';
import { ClientHasher } from '../crypto/hash';

export interface FileItem {
  id: string;
  fileNameEncrypted: string;
  contentTypeEncrypted: string;
  sizeBytes: number;
  contentHash: string;
  accessTier: 'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL';
  isColdStorage: boolean;
  lastAccessedAt: string;
  createdAt: string;
}

interface DashboardProps {
  userEmail: string;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userEmail, onLogout }) => {
  const [userId] = useState<string>('a1b2c3d4-e5f6-7890-abcd-1234567890ab');
  const [userIp] = useState<string>('103.21.124.5');

  const [files, setFiles] = useState<FileItem[]>([
    {
      id: 'f101-video',
      fileNameEncrypted: 'Family_Goa_Vacation_2026.mp4',
      contentTypeEncrypted: 'video/mp4',
      sizeBytes: 154000000, // 154 MB
      contentHash: 'hash_video_01',
      accessTier: 'FULL_CONTROL',
      isColdStorage: false,
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'f102-photo',
      fileNameEncrypted: 'Land_Deed_Registry_Document.pdf',
      contentTypeEncrypted: 'application/pdf',
      sizeBytes: 4200000,
      contentHash: 'hash_doc_02',
      accessTier: 'READ_DOWNLOAD',
      isColdStorage: false,
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    },
    {
      id: 'f103-archive',
      fileNameEncrypted: 'Encrypted_Backup_2025.zip',
      contentTypeEncrypted: 'application/zip',
      sizeBytes: 850000000,
      contentHash: 'hash_archive_03',
      accessTier: 'VIEW_ONLY',
      isColdStorage: true, // Cold Storage example
      lastAccessedAt: new Date(Date.now() - 35 * 86400 * 1000).toISOString(),
      createdAt: new Date(Date.now() - 40 * 86400 * 1000).toISOString()
    }
  ]);

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchLatencyMs, setSearchLatencyMs] = useState<number | null>(null);

  // Modals & Viewers
  const [viewingWatermarkFile, setViewingWatermarkFile] = useState<FileItem | null>(null);
  const [streamingVideoFile, setStreamingVideoFile] = useState<FileItem | null>(null);
  const [showOfflineP2P, setShowOfflineP2P] = useState(false);
  const [showPricing, setShowPricing] = useState(false);
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'files' | 'trash'>('files');

  // Cold Storage Re-hydration notification state
  const [rehydratingFileId, setRehydratingFileId] = useState<string | null>(null);

  // Derive master key on mount
  useEffect(() => {
    ZkCrypto.deriveMasterKey('MemomesUserSecretPassword2026!', 'user_salt_123');
  }, []);

  // Storage Allocation breakdown metrics
  const usedVideoBytes = 154000000;
  const usedPhotoBytes = 45000000;
  const usedDocsBytes = 4200000;
  const usedArchiveBytes = 850000000;
  const totalUsedBytes = usedVideoBytes + usedPhotoBytes + usedDocsBytes + usedArchiveBytes;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];

    const buffer = await file.arrayBuffer();
    const hash = await ClientHasher.calculateContentHash(buffer, 'user_salt_123');

    const newFileItem: FileItem = {
      id: crypto.randomUUID(),
      fileNameEncrypted: file.name,
      contentTypeEncrypted: file.type || 'application/octet-stream',
      sizeBytes: file.size,
      contentHash: hash,
      accessTier: 'FULL_CONTROL',
      isColdStorage: false,
      lastAccessedAt: new Date().toISOString(),
      createdAt: new Date().toISOString()
    };

    setFiles(prev => [newFileItem, ...prev]);

    // Send init upload request to .NET 8 API
    fetch('/api/files/init-upload', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        fileNameEncrypted: file.name,
        contentTypeEncrypted: file.type || 'application/octet-stream',
        sizeBytes: file.size,
        contentHash: hash
      })
    });
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    const start = performance.now();

    // Call pgvector endpoint with simulated 512d vector query
    const dummyVector512 = new Array(512).fill(0).map(() => (Math.random() - 0.5));
    try {
      const res = await fetch('/api/embeddings/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          queryVector512: dummyVector512,
          limit: 5
        })
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

  const handleOpenFile = (file: FileItem) => {
    if (file.isColdStorage) {
      setRehydratingFileId(file.id);
      setTimeout(() => {
        file.isColdStorage = false;
        setRehydratingFileId(null);
        openFileMode(file);
      }, 1800);
      return;
    }
    openFileMode(file);
  };

  const openFileMode = (file: FileItem) => {
    if (file.accessTier === 'VIEW_ONLY') {
      setViewingWatermarkFile(file);
    } else if (file.contentTypeEncrypted.includes('video') || file.fileNameEncrypted.endsWith('.mp4')) {
      setStreamingVideoFile(file);
    } else {
      setViewingWatermarkFile(file);
    }
  };

  const handleSoftDelete = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    fetch(`/api/files/${fileId}/trash?userId=${userId}`, { method: 'DELETE' });
  };

  return (
    <div className="min-h-screen bg-surface text-gray-100 font-sans pb-12">
      {/* Header Bar */}
      <header className="sticky top-0 z-40 glass-panel border-b border-stroke-default px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-primary to-accent-gold p-0.5 shadow-lg shadow-primary/20">
            <div className="w-full h-full bg-surface-container rounded-[10px] flex items-center justify-center">
              <Lock className="w-4 h-4 text-accent-gold" />
            </div>
          </div>
          <div>
            <h1 className="text-base font-extrabold text-white tracking-wide">Memomes Cloud</h1>
            <p className="text-[11px] text-gray-400 font-mono">Logged in as {userEmail}</p>
          </div>
        </div>

        {/* Security Quick Actions Panel */}
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowOfflineP2P(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-surface-container hover:bg-surface-card border border-stroke-default rounded-lg text-xs font-semibold text-gray-300 transition"
          >
            <Wifi className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Offline P2P</span>
          </button>

          <button
            onClick={() => setShowPricing(true)}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-lg text-xs font-bold text-accent-gold transition"
          >
            <Zap className="w-3.5 h-3.5 text-accent-gold" />
            <span>Pro Solo (₹149/mo)</span>
          </button>

          <button
            onClick={() => setShowPurgeModal(true)}
            className="p-1.5 bg-surface-container hover:bg-surface-card border border-stroke-default rounded-lg text-gray-400 hover:text-red-400 text-xs"
            title="DPDP Purge & Ransomware Rollback"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {/* Panic Lock Emergency Button */}
          <PanicLockButton userId={userId} onLockComplete={onLogout} />

          {/* Sign Out Button */}
          <button
            onClick={onLogout}
            className="flex items-center space-x-1 px-3 py-1.5 bg-surface-card hover:bg-surface-hover text-gray-300 hover:text-white border border-stroke-default rounded-lg text-xs font-bold transition"
            title="Sign out of Zero-Knowledge vault"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span className="hidden sm:inline">Sign Out</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        {/* Onboarding Zero-Knowledge AI Banner */}
        <AIOnboardingBanner progress={100} isIndexing={false} />

        {/* Storage Allocation & Interactive Security Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Storage Bar Card */}
          <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-stroke-default">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-accent-gold" /> Storage Allocation Breakdown
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  {(totalUsedBytes / 1024 / 1024).toFixed(1)} MB of 100 GB Used (0.9%)
                </p>
              </div>
              <span className="text-xs font-mono text-accent-gold bg-amber-500/10 border border-amber-500/30 px-2.5 py-1 rounded-full">
                Pro Solo Plan (₹149/mo)
              </span>
            </div>

            {/* Multi-Colored Segmented Storage Allocation Progress Bar */}
            <div className="w-full h-3.5 bg-surface border border-stroke-default rounded-full overflow-hidden flex mb-4">
              <div className="bg-primary h-full" style={{ width: '15%' }} title="Video (#A00D3A)" />
              <div className="bg-accent-gold h-full" style={{ width: '8%' }} title="Photo (#FFC928)" />
              <div className="bg-accent-blue h-full" style={{ width: '4%' }} title="Docs (#3B82F6)" />
              <div className="bg-accent-green h-full" style={{ width: '40%' }} title="Archive (#10B981)" />
            </div>

            {/* Storage Categories Legend */}
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

          {/* Interactive Security Panel */}
          <div className="glass-card rounded-2xl p-6 border border-stroke-default flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" /> Security & Enclave Badge
                </h3>
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                  ACTIVE
                </span>
              </div>

              <div className="space-y-2.5 text-xs text-gray-300">
                <div className="flex justify-between p-2 bg-surface rounded-lg border border-stroke-default">
                  <span className="text-gray-400">Encryption Engine:</span>
                  <span className="font-mono text-accent-gold font-semibold">AES-256-GCM (12B IV)</span>
                </div>
                <div className="flex justify-between p-2 bg-surface rounded-lg border border-stroke-default">
                  <span className="text-gray-400">Social Recovery:</span>
                  <span className="font-mono text-emerald-400 font-semibold">Shamir 3-of-2 SSSS</span>
                </div>
                <div className="flex justify-between p-2 bg-surface rounded-lg border border-stroke-default">
                  <span className="text-gray-400">Active Sessions:</span>
                  <span className="font-mono text-white">1 Device</span>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-stroke-default flex items-center justify-between text-[11px] text-gray-400">
              <span>Zero-Knowledge Hard Rule</span>
              <span className="text-emerald-400 font-semibold">0 Server Master Keys</span>
            </div>
          </div>
        </div>

        {/* Natural Language Vector Search Bar */}
        <div className="glass-card rounded-2xl p-4 mb-8 border border-stroke-default">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                placeholder='Try natural language search: "Show me my mom and father photos" or "Find my land deed"...'
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

        {/* Files Toolbar & Upload Zone */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div className="flex items-center space-x-2 border-b border-stroke-default pb-1">
            <button
              onClick={() => setActiveTab('files')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'files' ? 'bg-surface-card text-accent-gold border border-stroke-default' : 'text-gray-400'}`}
            >
              All Vault Files ({files.length})
            </button>
            <button
              onClick={() => setActiveTab('trash')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${activeTab === 'trash' ? 'bg-surface-card text-accent-gold border border-stroke-default' : 'text-gray-400'}`}
            >
              Vault Trash (30-Day Auto Purge)
            </button>
          </div>

          <label className="cursor-pointer px-4 py-2.5 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white text-xs font-bold rounded-xl border border-red-500/30 shadow-lg shadow-primary/20 transition flex items-center space-x-2">
            <Upload className="w-4 h-4 text-amber-300" />
            <span>Encrypt & Upload File</span>
            <input type="file" onChange={handleFileUpload} className="hidden" />
          </label>
        </div>

        {/* File Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {files.map((file) => (
            <div
              key={file.id}
              className="glass-card rounded-xl p-5 border border-stroke-default flex flex-col justify-between relative group"
            >
              {/* Cold Storage Re-hydration Status Badge */}
              {rehydratingFileId === file.id ? (
                <div className="absolute inset-0 bg-surface-container/95 backdrop-blur-sm rounded-xl z-20 flex flex-col items-center justify-center p-4 text-center">
                  <RefreshCw className="w-8 h-8 text-accent-gold animate-spin mb-2" />
                  <p className="text-xs font-bold text-accent-gold">Waking up file from cold vault...</p>
                  <p className="text-[10px] text-gray-400 mt-1">Downloading low-res encrypted thumbnail</p>
                </div>
              ) : null}

              <div>
                <div className="flex items-start justify-between mb-3">
                  <div className="p-2.5 bg-surface rounded-xl border border-stroke-default">
                    {file.contentTypeEncrypted.includes('video') || file.fileNameEncrypted.endsWith('.mp4') ? (
                      <Video className="w-5 h-5 text-primary" />
                    ) : file.contentTypeEncrypted.includes('pdf') ? (
                      <FileText className="w-5 h-5 text-accent-blue" />
                    ) : (
                      <Archive className="w-5 h-5 text-accent-green" />
                    )}
                  </div>

                  <div className="flex items-center space-x-1.5">
                    {file.isColdStorage && (
                      <span className="text-[10px] font-semibold bg-blue-950/60 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full">
                        30D COLD VAULT
                      </span>
                    )}
                    <span className="text-[10px] font-semibold bg-surface border border-stroke-default px-2 py-0.5 rounded-full text-gray-300">
                      {file.accessTier}
                    </span>
                  </div>
                </div>

                <h4 className="font-semibold text-gray-100 text-sm truncate mb-1" title={file.fileNameEncrypted}>
                  {file.fileNameEncrypted}
                </h4>
                <p className="text-xs text-gray-400 font-mono">
                  {(file.sizeBytes / 1024 / 1024).toFixed(1)} MB
                </p>
              </div>

              {/* File Actions Footer */}
              <div className="mt-5 pt-3 border-t border-stroke-default flex items-center justify-between text-xs">
                <button
                  onClick={() => handleOpenFile(file)}
                  className="flex items-center space-x-1 text-accent-gold hover:text-amber-300 font-medium"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>{file.accessTier === 'VIEW_ONLY' ? 'Watermark Stream' : 'Decrypt & View'}</span>
                </button>

                <div className="flex items-center space-x-2">
                  {file.accessTier !== 'VIEW_ONLY' && (
                    <button
                      onClick={() => alert(`Presigned 60-second S3 URL issued for ${file.fileNameEncrypted}`)}
                      className="p-1 text-gray-400 hover:text-white"
                      title="Download (60s Presigned S3)"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <button
                    onClick={() => handleSoftDelete(file.id)}
                    className="p-1 text-gray-400 hover:text-red-400"
                    title="Move to Vault Trash"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Render Active Modals */}
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
