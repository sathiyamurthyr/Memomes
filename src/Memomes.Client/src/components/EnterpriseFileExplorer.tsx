import React, { useState, useEffect, useRef } from 'react';
import {
  Folder, FolderPlus, FileText, Image, Film, Music, Archive, Code,
  Table, Presentation, File, ChevronRight, ChevronDown, Grid, List,
  Trash2, Share2, ShieldCheck, BarChart2, Search, ArrowUpDown, X, Eye, RefreshCw, Star
} from 'lucide-react';
import { LocalVaultDb, type VaultFile } from '../utils/localVaultDb';
import { StoragePathBuilder, type EnterpriseFileType } from '../utils/storagePathBuilder';
import { WorkspaceStore } from '../utils/workspaceStore';
import { b2SyncWorker } from '../utils/b2SyncWorker';
import { navStateStore, type FileExplorerState } from '../utils/fileExplorerNavStateStore';
import { Breadcrumbs } from './Breadcrumbs';
import { FileInformationPanel } from './FileInformationPanel';
import { FilePreviewLightboxModal } from './FilePreviewLightboxModal';

interface EnterpriseFileExplorerProps {
  userEmail?: string;
  userRole?: string;
  onOpenUpload: () => void;
  onOpenShare: (file: any) => void;
  selectedCategory?: string;
  activeTab?: string;
}

