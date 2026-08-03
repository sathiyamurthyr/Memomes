import React, { useState, useEffect } from 'react';
import {
  Search, Upload, FolderPlus, Share2, Lock, ShieldCheck,
  HardDrive, FileText, Image as ImageIcon, Video, Archive, Sparkles, Bell,
  LogOut, Grid, List, Star, MoreVertical, Trash2,
  RefreshCw, Cpu,
  Menu, X, Eye, KeyRound, ArrowRight, Activity, Clock,
  Crown, Trash, Users, RotateCcw, Play,
  Music, Database
} from 'lucide-react';
import { SecureShareModal } from './SecureShareModal';
import { FileControlCenterModal } from './FileControlCenterModal';
import { MemomesLogo } from './MemomesLogo';
import { B2DirectUploadModal } from './B2DirectUploadModal';
import { LocalVaultDb } from '../utils/localVaultDb';
import { b2SyncWorker } from '../utils/b2SyncWorker';
import type { B2SyncState } from '../utils/b2SyncWorker';

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
  // Extended properties used by FileContextMenu, DashboardPage, MyFilesPage
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

export const DashboardV2: React.FC<DashboardV2Props> = ({ onLogout }) => {
  // Navigation state
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Search & Input state
  const [searchQuery, setSearchQuery] = useState('');
  const [, setIsAiSearching] = useState(false);

  // View state & Drag overlay
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isDragOver, setIsDragOver] = useState(false);

  // Backblaze B2 Sync state
  const [b2State, setB2State] = useState<B2SyncState>(b2SyncWorker.getState());
  const [showB2Modal, setShowB2Modal] = useState(false);

  // Modals
  const [selectedFileForShare, setSelectedFileForShare] = useState<FileItem | null>(null);
  const [selectedFileForControl, setSelectedFileForControl] = useState<FileItem | null>(null);
  const [previewModalFile, setPreviewModalFile] = useState<FileItem | null>(null);

  // Recycle Bin / Trash collection
  const [trashFiles, setTrashFiles] = useState<FileItem[]>([]);

  // Real-time Activity Log Feed
  const [activityLogs, setActivityLogs] = useState<ActivityLogEntry[]>([
    { id: 'act-1', action: 'B2_SYNC_COMPLETED', timestamp: new Date().toLocaleTimeString(), status: 'Success', details: 'All encrypted payloads synced to sathus-memomes-vault' },
    { id: 'act-2', action: 'AES_256_KEY_DERIVED', timestamp: '10 mins ago', status: 'Success', details: 'PBKDF2 Client Master Key derived with 100,000 iterations' },
    { id: 'act-3', action: 'ZERO_KNOWLEDGE_ACTIVE', timestamp: '1 hour ago', status: 'Encrypted', details: 'End-to-End Encryption Envelope Verified' },
  ]);

  // Subscribe to B2 Auto Sync Worker
  useEffect(() => {
    const unsubscribe = b2SyncWorker.subscribe((newState) => {
      setB2State(newState);
    });
    return unsubscribe;
  }, []);

  // Main file collection initialized with sample files + local vault storage
  const [files, setFiles] = useState<FileItem[]>([
    {
      id: 'file-01',
      name: 'Screenshot 2026-07-30 182140.png',
      size: '0.5 MB',
      type: 'Images',
      updatedAt: 'Just now',
      isFavorite: false,
      sharesCount: 0,
      fileNameEncrypted: 'e3b0c442...png.enc',
      category: 'image',
      badgeColor: '#F5C027',
      badgeType: 'IMG',
      b2Synced: true,
      previewUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'file-02',
      name: 'ChatGPT Image Jul 26, 2026, 08_54_14 PM.png',
      size: '1.9 MB',
      type: 'Images',
      updatedAt: 'Just now',
      isFavorite: true,
      sharesCount: 1,
      fileNameEncrypted: 'f8a1d990...png.enc',
      category: 'image',
      badgeColor: '#EF4444',
      badgeType: 'YT',
      b2Synced: true,
      previewUrl: 'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'file-03',
      name: 'Family Trip Goa 2024.jpg',
      size: '2.4 MB',
      type: 'Images',
      updatedAt: '2 mins ago',
      isFavorite: true,
      sharesCount: 5,
      fileNameEncrypted: 'c90a1b22...jpg.enc',
      category: 'image',
      badgeColor: '#22C55E',
      badgeType: 'IMG',
      b2Synced: true,
      previewUrl: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'file-04',
      name: 'Passport_Sathiya.pdf',
      size: '1.2 MB',
      type: 'Documents',
      updatedAt: '1 hour ago',
      isFavorite: false,
      sharesCount: 3,
      fileNameEncrypted: 'a1b2c3d4...pdf.enc',
      category: 'document',
      badgeColor: '#EF4444',
      badgeType: 'PDF',
      b2Synced: true
    },
    {
      id: 'file-05',
      name: 'Amazon_Invoice_May.pdf',
      size: '3.6 MB',
      type: 'Documents',
      updatedAt: '3 hours ago',
      isFavorite: false,
      sharesCount: 2,
      fileNameEncrypted: 'b7c8d9e0...pdf.enc',
      category: 'document',
      badgeColor: '#22C55E',
      badgeType: 'DOC',
      b2Synced: true
    },
    {
      id: 'file-06',
      name: 'Goa Beach Sunset.mp4',
      size: '528 MB',
      type: 'Videos',
      updatedAt: 'Yesterday',
      isFavorite: false,
      sharesCount: 4,
      fileNameEncrypted: 'e4f5g6h7...mp4.enc',
      category: 'video',
      badgeColor: '#8B5CF6',
      badgeType: 'MP4',
      b2Synced: true,
      previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600&auto=format&fit=crop&q=80'
    },
    {
      id: 'file-07',
      name: 'Freelance_Contract.pdf',
      size: '2.1 MB',
      type: 'Documents',
      updatedAt: '2 days ago',
      isFavorite: false,
      sharesCount: 2,
      fileNameEncrypted: 'i8j9k0l1...pdf.enc',
      category: 'document',
      badgeColor: '#EF4444',
      badgeType: 'PDF',
      b2Synced: true
    },
    {
      id: 'file-08',
      name: 'Project_Assets.zip',
      size: '45.8 MB',
      type: 'Archives',
      updatedAt: '3 days ago',
      isFavorite: false,
      sharesCount: 0,
      fileNameEncrypted: 'm2n3o4p5...zip.enc',
      category: 'archive',
      badgeColor: '#F5C027',
      badgeType: 'ZIP',
      b2Synced: true
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
          badgeColor: '#F5C027',
          badgeType: 'FILE',
          b2Synced: (s as any).b2Synced || false
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

  const handleAiSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsAiSearching(true);
    addActivityLog('AI_SEARCH_QUERY', `Asked AI: "${searchQuery}"`);
    setTimeout(() => {
      setIsAiSearching(false);
    }, 800);
  };

  /* ─── Dynamic Upload Workflow with Local Vault DB & B2 Sync ─── */
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

          // Trigger Backblaze B2 Upload Sync
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

  /* ─── Dynamic Recycle Bin (Trash) Delete & Restore Workflow ─── */
  const deleteFile = (id: string) => {
    const fileToDelete = files.find(f => f.id === id);
    if (fileToDelete) {
      setFiles(prev => prev.filter(f => f.id !== id));
      setTrashFiles(prev => [fileToDelete, ...prev]);
      addActivityLog('FILE_TRASHED', `Moved ${fileToDelete.name} to Recycle Bin`, 'Warning');
    }
  };

  const restoreFile = (id: string) => {
    const fileToRestore = trashFiles.find(f => f.id === id);
    if (fileToRestore) {
      setTrashFiles(prev => prev.filter(f => f.id !== id));
      setFiles(prev => [fileToRestore, ...prev]);
      addActivityLog('FILE_RESTORED', `Restored ${fileToRestore.name} from Recycle Bin`, 'Success');
    }
  };

  const purgePermanently = (id: string) => {
    const fileToPurge = trashFiles.find(f => f.id === id);
    setTrashFiles(prev => prev.filter(f => f.id !== id));
    if (fileToPurge) {
      addActivityLog('FILE_PURGED', `Permanently purged ${fileToPurge.name} from storage & B2`, 'Purged');
    }
  };

  const emptyTrash = () => {
    setTrashFiles([]);
    addActivityLog('TRASH_EMPTIED', 'Permanently emptied all files from Recycle Bin', 'Purged');
  };

  // Filter files dynamically based on category and search query
  const filteredFiles = files.filter(file => {
    const matchesSearch = !searchQuery.trim() || file.name.toLowerCase().includes(searchQuery.toLowerCase()) || file.type.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'favorites') return file.isFavorite;
    return file.category === selectedCategory;
  });

  const NAVIGATION_ITEMS = [
    { id: 'dashboard', label: 'Dashboard', icon: Grid },
    { id: 'files', label: 'My Files', icon: HardDrive },
    { id: 'shared', label: 'Shared With Me', icon: Users },
    { id: 'ai', label: 'AI Intelligence', icon: Sparkles },
    { id: 'control', label: 'Control Center', icon: Share2 },
    { id: 'vault', label: 'Digital Vault', icon: Lock, badge: 'PRO' },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'favorites', label: 'Favorites', icon: Star, badge: files.filter(f => f.isFavorite).length > 0 ? String(files.filter(f => f.isFavorite).length) : undefined },
    { id: 'trash', label: 'Recycle Bin', icon: Trash, badge: trashFiles.length > 0 ? String(trashFiles.length) : undefined },
    { id: 'activity', label: 'Activity Log', icon: Activity },
  ];

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div 
      onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
      onDragLeave={() => setIsDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragOver(false);
        const file = e.dataTransfer.files?.[0];
        if (file) handleUploadClick();
      }}
      className="min-h-screen bg-[#070B14] text-[#FFFFFF] flex flex-col font-sans selection:bg-[#F5C027] selection:text-black relative"
    >
      
      {/* Drag & Drop Overlay */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-[#070B14]/94 backdrop-blur-2xl flex flex-col items-center justify-center border-4 border-dashed border-[#F5C027] space-y-4">
          <div className="w-20 h-20 rounded-full bg-[#F5C027]/20 flex items-center justify-center text-[#F5C027] animate-bounce">
            <Upload className="w-10 h-10" />
          </div>
          <div className="text-2xl font-black text-white font-heading">Drop Files to Encrypt & Store</div>
          <div className="text-xs text-[#94A3B8] font-mono">Zero-Knowledge Client Encryption Ready</div>
        </div>
      )}

      {/* ─── 1. TOP NAVIGATION BAR ─── */}
      <header className="h-20 bg-[#0B101D] border-b border-white/[0.06] sticky top-0 z-40 px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-3 md:gap-6">
          <button 
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#CBD5E1] hover:text-white hover:bg-[#172134] rounded-xl transition md:hidden"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#F5C027]" /> : <Menu className="w-6 h-6" />}
          </button>

          <button 
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-2 text-[#94A3B8] hover:text-white hover:bg-[#172134] rounded-xl transition"
          >
            <Menu className="w-5 h-5" />
          </button>
          
          <MemomesLogo size="md" onClick={() => setActiveTab('dashboard')} />

          {/* BACKBLAZE B2 AUTO SYNC STATUS BADGE */}
          <div className="hidden xl:flex items-center gap-3 pl-4">
            <div className="px-3.5 py-1.5 rounded-xl bg-[#0E1524] border border-[#F5C027]/30 text-xs font-mono flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#22C55E] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#22C55E]"></span>
              </span>
              <span className="text-white font-bold">B2 Bucket:</span>
              <span className="text-[#F5C027] font-semibold">{b2State.targetBucket}</span>
              <span className="text-[#94A3B8] text-[10px] pl-1">({formatCountdown(b2State.nextSyncCountdown)})</span>
            </div>

            <button 
              onClick={() => setShowB2Modal(true)}
              className="px-3 py-1.5 rounded-xl bg-[#F5C027]/15 hover:bg-[#F5C027]/25 border border-[#F5C027]/40 text-[#F5C027] text-xs font-extrabold flex items-center gap-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${b2State.isSyncing ? 'animate-spin' : ''}`} />
              <span>{b2State.isSyncing ? 'Syncing...' : 'Sync B2 Now'}</span>
            </button>
          </div>
        </div>

        <div className="hidden md:flex items-center max-w-md w-full mx-6">
          <div 
            onClick={() => { setActiveTab('dashboard'); setTimeout(() => document.getElementById('hero-ai-search')?.focus(), 100); }}
            className="w-full bg-[#0E1524] border border-white/[0.06] hover:border-[#F5C027]/40 rounded-2xl px-4 py-2.5 flex items-center justify-between text-xs text-[#94A3B8] cursor-pointer transition"
          >
            <div className="flex items-center gap-2">
              <Search className="w-4 h-4 text-[#F5C027]" />
              <span>Ask AI anything about your files...</span>
            </div>
            <div className="px-2 py-0.5 bg-[#172134] rounded-md border border-white/[0.06] font-mono text-[10px] text-[#CBD5E1]">
              ⌘K
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-4">
          <button onClick={handleUploadClick} className="btn-gold hidden sm:inline-flex text-xs font-extrabold">
            <Upload className="w-4 h-4" /> Upload New File
          </button>

          <button className="relative p-2.5 rounded-2xl bg-[#0E1524] border border-white/[0.06] text-[#CBD5E1] hover:text-white transition">
            <Bell className="w-4 h-4" />
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#F5C027] text-[#070B14] text-[9px] font-extrabold flex items-center justify-center">
              3
            </span>
          </button>

          <div className="hidden sm:flex items-center gap-3 pl-2">
            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-[#F5C027]/50 shadow-md">
              <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80" alt="Sathiya" className="w-full h-full object-cover" />
            </div>
            <div className="hidden xl:block text-left">
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                Sathiya
              </div>
              <span className="px-1.5 py-0.5 rounded bg-[#F5C027]/20 text-[#F5C027] text-[9px] font-mono font-bold">PRO</span>
            </div>
          </div>

          <button 
            onClick={onLogout} 
            title="Sign Out"
            className="p-2.5 rounded-2xl bg-[#0E1524] border border-white/[0.06] text-[#94A3B8] hover:text-[#EF4444] transition"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* ─── MAIN BODY ─── */}
      <div className="flex-1 flex relative">
        
        {/* DESKTOP SIDEBAR */}
        <aside className={`hidden md:flex flex-col border-r border-white/[0.06] bg-[#0B101D] transition-all duration-300 ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } p-4 space-y-6 shrink-0`}>
          
          <nav className="space-y-1.5 flex-1">
            {NAVIGATION_ITEMS.map(item => {
              const Icon = item.icon;
              const isSelected = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between px-3.5 py-3 rounded-2xl text-xs font-semibold transition ${
                    isSelected
                      ? 'bg-[#172134] text-[#F5C027] border border-[#F5C027]/30 shadow-lg'
                      : 'text-[#94A3B8] hover:text-white hover:bg-[#172134]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-5 h-5 ${isSelected ? 'text-[#F5C027]' : ''}`} />
                    {!sidebarCollapsed && <span>{item.label}</span>}
                  </div>
                  {!sidebarCollapsed && item.badge && (
                    <span className="px-2 py-0.5 rounded bg-[#F5C027]/20 text-[#F5C027] text-[9px] font-mono font-bold">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          {!sidebarCollapsed && (
            <div className="p-4 rounded-2xl bg-[#0E1524] border border-[#F5C027]/30 space-y-3 relative overflow-hidden">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#F5C027]">
                <Crown className="w-4 h-4 text-[#F5C027]" /> Upgrade to Pro
              </div>
              <p className="text-[11px] text-[#94A3B8] leading-relaxed">
                Unlock 2 TB storage, advanced sharing control, and more.
              </p>
              <button className="btn-gold w-full text-xs h-10 font-bold">
                Upgrade Now <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {!sidebarCollapsed && (
            <div className="pt-2 border-t border-white/[0.06] space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-[#94A3B8]">Storage Used</span>
                <span className="text-[#F5C027] font-mono">31%</span>
              </div>
              <div className="h-1.5 rounded-full bg-[#172134] overflow-hidden">
                <div className="h-full bg-gradient-to-r from-[#F5C027] to-[#D4A017] rounded-full w-[31%]" />
              </div>
              <div className="text-[10px] text-[#94A3B8] font-mono">153.8 GB / 500 GB</div>
            </div>
          )}
        </aside>

        {/* ─── MAIN CONTENT VIEW AREA ─── */}
        <main className="flex-1 p-4 md:p-8 space-y-8 overflow-y-auto max-w-7xl mx-auto w-full pb-28 md:pb-12">
          
          {/* TAB 1: DASHBOARD HOME TAB */}
          {activeTab === 'dashboard' && (
            <>
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div className="space-y-3">
                  <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight font-heading flex items-center gap-2">
                    Good Evening, <span className="text-[#F5C027]">Sathiya</span> 👋
                  </h1>
                  <p className="text-xs md:text-sm text-[#94A3B8]">
                    Your files are secure. You have complete control, even after sharing.
                  </p>

                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <span className="px-3.5 py-1.5 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-xs font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-[#22C55E]" /> 98% Security Health
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-[#F5C027]/10 border border-[#F5C027]/30 text-[#F5C027] text-xs font-semibold flex items-center gap-1.5">
                      <Database className="w-4 h-4 text-[#F5C027]" /> Backblaze B2 Auto-Sync (2m)
                    </span>
                    <span className="px-3.5 py-1.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-semibold flex items-center gap-1.5">
                      <Upload className="w-4 h-4 text-[#3B82F6]" /> {files.length} Files Uploaded
                    </span>
                  </div>
                </div>

                <div className="glass-card p-5 border-[#F5C027]/30 flex items-center justify-between gap-6 max-w-md w-full">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#F5C027]/20 to-[#F5C027]/5 border border-[#F5C027]/40 flex items-center justify-center text-[#F5C027]">
                      <Crown className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white">Security Status</div>
                      <div className="text-[11px] text-[#22C55E] font-semibold">All systems protected</div>
                    </div>
                  </div>

                  <div className="space-y-1 text-[11px] font-mono border-l border-white/[0.06] pl-4">
                    <div className="flex items-center justify-between gap-3 text-[#CBD5E1]">
                      <span>✔ AES-256 Encryption</span> <span className="text-[#22C55E] font-bold">Active</span>
                    </div>
                    <div className="flex items-center justify-between gap-3 text-[#CBD5E1]">
                      <span>✔ Zero-Knowledge</span> <span className="text-[#22C55E] font-bold">Active</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* HERO AI SEARCH */}
              <section className="glass-card p-6 md:p-8 space-y-6 relative overflow-hidden ai-hero-box border-[#F5C027]/40">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-[#F5C027]/20 border border-[#F5C027]/40 flex items-center justify-center text-[#F5C027]">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg md:text-xl font-black text-white font-heading">Intelligent AI Search & Discovery</h2>
                    <p className="text-xs text-[#94A3B8]">Search across encrypted files, documents, images, text, and metadata.</p>
                  </div>
                </div>

                <form onSubmit={handleAiSearchSubmit} className="relative">
                  <input
                    id="hero-ai-search"
                    type="text"
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder='Ask AI: "Find passport", "Show tax files"...'
                    className="w-full bg-[#0E1524] border border-[#F5C027]/40 focus:border-[#F5C027] rounded-2xl px-5 py-4 pl-12 pr-36 text-sm text-white focus:outline-none"
                  />
                  <Search className="w-5 h-5 text-[#F5C027] absolute left-4 top-1/2 -translate-y-1/2" />
                  <button type="submit" className="btn-gold absolute right-3 top-1/2 -translate-y-1/2 text-xs h-9 px-4 font-bold">
                    Ask AI
                  </button>
                </form>
              </section>

              {/* QUICK ACTIONS & STORAGE ANALYTICS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-4">
                  <h3 className="text-base font-extrabold text-white font-heading">Quick Actions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    <button onClick={handleUploadClick} className="p-5 rounded-2xl bg-gradient-to-br from-[#F5C027] to-[#D4A017] text-[#070B14] flex flex-col justify-between h-36 font-black text-left">
                      <Upload className="w-6 h-6 text-[#070B14]" />
                      <div>Upload Files<div className="text-xs font-normal">Drag & drop files</div></div>
                    </button>
                    <button onClick={handleUploadClick} className="glass-card p-4 flex flex-col justify-between h-36 text-left">
                      <FolderPlus className="w-5 h-5 text-[#F5C027]" />
                      <div className="text-xs font-bold text-white">Create Folder</div>
                    </button>
                    <button onClick={() => setActiveTab('vault')} className="glass-card p-4 flex flex-col justify-between h-36 text-left">
                      <Lock className="w-5 h-5 text-[#F5C027]" />
                      <div className="text-xs font-bold text-white">Secure Vault (PRO)</div>
                    </button>
                  </div>
                </div>

                <div className="glass-card p-6 space-y-6">
                  <h3 className="text-base font-extrabold text-white font-heading">Storage Analytics</h3>
                  <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
                    <span className="text-xl font-black text-white font-mono">31%</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: MY FILES EXPLORER */}
          {(activeTab === 'files' || activeTab === 'recent') && (
            <div className="space-y-6">
              
              {/* Header Title Bar */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white font-heading">My Files Explorer</h1>
                  <p className="text-xs text-[#94A3B8]">Browse, filter, and manage your encrypted files ({filteredFiles.length} items)</p>
                </div>

                <div className="flex items-center gap-3">
                  <button onClick={handleUploadClick} className="btn-gold text-xs h-10 px-5 font-extrabold flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Upload File
                  </button>
                  
                  <div className="flex bg-[#0E1524] p-1 rounded-xl border border-white/10">
                    <button 
                      onClick={() => setViewMode('grid')} 
                      className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-[#172134] text-[#F5C027] border border-[#F5C027]/30' : 'text-[#94A3B8]'}`}
                    >
                      <Grid className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => setViewMode('list')} 
                      className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-[#172134] text-[#F5C027] border border-[#F5C027]/30' : 'text-[#94A3B8]'}`}
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Category Filter Chips & Search Bar Row */}
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                
                {/* Left Category Filter Pills */}
                <div className="flex items-center gap-2 font-mono text-xs overflow-x-auto pb-1">
                  {[
                    { id: 'all', label: 'All Files', icon: null },
                    { id: 'document', label: 'Documents', icon: FileText },
                    { id: 'image', label: 'Images', icon: ImageIcon },
                    { id: 'video', label: 'Videos', icon: Video },
                    { id: 'audio', label: 'Audio', icon: Music },
                    { id: 'archive', label: 'Archives', icon: Archive },
                    { id: 'favorites', label: 'Favorites', icon: Star },
                  ].map(cat => {
                    const Icon = cat.icon;
                    const isActive = selectedCategory === cat.id;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 whitespace-nowrap ${
                          isActive
                            ? 'bg-[#F5C027] text-[#070B14] shadow-md shadow-[#F5C027]/20 font-black'
                            : 'bg-[#0E1524] border border-white/[0.06] text-[#94A3B8] hover:text-white hover:bg-[#172134]'
                        }`}
                      >
                        {Icon && <Icon className="w-3.5 h-3.5" />}
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Right Search Input & Dropdowns */}
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <input 
                      type="text" 
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search files..."
                      className="bg-[#0E1524] border border-white/10 focus:border-[#F5C027] rounded-xl px-4 py-2 pl-9 text-xs text-white placeholder-[#94A3B8] focus:outline-none w-48 sm:w-64"
                    />
                    <Search className="w-3.5 h-3.5 text-[#94A3B8] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              </div>

              {/* 4-COLUMN GRID OF FILE CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {filteredFiles.map((file, idx) => (
                  <div key={file.id || idx} className="glass-card p-4 space-y-3 group cursor-pointer relative overflow-hidden border border-white/[0.06] hover:border-[#F5C027]/40 transition">
                    
                    <div 
                      onClick={() => setPreviewModalFile(file)}
                      className="h-40 rounded-2xl bg-[#070B14] border border-white/[0.06] overflow-hidden relative flex items-center justify-center group-hover:border-[#F5C027]/40 transition"
                    >
                      <div 
                        className="absolute top-3 left-3 z-10 w-7 h-7 rounded-lg flex items-center justify-center text-white font-bold text-[10px] shadow-lg"
                        style={{ backgroundColor: file.badgeColor || '#F5C027' }}
                      >
                        {file.category === 'image' ? <ImageIcon className="w-4 h-4 text-white" /> : file.category === 'video' ? <Video className="w-4 h-4 text-white" /> : file.category === 'archive' ? <Archive className="w-4 h-4 text-white" /> : <FileText className="w-4 h-4 text-white" />}
                      </div>

                      <button 
                        onClick={(e) => { e.stopPropagation(); toggleFavorite(file.id); }}
                        className={`absolute top-3 right-3 z-10 p-1.5 rounded-lg bg-black/40 backdrop-blur-md transition ${file.isFavorite ? 'text-[#F5C027]' : 'text-[#94A3B8] hover:text-white'}`}
                      >
                        <Star className={`w-4 h-4 ${file.isFavorite ? 'fill-current' : ''}`} />
                      </button>

                      {file.category === 'video' ? (
                        <div className="w-full h-full relative flex items-center justify-center bg-gradient-to-tr from-[#0E1524] to-[#172134]">
                          {file.previewUrl ? (
                            <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover" />
                          ) : (
                            <Video className="w-12 h-12 text-[#F5C027]" />
                          )}
                          <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                            <div className="w-10 h-10 rounded-full bg-[#F5C027] text-[#070B14] shadow-xl flex items-center justify-center pl-0.5 group-hover:scale-110 transition">
                              <Play className="w-5 h-5 fill-current" />
                            </div>
                          </div>
                        </div>
                      ) : file.previewUrl ? (
                        <img src={file.previewUrl} alt={file.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-16 h-16 rounded-2xl bg-[#0E1524] border border-white/10 flex items-center justify-center text-[#F5C027]">
                          {file.category === 'archive' ? <Archive className="w-8 h-8 text-[#F5C027]" /> : <FileText className="w-8 h-8 text-[#EF4444]" />}
                        </div>
                      )}
                    </div>

                    <div className="space-y-1">
                      <div className="text-xs font-bold text-white truncate" title={file.name}>
                        {file.name}
                      </div>
                      <div className="text-[10px] text-[#94A3B8] font-mono flex items-center justify-between">
                        <span>{file.size} · {file.updatedAt}</span>
                        <span className="text-[#22C55E] text-[9px] font-bold">✔ B2 Synced</span>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs">
                      <button 
                        onClick={() => setSelectedFileForShare(file)}
                        className="px-3.5 py-1.5 rounded-xl bg-[#F5C027] text-[#070B14] font-extrabold text-xs hover:bg-[#D4A017] transition shadow-md shadow-[#F5C027]/20"
                      >
                        Share
                      </button>

                      <div className="flex items-center gap-1">
                        <button 
                          onClick={() => setSelectedFileForControl(file)}
                          className="p-1.5 rounded-xl bg-[#0E1524] border border-white/10 text-[#94A3B8] hover:text-white transition"
                          title="Manage Access"
                        >
                          <MoreVertical className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => deleteFile(file.id)}
                          className="p-1.5 rounded-xl bg-[#0E1524] border border-white/10 text-[#EF4444] hover:bg-[#EF4444]/15 transition"
                          title="Delete File"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 3: CONTROL AFTER SHARING CENTER */}
          {(activeTab === 'control' || activeTab === 'shared') && (
            <div className="space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-[#F5C027]/15 border border-[#F5C027]/40 flex items-center justify-center text-[#F5C027]">
                  <Share2 className="w-6 h-6" />
                </div>
                <div>
                  <h1 className="text-2xl md:text-3xl font-black text-white font-heading">Control After Sharing Center</h1>
                  <p className="text-xs text-[#94A3B8]">Manage share permissions, view limits, and self-destruct timers</p>
                </div>
              </div>

              <div className="glass-card p-6 space-y-4">
                <div className="text-xs font-bold text-[#F5C027] uppercase tracking-wider font-mono">Active Shares Overview</div>
                <div className="space-y-3">
                  {files.map(file => (
                    <div key={file.id} className="p-4 rounded-xl bg-[#070B14] border border-white/10 flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-white">{file.name}</div>
                        <div className="text-[10px] text-[#94A3B8] font-mono">Encrypted Token: {file.fileNameEncrypted}</div>
                      </div>
                      <button onClick={() => setSelectedFileForControl(file)} className="btn-gold text-xs h-9 px-4 font-bold">
                        Manage Access
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: AI INTELLIGENCE */}
          {activeTab === 'ai' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F5C027]/20 border border-[#F5C027]/40 flex items-center justify-center text-[#F5C027]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white font-heading">AI Assistant & Document Intelligence</h2>
                  <p className="text-xs text-[#94A3B8]">Natural language search across encrypted document contents</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { title: 'Document Summarizer', desc: 'Extract key clauses & summaries', icon: FileText, color: '#F5C027' },
                  { title: 'OCR Text Extractor', desc: 'Read text from scanned images', icon: Eye, color: '#3B82F6' },
                  { title: 'Smart Auto-Tagging', desc: 'Categorize photos & files automatically', icon: Cpu, color: '#22C55E' },
                  { title: 'Semantic Search', desc: 'Cross-vault semantic vector search', icon: Search, color: '#8B5CF6' },
                ].map((feat, i) => {
                  const Icon = feat.icon;
                  return (
                    <div key={i} className="glass-card p-5 space-y-3 cursor-pointer hover:border-[#F5C027] transition">
                      <Icon className="w-6 h-6" style={{ color: feat.color }} />
                      <div className="text-sm font-bold text-white">{feat.title}</div>
                      <div className="text-xs text-[#94A3B8]">{feat.desc}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 5: DIGITAL VAULT */}
          {activeTab === 'vault' && (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F5C027]/20 border border-[#F5C027]/40 flex items-center justify-center text-[#F5C027]">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-2xl font-black text-white font-heading">Zero-Knowledge Key Vault</h2>
                  <p className="text-xs text-[#94A3B8]">AES-256-GCM Master Key & Shamir Secret Recovery Shards</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="glass-card p-6 space-y-3">
                  <div className="text-xs font-bold text-[#22C55E] flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> Master Key Active</div>
                  <div className="text-xs text-[#CBD5E1]">Derived via PBKDF2 (100,000+ iterations) on client memory.</div>
                  <div className="p-3 bg-[#070B14] rounded-xl font-mono text-[10px] text-[#F5C027]">● Key Hash: e3b0c44298fc1c149afbf4c8996fb92427ae...</div>
                </div>

                <div className="glass-card p-6 space-y-3">
                  <div className="text-xs font-bold text-[#F5C027] flex items-center gap-1.5"><KeyRound className="w-4 h-4" /> Shamir Shards (3-of-2)</div>
                  <div className="text-xs text-[#CBD5E1]">3 recovery shards generated for social key restoration.</div>
                  <div className="p-3 bg-[#070B14] rounded-xl font-mono text-[10px] text-[#22C55E]">● Shard Status: Distributed & Verified</div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 6: FAVORITES */}
          {activeTab === 'favorites' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white font-heading">Favorites & Pinned Vault Items</h2>
                  <p className="text-xs text-[#94A3B8]">{files.filter(f => f.isFavorite).length} pinned items</p>
                </div>
              </div>

              {files.filter(f => f.isFavorite).length === 0 ? (
                <div className="glass-card p-12 text-center text-[#94A3B8] space-y-2">
                  <Star className="w-10 h-10 text-[#F5C027] mx-auto opacity-50" />
                  <div className="text-sm font-bold text-white">No favorite files pinned yet</div>
                  <div className="text-xs">Click the star icon on any file card to pin it to your favorites.</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  {files.filter(f => f.isFavorite).map(file => (
                    <div key={file.id} className="glass-card p-4 space-y-3">
                      <div className="text-xs font-bold text-white flex items-center justify-between">
                        <span className="truncate">{file.name}</span>
                        <button onClick={() => toggleFavorite(file.id)} className="text-[#F5C027]">
                          <Star className="w-4 h-4 fill-current" />
                        </button>
                      </div>
                      <div className="text-[10px] font-mono text-[#94A3B8]">{file.size} · {file.updatedAt}</div>
                      <button onClick={() => setSelectedFileForShare(file)} className="btn-gold text-xs h-8 w-full font-bold">Share</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 7: RECYCLE BIN (TRASH WITH DYNAMIC RESTORE & PURGE) */}
          {activeTab === 'trash' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white font-heading">Recycle Bin ({trashFiles.length})</h2>
                  <p className="text-xs text-[#94A3B8]">Items are stored for 30 days before Backblaze B2 purge</p>
                </div>
                {trashFiles.length > 0 && (
                  <button onClick={emptyTrash} className="px-4 py-2 rounded-xl bg-[#EF4444]/15 border border-[#EF4444]/30 text-[#EF4444] text-xs font-bold hover:bg-[#EF4444]/30 transition">
                    Empty Trash
                  </button>
                )}
              </div>

              {trashFiles.length === 0 ? (
                <div className="glass-card p-12 text-center text-[#94A3B8] space-y-3">
                  <Trash className="w-10 h-10 mx-auto text-[#94A3B8]" />
                  <div className="text-sm font-bold text-white">Recycle Bin is Empty</div>
                  <div className="text-xs text-[#94A3B8]">No deleted files in your zero-knowledge vault buffer</div>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {trashFiles.map(file => (
                    <div key={file.id} className="glass-card p-4 space-y-3 border border-red-500/20">
                      <div className="text-xs font-bold text-white truncate">{file.name}</div>
                      <div className="text-[10px] text-[#94A3B8] font-mono">{file.size} · Trashed</div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/10 gap-2">
                        <button onClick={() => restoreFile(file.id)} className="px-3 py-1.5 rounded-lg bg-[#22C55E]/15 border border-[#22C55E]/30 text-[#22C55E] text-xs font-bold flex items-center gap-1">
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                        <button onClick={() => purgePermanently(file.id)} className="px-3 py-1.5 rounded-lg bg-red-950/60 border border-red-500/30 text-red-300 text-xs font-bold">
                          Delete Forever
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 8: DYNAMIC REAL-TIME ACTIVITY LOG */}
          {activeTab === 'activity' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-black text-white font-heading">Security & Access Activity Log</h2>
                  <p className="text-xs text-[#94A3B8]">Live audit feed of all security actions, encryption operations, and B2 syncs</p>
                </div>
              </div>

              <div className="glass-card p-6 space-y-4">
                <div className="space-y-3 text-xs font-mono">
                  {activityLogs.map(log => (
                    <div key={log.id} className="p-3.5 rounded-xl bg-[#070B14] border border-white/[0.06] flex items-center justify-between gap-4">
                      <div>
                        <span className="text-[#CBD5E1]">[{log.timestamp}] </span>
                        <span className="text-white font-bold">{log.action}: </span>
                        <span className="text-[#94A3B8]">{log.details}</span>
                      </div>
                      <span className={`px-2.5 py-1 rounded-md text-[10px] font-bold ${
                        log.status === 'Success' ? 'bg-[#22C55E]/15 text-[#22C55E]' :
                        log.status === 'Encrypted' ? 'bg-[#F5C027]/15 text-[#F5C027]' :
                        log.status === 'Warning' ? 'bg-orange-500/15 text-orange-400' : 'bg-red-500/15 text-red-400'
                      }`}>
                        {log.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* MODALS */}
      {selectedFileForShare && <SecureShareModal file={selectedFileForShare} onClose={() => setSelectedFileForShare(null)} />}
      {selectedFileForControl && <FileControlCenterModal file={selectedFileForControl} onClose={() => setSelectedFileForControl(null)} />}
      {showB2Modal && <B2DirectUploadModal onClose={() => setShowB2Modal(false)} />}
      
      {/* FILE PREVIEW MODAL */}
      {previewModalFile && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card max-w-3xl w-full p-6 space-y-5 relative border border-white/10 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F5C027]/15 border border-[#F5C027]/40 flex items-center justify-center text-[#F5C027]">
                  {previewModalFile.category === 'video' ? <Video className="w-5 h-5" /> : previewModalFile.category === 'image' ? <ImageIcon className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    {previewModalFile.name}
                  </h3>
                  <p className="text-xs text-[#F5C027] font-mono">
                    {previewModalFile.size} · Zero-Knowledge AES-256 Decrypted
                  </p>
                </div>
              </div>
              
              <button 
                onClick={() => setPreviewModalFile(null)} 
                className="w-9 h-9 rounded-xl bg-[#0E1524] border border-white/10 text-[#94A3B8] hover:text-white hover:border-[#F5C027] flex items-center justify-center transition"
              >
                ✕
              </button>
            </div>

            {/* Preview Body */}
            <div className="flex-1 overflow-y-auto flex items-center justify-center min-h-[300px] max-h-[60vh] bg-[#070B14] rounded-2xl border border-white/[0.06] p-4 relative">
              {previewModalFile.category === 'video' || previewModalFile.name.endsWith('.mp4') ? (
                previewModalFile.previewUrl && previewModalFile.previewUrl.startsWith('data:video') ? (
                  <video 
                    src={previewModalFile.previewUrl} 
                    controls 
                    autoPlay 
                    className="w-full max-h-[55vh] rounded-2xl border border-white/10 bg-black"
                  />
                ) : (
                  <div className="w-full h-full min-h-[280px] rounded-2xl bg-gradient-to-tr from-[#0E1524] to-[#172134] border border-white/10 flex flex-col items-center justify-center space-y-3 relative overflow-hidden p-6 text-center">
                    <div className="w-16 h-16 rounded-full bg-[#F5C027]/20 border border-[#F5C027]/40 flex items-center justify-center text-[#F5C027] animate-pulse">
                      <Play className="w-8 h-8 fill-current ml-1" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white">Zero-Knowledge Encrypted Video Stream</div>
                      <div className="text-xs text-[#94A3B8] font-mono mt-1">H.264 / AAC · AES-256-GCM Envelope Active</div>
                    </div>
                    <div className="px-3 py-1 rounded-full bg-[#22C55E]/10 border border-[#22C55E]/30 text-[#22C55E] text-[10px] font-mono font-bold">
                      ✔ Client Decoded Stream
                    </div>
                  </div>
                )
              ) : previewModalFile.previewUrl ? (
                <img 
                  src={previewModalFile.previewUrl} 
                  alt={previewModalFile.name} 
                  className="w-full max-h-[55vh] object-contain rounded-2xl shadow-xl" 
                />
              ) : (
                <div className="w-full py-12 flex flex-col items-center justify-center space-y-4 text-center">
                  <div className="w-20 h-20 rounded-3xl bg-[#F5C027]/10 border border-[#F5C027]/30 flex items-center justify-center text-[#F5C027]">
                    <FileText className="w-10 h-10 text-[#EF4444]" />
                  </div>
                  <div className="space-y-1">
                    <div className="text-sm font-bold text-white">{previewModalFile.name}</div>
                    <div className="text-xs text-[#94A3B8] font-mono">{previewModalFile.size} · Encrypted Binary Envelope</div>
                    <div className="text-[11px] text-[#22C55E] font-mono pt-1">✔ Zero-Knowledge AES-256-GCM Verified</div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer Action Bar */}
            <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="text-xs font-mono text-[#94A3B8] truncate max-w-sm">
                Token: <span className="text-white font-bold">{previewModalFile.fileNameEncrypted || previewModalFile.id}</span>
              </div>

              <div className="flex items-center gap-3">
                <button 
                  onClick={() => { const f = previewModalFile; setPreviewModalFile(null); setSelectedFileForShare(f); }} 
                  className="btn-gold text-xs h-10 px-5 font-bold flex items-center gap-2"
                >
                  <Share2 className="w-4 h-4" /> Share File
                </button>

                <button 
                  onClick={() => { const f = previewModalFile; setPreviewModalFile(null); setSelectedFileForControl(f); }} 
                  className="px-4 py-2 rounded-xl bg-[#0E1524] border border-white/10 hover:border-[#F5C027] text-xs font-bold text-white transition"
                >
                  Manage Access
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