export const EnterpriseFileExplorer: React.FC<EnterpriseFileExplorerProps> = ({
  userEmail: _userEmail,
  userRole = 'ROLE_USER',
  onOpenUpload,
  onOpenShare,
  selectedCategory,
  activeTab
}) => {
  // Navigation & View State from Persistent navStateStore
  const [navState, setNavState] = useState<FileExplorerState>(() => navStateStore.getState());
  const [selectedFileItem, setSelectedFileItem] = useState<VaultFile | null>(null);
  const [previewFileItem, setPreviewFileItem] = useState<VaultFile | null>(null);
  const [files, setFiles] = useState<VaultFile[]>([]);
  const [_showStatsModal, setShowStatsModal] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  const categoriesList: EnterpriseFileType[] = [
    'Documents', 'Images', 'Videos', 'PDF', 'Spreadsheets',
    'Presentations', 'Archives', 'SourceCode', 'Audio', 'Others'
  ];

  // Subscribe to persistent navigation state
  useEffect(() => {
    const unsubscribe = navStateStore.subscribe((newState) => {
      setNavState(newState);
    });
    return unsubscribe;
  }, []);

  // Synchronize category changes with navStateStore without collapsing tree
  useEffect(() => {
    if (selectedCategory) {
      const match = categoriesList.find(c => c.toLowerCase() === selectedCategory.toLowerCase());
      const catName = match || selectedCategory;
      navStateStore.expandFolder(catName);
      navStateStore.setState({ activeCategory: catName });
    }
  }, [selectedCategory]);

  // Load Vault Files & Subscribe to B2 Sync Worker
  useEffect(() => {
    const loadFiles = () => {
      const stored = LocalVaultDb.getAllFiles();
      setFiles(stored);

      // Enterprise Diagnostic Logging
      const personalWs = WorkspaceStore.getPersonalWorkspace(_userEmail);
      const b2SyncState = b2SyncWorker.getState();
      console.info('===========================================================');
      console.info('🔬 MEMOMES CLOUD — LOGIN & EXPLORER SYNC DIAGNOSTICS');
      console.info('===========================================================');
      console.info(`Logged-in User       : ${_userEmail || 'sathiya@memomes.com'}`);
      console.info(`Workspace            : ${personalWs.workspaceType} (${personalWs.companyId})`);
      console.info(`Workspace Storage ID : ${personalWs.workspaceStorageId}`);
      console.info(`User Storage ID      : ${personalWs.userStorageId}`);
      console.info(`Database File Count  : ${stored.length}`);
      console.info(`B2 Object Count      : ${b2SyncState.syncedCount}`);
      console.info(`Explorer API Count   : ${stored.length}`);
      console.info(`Rendered UI Count    : ${stored.length}`);
      console.info('===========================================================');
    };
    loadFiles();

    const unsubscribe = b2SyncWorker.subscribe(() => {
      loadFiles();
    });
    return unsubscribe;
  }, [_userEmail]);

  // Restore & Preserve Scroll Position
  useEffect(() => {
    if (scrollContainerRef.current && navState.scrollTop > 0) {
      scrollContainerRef.current.scrollTop = navState.scrollTop;
    }
  }, [navState.activeCategory]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    navStateStore.setState({ scrollTop: target.scrollTop });
  };

  // Robust File Size Resolver
  const getFileSizeBytes = (file: VaultFile): number => {
    if (file.metadata?.file_size) return file.metadata.file_size;
    if (typeof file.size === 'number') return file.size;
    if (typeof file.size === 'string') {
      const parsed = parseInt(file.size, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  // Robust Creation Date Timestamp Resolver for Date Sorting
  const getFileCreatedAt = (file: VaultFile): number => {
    if (file.metadata?.created_at) {
      const t = new Date(file.metadata.created_at).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (file.metadata?.updated_at) {
      const t = new Date(file.metadata.updated_at).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (file.updatedAt && file.updatedAt !== 'Just now') {
      const t = new Date(file.updatedAt).getTime();
      if (!isNaN(t) && t > 0) return t;
    }
    if (file.id) {
      const digits = file.id.replace(/\D/g, '');
      if (digits.length >= 10) {
        const ts = parseInt(digits.substring(0, 13), 10);
        if (!isNaN(ts) && ts > 1000000000) return ts;
      }
    }
    return 0;
  };

  const activeCategoryName = selectedCategory || (activeTab === 'files' ? 'All Files' : navState.activeCategory || 'All Files');

  // ── SEARCH & SORT FILTER ENGINE ───────────────────────────────────────────
  const displayedFiles = files
    .filter(f => {
      // 1. Search Query Filter
      if (navState.searchQuery.trim()) {
        const q = navState.searchQuery.toLowerCase().trim();
        const nameMatch = (f.name || '').toLowerCase().includes(q);
        const extMatch = ((f.name || '').split('.').pop() || '').toLowerCase().includes(q);
        const tagMatch = (f as any).tags?.some((t: string) => t.toLowerCase().includes(q));
        const categoryMatch = (f.category || '').toLowerCase().includes(q) || (f.metadata?.folder_path || '').toLowerCase().includes(q);
        const dateMatch = (f.updatedAt || '').toLowerCase().includes(q) ||
                          (f.metadata?.created_at || '').toLowerCase().includes(q) ||
                          (f.metadata?.updated_at || '').toLowerCase().includes(q);
        const keyMatch = (f.metadata?.object_key || '').toLowerCase().includes(q);

        if (!nameMatch && !extMatch && !tagMatch && !categoryMatch && !dateMatch && !keyMatch) {
          return false;
        }
      }

      // 2. Active Tab Filter
      if (activeTab === 'favorites') return (f as any).isFavorite;
      if (activeTab === 'shared') return (f as any).activeSharesCount > 0 || (f as any).sharesCount > 0;
      if (activeTab === 'recent') return true;
      if (activeTab === 'recycle-bin') return (f as any).isDeleted;

      // 3. Active Category Filter (applied when specific category selected and search is empty)
      if (activeCategoryName && activeCategoryName !== 'All Files' && activeCategoryName !== 'all' && !navState.searchQuery.trim()) {
        const fileType = StoragePathBuilder.classifyFileType(f.type, f.name);
        const ext = (f.name.split('.').pop() || '').toLowerCase();
        const cat = (f.category || '').toLowerCase();
        const targetCat = activeCategoryName.toLowerCase();

        let matchesCategory =
          fileType.toLowerCase() === targetCat ||
          cat === targetCat ||
          (f.metadata?.folder_path || '').toLowerCase().includes(targetCat);

        if (!matchesCategory) {
          if (targetCat === 'audio' && (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma', 'aiff'].includes(ext) || cat === 'audio' || (f.type || '').startsWith('audio/'))) {
            matchesCategory = true;
          } else if (targetCat === 'presentations' && (['ppt', 'pptx', 'key', 'odp'].includes(ext) || cat === 'presentation' || cat === 'presentations')) {
            matchesCategory = true;
          } else if (targetCat === 'documents' && (['doc', 'docx', 'txt', 'rtf', 'odt', 'pdf', 'md', 'csv', 'xlsx', 'xls', 'json', 'log', 'pages', 'wps'].includes(ext) || cat === 'document' || cat === 'documents' || (f.type || '').startsWith('text/'))) {
            matchesCategory = true;
          } else if (targetCat === 'images' && (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff', 'heic'].includes(ext) || cat === 'image' || cat === 'images' || (f.type || '').startsWith('image/'))) {
            matchesCategory = true;
          } else if (targetCat === 'videos' && (['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'flv'].includes(ext) || cat === 'video' || cat === 'videos' || (f.type || '').startsWith('video/'))) {
            matchesCategory = true;
          } else if (targetCat === 'spreadsheets' && (['xlsx', 'xls', 'csv', 'ods'].includes(ext) || cat === 'spreadsheet' || cat === 'spreadsheets')) {
            matchesCategory = true;
          } else if (targetCat === 'sourcecode' && (['ts', 'tsx', 'js', 'jsx', 'cs', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'sql', 'xml'].includes(ext) || cat === 'sourcecode' || cat === 'code')) {
            matchesCategory = true;
          } else if (targetCat === 'archives' && (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || cat === 'archive' || cat === 'archives')) {
            matchesCategory = true;
          } else if (targetCat === 'pdf' && (ext === 'pdf' || (f.type || '').includes('pdf'))) {
            matchesCategory = true;
          }
        }
        return matchesCategory;
      }

      return true;
    })
    .sort((a, b) => {
      const { sortBy, sortOrder } = navState;
      let comp = 0;

      if (sortBy === 'name') {
        comp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      } else if (sortBy === 'size') {
        comp = getFileSizeBytes(a) - getFileSizeBytes(b);
      } else if (sortBy === 'type') {
        const typeA = a.type || a.name.split('.').pop() || '';
        const typeB = b.type || b.name.split('.').pop() || '';
        comp = typeA.localeCompare(typeB);
      } else {
        // sortBy === 'date'
        comp = getFileCreatedAt(a) - getFileCreatedAt(b);
      }

      // Tie-breaker: If primary criteria is equal (e.g. same date or same size), fallback to name comparison so ASC/DESC ALWAYS re-orders deterministically
      if (comp === 0) {
        comp = a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' });
      }

      return sortOrder === 'asc' ? comp : -comp;
    });

  // Calculate Category Stats
  const totalCategorySize = displayedFiles.reduce((acc, curr) => acc + getFileSizeBytes(curr), 0);
  const fmtBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper to Category Icon
  const getCategoryIcon = (category?: string, fileName?: string) => {
    const cat = (category || '').toLowerCase();
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';

    if (cat === 'audio' || ['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'].includes(ext)) {
      return <Music className="w-4 h-4 text-[#F5B700]" />;
    }
    if (cat === 'presentations' || cat === 'presentation' || ['ppt', 'pptx', 'key', 'odp'].includes(ext)) {
      return <Presentation className="w-4 h-4 text-amber-400" />;
    }
    if (cat === 'documents' || cat === 'document' || ['doc', 'docx', 'txt', 'rtf', 'odt', 'md'].includes(ext)) {
      return <FileText className="w-4 h-4 text-blue-400" />;
    }
    if (cat === 'pdf' || ext === 'pdf') {
      return <FileText className="w-4 h-4 text-red-400" />;
    }
    if (cat === 'images' || cat === 'image' || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff', 'heic'].includes(ext)) {
      return <Image className="w-4 h-4 text-emerald-400" />;
    }
    if (cat === 'videos' || cat === 'video' || ['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'flv'].includes(ext)) {
      return <Film className="w-4 h-4 text-purple-400" />;
    }
    if (cat === 'spreadsheets' || cat === 'spreadsheet' || ['xlsx', 'xls', 'csv', 'ods'].includes(ext)) {
      return <Table className="w-4 h-4 text-emerald-500" />;
    }
    if (cat === 'archives' || cat === 'archive' || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) {
      return <Archive className="w-4 h-4 text-orange-400" />;
    }
    if (cat === 'sourcecode' || cat === 'source-code' || ['ts', 'tsx', 'js', 'jsx', 'cs', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'sql', 'xml'].includes(ext)) {
      return <Code className="w-4 h-4 text-pink-400" />;
    }
    return <File className="w-4 h-4 text-slate-400" />;
  };

  const handleToggleStar = (id: string) => {
    const isNowFavorite = LocalVaultDb.toggleFavorite(id);
    setFiles(prev => prev.map(f => f.id === id ? { ...f, isFavorite: isNowFavorite } : f));
    if (selectedFileItem?.id === id) {
      setSelectedFileItem(prev => prev ? { ...prev, isFavorite: isNowFavorite } : null);
    }
  };

  const handleDeleteFile = (id: string) => {
    LocalVaultDb.removeFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileItem?.id === id) setSelectedFileItem(null);
    b2SyncWorker.updateFileCounts();
  };

  const handleDeleteAllFiles = () => {
    if (window.confirm('Are you sure you want to delete ALL files from your Zero-Knowledge Vault? This action cannot be undone.')) {
      LocalVaultDb.removeAllFiles();
      setFiles([]);
      setSelectedFileItem(null);
      setPreviewFileItem(null);
      b2SyncWorker.updateFileCounts();
    }
  };

  const handleClearCategory = (catName: string) => {
    if (window.confirm(`Are you sure you want to delete all files in "${catName}" folder?`)) {
      LocalVaultDb.removeFilesByCategory(catName);
      const updated = LocalVaultDb.getAllFiles();
      setFiles(updated);
      if (selectedFileItem && (selectedFileItem.category?.toLowerCase() === catName.toLowerCase() || StoragePathBuilder.classifyFileType(selectedFileItem.type, selectedFileItem.name).toLowerCase() === catName.toLowerCase())) {
        setSelectedFileItem(null);
      }
      b2SyncWorker.updateFileCounts();
    }
  };

  return (
    <div className="space-y-4 text-white font-sans selection:bg-[#F5B700] selection:text-slate-950">
      
      {/* ── BREADCRUMB NAVIGATION ────────────────────────────────────────────── */}
      <Breadcrumbs
        sectionId={activeTab || 'my-files'}
        category={activeCategoryName}
        onNavigateHome={() => {
          navStateStore.setState({ activeCategory: 'Documents' });
        }}
        isAdminMode={navState.isAdminInfraMode}
        rawStoragePath={selectedFileItem?.metadata?.object_key || selectedFileItem?.b2Path || `sathus/memomes/wrk_VAULT/usr_SELF/${activeCategoryName}`}
        onToggleAdminView={() => {
          navStateStore.setState({ isAdminInfraMode: !navState.isAdminInfraMode });
        }}
        userRole={userRole}
      />

      {/* ── TOP HEADER & MAIN PANEL CONTROLS ─────────────────────────────────── */}
      <div className="w-full flex items-center justify-between gap-4 border-b border-white/10 pb-4 flex-nowrap">
        
        {/* SECTION 1 (LEFT): File Icon, Title, File Count, Storage Size, Security Badge */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="p-2.5 rounded-xl bg-[#F5B700]/10 border border-[#F5B700]/20 text-[#F5B700] flex items-center justify-center shrink-0 h-12 w-12">
            {getCategoryIcon(activeCategoryName)}
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2 leading-tight">
              <span>{activeCategoryName}</span>
            </h1>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400 mt-0.5 whitespace-nowrap">
              <span>{displayedFiles.length} {displayedFiles.length === 1 ? 'File' : 'Files'}</span>
              <span className="text-slate-600">•</span>
              <span>{fmtBytes(totalCategorySize)}</span>
              <span className="text-slate-600">•</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 inline" /> Zero-Knowledge Protected
              </span>
            </div>
          </div>
        </div>

        {/* SECTION 2 (CENTER): Search Box Only */}
        <div className="relative flex items-center min-w-[280px] max-w-[420px] flex-1 h-12">
          <Search className="w-4 h-4 text-[#F5B700] absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={navState.searchQuery}
            onChange={(e) => navStateStore.setState({ searchQuery: e.target.value })}
            placeholder="Search in folder..."
            className="w-full h-12 pl-10 pr-9 rounded-xl bg-[#070B14] border border-white/10 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-[#F5B700] transition"
          />
          {navState.searchQuery && (
            <button
              type="button"
              onClick={() => navStateStore.setState({ searchQuery: '' })}
              className="absolute right-3 p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
              title="Clear Search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* SECTION 3 (RIGHT): Sort, Order, View Toggle, Stats, Restore, Upload */}
        <div className="flex items-center gap-2.5 flex-nowrap shrink-0">
          
          {/* 1. Sort Dropdown (48px / h-12) */}
          <div className="flex items-center bg-[#070B14] border border-white/10 rounded-xl px-3 h-12 gap-2 text-xs shrink-0">
            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={navState.sortBy}
              onChange={(e) => navStateStore.setState({ sortBy: e.target.value as any })}
              className="bg-transparent text-slate-200 font-mono font-semibold text-xs focus:outline-none cursor-pointer pr-1"
            >
              <option value="date" className="bg-[#0F172A] text-white">Date</option>
              <option value="name" className="bg-[#0F172A] text-white">Name</option>
              <option value="size" className="bg-[#0F172A] text-white">Size</option>
              <option value="type" className="bg-[#0F172A] text-white">Type</option>
            </select>
          </div>

          {/* 2. Order Toggle (48px / h-12) */}
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              const nextOrder = navState.sortOrder === 'asc' ? 'desc' : 'asc';
              navStateStore.setState({ sortOrder: nextOrder });
            }}
            className="h-12 px-3.5 rounded-xl bg-[#070B14] border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-mono font-bold cursor-pointer select-none shrink-0"
            title={`Sort Direction: ${navState.sortOrder === 'asc' ? 'Ascending' : 'Descending'}`}
          >
            <ArrowUpDown className={`w-4 h-4 text-[#F5B700] transition-transform duration-200 ${navState.sortOrder === 'asc' ? 'rotate-180' : ''}`} />
            <span className="font-mono text-xs uppercase font-extrabold text-[#F5B700]">
              {navState.sortOrder === 'asc' ? 'ASC ▲' : 'DESC ▼'}
            </span>
          </button>

          {/* 3. Compact Segmented View Toggle (48px / h-12) */}
          <div className="flex items-center bg-[#070B14] p-1 h-12 rounded-xl border border-white/10 shrink-0 gap-0.5">
            <button
              onClick={() => navStateStore.setState({ viewMode: 'tree' })}
              className={`h-10 px-2.5 rounded-lg transition flex items-center gap-1.5 text-xs font-mono font-medium ${
                navState.viewMode === 'tree' ? 'bg-[#F5B700] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Tree View"
            >
              <Folder className="w-4 h-4" />
              <span className="hidden xl:inline">Tree</span>
            </button>
            <button
              onClick={() => navStateStore.setState({ viewMode: 'grid' })}
              className={`h-10 px-2.5 rounded-lg transition flex items-center gap-1.5 text-xs font-mono font-medium ${
                navState.viewMode === 'grid' ? 'bg-[#F5B700] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
              <span className="hidden xl:inline">Grid</span>
            </button>
            <button
              onClick={() => navStateStore.setState({ viewMode: 'list' })}
              className={`h-10 px-2.5 rounded-lg transition flex items-center gap-1.5 text-xs font-mono font-medium ${
                navState.viewMode === 'list' ? 'bg-[#F5B700] text-slate-950 font-bold shadow-sm' : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
              title="List View"
            >
              <List className="w-4 h-4" />
              <span className="hidden xl:inline">List</span>
            </button>
          </div>

          {/* 4. Stats Button (Neutral, 48px / h-12) */}
          <button
            onClick={() => setShowStatsModal(true)}
            className="h-12 px-3.5 rounded-xl bg-[#070B14] border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-bold font-mono shrink-0 cursor-pointer"
          >
            <BarChart2 className="w-4 h-4 text-[#F5B700]" />
            <span>Stats</span>
          </button>

          {/* 5. Restore Files Button (Secondary Green, 48px / h-12) */}
          <button
            onClick={() => {
              LocalVaultDb.seedInitialVaultFiles();
              b2SyncWorker.updateFileCounts();
              window.dispatchEvent(new Event('storage'));
            }}
            className="h-12 px-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 font-bold transition flex items-center gap-2 text-xs font-mono shrink-0 cursor-pointer"
            title="Seed/Restore default zero-knowledge vault files"
          >
            <RefreshCw className="w-4 h-4 text-emerald-400" />
            <span>Restore</span>
          </button>

          {/* 6. Upload Button (Primary Gold, 48px / h-12) */}
          <button
            onClick={onOpenUpload}
            className="h-12 px-4 rounded-xl bg-[#F5B700] hover:bg-[#f5c22b] text-slate-950 font-extrabold transition flex items-center gap-2 text-xs font-mono shrink-0 shadow-lg cursor-pointer active:scale-95"
          >
            <FolderPlus className="w-4 h-4 stroke-[2.5]" />
            <span>Upload</span>
          </button>

          {/* 7. Clear Vault Button (Danger Red, Far Right, 48px / h-12) */}
          {files.length > 0 && (
            <button
              onClick={handleDeleteAllFiles}
              className="h-12 px-3.5 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 font-bold transition flex items-center gap-2 text-xs font-mono shrink-0 cursor-pointer"
              title="Delete all files from vault"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Clear ({files.length})</span>
            </button>
          )}

        </div>

      </div>

      {/* ── MAIN CONTENT AREA (GRID / TREE / LIST VIEWS) ─────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* MAIN FILES PANEL (8 COLS) */}
        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="lg:col-span-8 space-y-4 max-h-[calc(100vh-14rem)] overflow-y-auto pr-1"
        >
          
          {/* TREE VIEW MODE */}
          {navState.viewMode === 'tree' && (
            <div className="glass-card p-5 rounded-3xl space-y-3 border border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs font-bold text-[#F5B700] uppercase tracking-wider font-mono flex items-center gap-2">
                  <Folder className="w-4 h-4" /> {activeCategoryName !== 'All Files' && activeCategoryName !== 'all' ? `${activeCategoryName} Vault Folder` : 'Virtual Vault Category Tree'}
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {displayedFiles.length} Matching Objects
                </span>
              </div>

              {/* Hierarchy Tree Nodes */}
              <div className="space-y-2 font-mono text-xs">
                {categoriesList.map(cat => {
                  const categoryFiles = files.filter(f => {
                    const fileType = StoragePathBuilder.classifyFileType(f.type, f.name).toLowerCase();
                    const ext = (f.name.split('.').pop() || '').toLowerCase();
                    const catLower = (f.category || '').toLowerCase();
                    const targetCat = cat.toLowerCase();

                    // Apply search query filter if searchQuery is non-empty
                    if (navState.searchQuery.trim()) {
                      const q = navState.searchQuery.toLowerCase().trim();
                      const nameMatch = (f.name || '').toLowerCase().includes(q);
                      const extMatch = ext.includes(q);
                      if (!nameMatch && !extMatch) return false;
                    }

                    let matches =
                      fileType === targetCat ||
                      catLower === targetCat ||
                      (f.metadata?.folder_path || '').toLowerCase().includes(targetCat);

                    if (!matches) {
                      if (targetCat === 'audio' && (['mp3', 'wav', 'aac', 'flac', 'ogg', 'm4a', 'wma'].includes(ext) || catLower === 'audio' || (f.type || '').startsWith('audio/'))) {
                        matches = true;
                      } else if (targetCat === 'presentations' && (['ppt', 'pptx', 'key', 'odp'].includes(ext) || catLower === 'presentation')) {
                        matches = true;
                      } else if (targetCat === 'documents' && (['doc', 'docx', 'txt', 'rtf', 'odt', 'pdf', 'md', 'csv', 'xlsx', 'xls', 'json', 'log', 'pages', 'wps'].includes(ext) || catLower === 'document' || (f.type || '').startsWith('text/'))) {
                        matches = true;
                      } else if (targetCat === 'images' && (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff', 'heic'].includes(ext) || catLower === 'image' || (f.type || '').startsWith('image/'))) {
                        matches = true;
                      } else if (targetCat === 'videos' && (['mp4', 'mov', 'mkv', 'webm', 'avi', 'm4v', 'flv'].includes(ext) || catLower === 'video' || (f.type || '').startsWith('video/'))) {
                        matches = true;
                      } else if (targetCat === 'spreadsheets' && (['xlsx', 'xls', 'csv', 'ods'].includes(ext) || catLower === 'spreadsheet')) {
                        matches = true;
                      } else if (targetCat === 'sourcecode' && (['ts', 'tsx', 'js', 'jsx', 'cs', 'py', 'java', 'cpp', 'c', 'html', 'css', 'json', 'sql', 'xml'].includes(ext) || catLower === 'sourcecode')) {
                        matches = true;
                      } else if (targetCat === 'archives' && (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || catLower === 'archive')) {
                        matches = true;
                      } else if (targetCat === 'pdf' && (ext === 'pdf' || (f.type || '').includes('pdf'))) {
                        matches = true;
                      }
                    }
                    return matches;
                  });

                  const isSearchActive = !!navState.searchQuery.trim();
                  const isCurrentCategoryActive = activeCategoryName.toLowerCase() === cat.toLowerCase();
                  const isExpanded = isSearchActive ? categoryFiles.length > 0 : (isCurrentCategoryActive || navState.expandedFolders.has(cat));

                  const isSpecificCategorySelected = activeCategoryName !== 'All Files' && activeCategoryName !== 'all';
                  if (isSpecificCategorySelected && !isCurrentCategoryActive) return null;
                  if (isSearchActive && categoryFiles.length === 0) return null;

                  return (
                    <div key={cat} className="space-y-1">
                      <div
                        onClick={() => {
                          navStateStore.toggleFolderExpand(cat);
                          navStateStore.setState({ activeCategory: cat });
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                          isCurrentCategoryActive
                            ? 'bg-[#F5B700]/15 border-[#F5B700]/40 text-white font-bold'
                            : 'bg-[#0E1524] border-white/5 text-slate-300 hover:border-[#F5B700]/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#F5B700]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                          {getCategoryIcon(cat)}
                          <span className="font-bold">{cat}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full font-bold">
                            {categoryFiles.length} files
                          </span>
                          {categoryFiles.length > 0 && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleClearCategory(cat);
                              }}
                              className="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                              title={`Delete all files in ${cat}`}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Render Files inside Category */}
                      {isExpanded && (
                        <div className="pl-6 space-y-1 border-l border-white/10 ml-3">
                          {categoryFiles.length === 0 ? (
                            <div className="text-[11px] text-slate-400 py-2.5 px-3 font-mono flex items-center justify-between bg-white/5 rounded-xl border border-white/5 my-1">
                              <span>No files in {cat} folder</span>
                              <button onClick={onOpenUpload} className="btn-gold !h-7 !px-2.5 !text-[10px] font-bold">
                                <FolderPlus className="w-3 h-3" /> Upload {cat}
                              </button>
                            </div>
                          ) : (
                            categoryFiles.map(file => (
                              <div
                                key={file.id}
                                onClick={() => setSelectedFileItem(file)}
                                className={`flex items-center justify-between p-2 rounded-xl border transition cursor-pointer text-xs ${
                                  selectedFileItem?.id === file.id
                                    ? 'bg-[#F5B700]/20 border-[#F5B700]/50 text-white'
                                    : 'bg-[#070B14] border-white/5 text-slate-300 hover:bg-white/5'
                                }`}
                              >
                                <div className="flex items-center gap-2 truncate">
                                  {getCategoryIcon(cat)}
                                  <span className="truncate">{file.name}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[10px] text-slate-400 shrink-0">
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleToggleStar(file.id); }}
                                    className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-amber-400 transition"
                                    title={file.isFavorite ? "Unstar File" : "Star File"}
                                  >
                                    <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-amber-400 text-amber-400' : ''}`} />
                                  </button>
                                  <span>{fmtBytes(getFileSizeBytes(file))}</span>
                                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* GRID VIEW MODE */}
          {navState.viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {displayedFiles.length === 0 ? (
                <div className="col-span-full text-center py-12 glass-card rounded-3xl border border-white/10 space-y-3">
                  {activeTab === 'favorites' ? (
                    <>
                      <Star className="w-12 h-12 text-amber-400/50 mx-auto" />
                      <div className="text-sm font-bold text-slate-300">No Starred Files Yet</div>
                      <div className="text-xs text-slate-500 max-w-xs mx-auto">
                        Click the star icon on any file to pin it here for instant access.
                      </div>
                    </>
                  ) : (
                    <>
                      <Folder className="w-12 h-12 text-slate-600 mx-auto" />
                      <div className="text-sm font-bold text-slate-300">
                        {navState.searchQuery.trim() ? `No matching files for "${navState.searchQuery}"` : `No files in ${activeCategoryName}`}
                      </div>
                      <div className="text-xs text-slate-500 max-w-xs mx-auto">
                        {navState.searchQuery.trim() ? 'Try clearing your search query or searching for another filename.' : 'Upload new files to automatically categorize them in your Zero-Knowledge Vault.'}
                      </div>
                      {navState.searchQuery.trim() ? (
                        <button onClick={() => navStateStore.setState({ searchQuery: '' })} className="btn-gold !h-8 !px-3 !text-xs mx-auto mt-2">
                          Clear Search
                        </button>
                      ) : (
                        <button onClick={onOpenUpload} className="btn-gold !h-8 !px-3 !text-xs mx-auto mt-2">
                          Upload File
                        </button>
                      )}
                    </>
                  )}
                </div>
              ) : (
                displayedFiles.map(file => {
                  const isSelected = selectedFileItem?.id === file.id;
                  return (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileItem(file)}
                      className={`group p-3.5 rounded-2xl border transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between ${
                        isSelected
                          ? 'bg-[#F5B700]/15 border-[#F5B700]/50 shadow-[0_0_20px_rgba(245,183,0,0.15)]'
                          : 'bg-[#0E1524]/80 hover:bg-[#0E1524] border-white/10 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 group-hover:scale-105 transition-transform">
                          {getCategoryIcon(file.category || StoragePathBuilder.classifyFileType(file.type, file.name), file.name)}
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={(e) => { e.stopPropagation(); handleToggleStar(file.id); }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                            title={file.isFavorite ? "Unstar File" : "Star File"}
                          >
                            <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-400'}`} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); onOpenShare(file); }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                            title="Share Link"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setPreviewFileItem(file); }}
                            className="p-1.5 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition"
                            title="Preview"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs font-bold text-slate-100 truncate mb-1" title={file.name}>
                          {file.name}
                        </div>
                        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                          <span>{fmtBytes(getFileSizeBytes(file))}</span>
                          <span className="flex items-center gap-1 text-emerald-400 font-bold">
                            <ShieldCheck className="w-3 h-3" /> AES-256
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          )}

          {/* LIST VIEW MODE */}
          {navState.viewMode === 'list' && (
            <div className="glass-card rounded-2xl border border-white/10 overflow-hidden">
              <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-[#070B14] border-b border-white/10 text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                <div className="col-span-6">Name</div>
                <div className="col-span-3 text-right">Size</div>
                <div className="col-span-3 text-right">Actions</div>
              </div>

              <div className="divide-y divide-white/5">
                {displayedFiles.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-500 font-mono italic">
                    {navState.searchQuery.trim() ? `No matching files for "${navState.searchQuery}"` : 'No files in folder'}
                  </div>
                ) : (
                  displayedFiles.map(file => (
                    <div
                      key={file.id}
                      onClick={() => setSelectedFileItem(file)}
                      className={`grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs transition cursor-pointer ${
                        selectedFileItem?.id === file.id
                          ? 'bg-[#F5B700]/15 font-bold text-white'
                          : 'hover:bg-white/5 text-slate-300'
                      }`}
                    >
                      <div className="col-span-6 flex items-center gap-2.5 truncate">
                        {getCategoryIcon(file.category || StoragePathBuilder.classifyFileType(file.type, file.name), file.name)}
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="col-span-3 text-right font-mono text-[11px] text-slate-400">
                        {fmtBytes(getFileSizeBytes(file))}
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleStar(file.id); }}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                          title={file.isFavorite ? "Unstar File" : "Star File"}
                        >
                          <Star className={`w-3.5 h-3.5 ${file.isFavorite ? 'fill-amber-400 text-amber-400' : 'text-slate-400 hover:text-amber-400'}`} />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenShare(file); }}
                          className="p-1 rounded-lg bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                          title="Share"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                          className="p-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setPreviewFileItem(file); }}
                          className="p-1 rounded-lg bg-white/5 hover:bg-blue-500/20 text-slate-400 hover:text-blue-400 transition"
                          title="Preview"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* FILE DETAILS SIDE PANEL (4 COLS) */}
        <div className="lg:col-span-4">
          <FileInformationPanel
            file={selectedFileItem}
            onOpenShare={(f) => onOpenShare(f)}
            onDelete={(id) => handleDeleteFile(id)}
            onOpenUpload={onOpenUpload}
          />
        </div>

      </div>

      {/* FILE PREVIEW LIGHTBOX MODAL */}
      {previewFileItem && (
        <FilePreviewLightboxModal
          file={previewFileItem as any}
          userEmail={_userEmail}
          onClose={() => setPreviewFileItem(null)}
          onOpenShare={(f) => { setPreviewFileItem(null); onOpenShare(f); }}
        />
      )}

    </div>
  );
};
