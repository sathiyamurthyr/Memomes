import React, { useState, useEffect, useRef } from 'react';
import {
  Folder, FolderPlus, FileText, Image, Film, Music, Archive, Code,
  Table, Presentation, File, ChevronRight, ChevronDown, Grid, List,
  Trash2, Share2, ShieldCheck, Info, BarChart2, Search, ArrowUpDown
} from 'lucide-react';
import { LocalVaultDb, type VaultFile } from '../utils/localVaultDb';
import { StoragePathBuilder, type EnterpriseFileType } from '../utils/storagePathBuilder';
import { b2SyncWorker } from '../utils/b2SyncWorker';
import { navStateStore, type FileExplorerState } from '../utils/fileExplorerNavStateStore';
import { Breadcrumbs } from './Breadcrumbs';

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
    };
    loadFiles();

    const unsubscribe = b2SyncWorker.subscribe(() => {
      loadFiles();
    });
    return unsubscribe;
  }, []);

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

  // Sort & Filter Displayed Files
  const getFileSizeBytes = (file: VaultFile): number => {
    if (file.metadata?.file_size) return file.metadata.file_size;
    if (typeof file.size === 'number') return file.size;
    if (typeof file.size === 'string') {
      const parsed = parseInt(file.size, 10);
      return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
  };

  const getFileCreatedAt = (file: VaultFile): number => {
    if (file.metadata?.created_at) return new Date(file.metadata.created_at).getTime();
    if (file.updatedAt) return new Date(file.updatedAt).getTime();
    return 0;
  };

  const activeCategoryName = selectedCategory || navState.activeCategory || 'Documents';

  const displayedFiles = files
    .filter(f => {
      if (navState.searchQuery.trim()) {
        const q = navState.searchQuery.toLowerCase();
        const nameMatch = f.name.toLowerCase().includes(q);
        const tagMatch = (f as any).tags?.some((t: string) => t.toLowerCase().includes(q));
        if (!nameMatch && !tagMatch) return false;
      }
      if (activeTab === 'favorites') return (f as any).isFavorite;
      if (activeTab === 'shared') return (f as any).activeSharesCount > 0 || (f as any).sharesCount > 0;
      if (activeTab === 'recent') return true;
      if (activeTab === 'recycle-bin') return (f as any).isDeleted;

      if (activeCategoryName) {
        const fileType = StoragePathBuilder.classifyFileType(f.type, f.name);
        return fileType.toLowerCase() === activeCategoryName.toLowerCase() || f.category?.toLowerCase() === activeCategoryName.toLowerCase();
      }
      return true;
    })
    .sort((a, b) => {
      const { sortBy, sortOrder } = navState;
      let comp = 0;
      if (sortBy === 'name') comp = a.name.localeCompare(b.name);
      else if (sortBy === 'size') comp = getFileSizeBytes(a) - getFileSizeBytes(b);
      else if (sortBy === 'type') comp = a.type.localeCompare(b.type);
      else comp = getFileCreatedAt(b) - getFileCreatedAt(a);

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
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'documents': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'images': return <Image className="w-4 h-4 text-emerald-400" />;
      case 'videos': return <Film className="w-4 h-4 text-purple-400" />;
      case 'audio': return <Music className="w-4 h-4 text-[#F5B700]" />;
      case 'archives': return <Archive className="w-4 h-4 text-orange-400" />;
      case 'sourcecode': return <Code className="w-4 h-4 text-pink-400" />;
      case 'spreadsheets': return <Table className="w-4 h-4 text-emerald-500" />;
      case 'presentations': return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
      default: return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  const handleDeleteFile = (id: string) => {
    LocalVaultDb.removeFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileItem?.id === id) setSelectedFileItem(null);
  };

  return (
    <div className="space-y-4 text-white font-sans selection:bg-[#F5B700] selection:text-slate-950">
      
      {/* ── BREADCRUMB NAVIGATION (Consumer-Friendly Home > Folder) ───────── */}
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2.5">
            {getCategoryIcon(activeCategoryName)}
            <span>{activeCategoryName}</span>
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-1 flex items-center gap-2">
            <span>{displayedFiles.length} {displayedFiles.length === 1 ? 'File' : 'Files'}</span>
            <span>·</span>
            <span>{fmtBytes(totalCategorySize)}</span>
            <span>·</span>
            <span className="text-emerald-400 font-bold">Zero-Knowledge Protected</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Search Filter */}
          <div className="relative flex items-center min-w-[160px]">
            <Search className="w-3.5 h-3.5 text-[#F5B700] absolute left-3 pointer-events-none" />
            <input
              type="text"
              value={navState.searchQuery}
              onChange={(e) => navStateStore.setState({ searchQuery: e.target.value })}
              placeholder="Search in folder..."
              className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#070B14] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-[#F5B700]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center bg-[#070B14] border border-white/10 rounded-xl px-2 py-1 gap-1 text-xs">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={navState.sortBy}
              onChange={(e) => navStateStore.setState({ sortBy: e.target.value as any })}
              className="bg-transparent text-slate-300 font-semibold text-xs focus:outline-none cursor-pointer"
            >
              <option value="date" className="bg-[#0F172A] text-white">Sort by Date</option>
              <option value="name" className="bg-[#0F172A] text-white">Sort by Name</option>
              <option value="size" className="bg-[#0F172A] text-white">Sort by Size</option>
              <option value="type" className="bg-[#0F172A] text-white">Sort by Type</option>
            </select>
          </div>

          {/* View Mode Switchers */}
          <div className="flex bg-[#070B14] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => navStateStore.setState({ viewMode: 'tree' })}
              className={`p-1.5 rounded-lg transition ${navState.viewMode === 'tree' ? 'bg-[#F5B700] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Tree View"
            >
              <Folder className="w-4 h-4" />
            </button>
            <button
              onClick={() => navStateStore.setState({ viewMode: 'grid' })}
              className={`p-1.5 rounded-lg transition ${navState.viewMode === 'grid' ? 'bg-[#F5B700] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => navStateStore.setState({ viewMode: 'list' })}
              className={`p-1.5 rounded-lg transition ${navState.viewMode === 'list' ? 'bg-[#F5C027] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Stats Button */}
          <button
            onClick={() => setShowStatsModal(true)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold font-mono"
          >
            <BarChart2 className="w-4 h-4 text-[#F5B700]" /> Stats
          </button>

          {/* Upload Button */}
          <button onClick={onOpenUpload} className="btn-gold !h-9 !px-4 !text-xs shadow-lg">
            <FolderPlus className="w-4 h-4" /> Upload
          </button>
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
                  <Folder className="w-4 h-4" /> Virtual Vault Category Tree
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {files.length} Total Objects
                </span>
              </div>

              {/* Hierarchy Tree Nodes */}
              <div className="space-y-2 font-mono text-xs">
                {categoriesList.map(cat => {
                  const categoryFiles = files.filter(f => {
                    const fileCat = (f.metadata?.folder_path || '').includes(cat) || StoragePathBuilder.classifyFileType(f.type, f.name) === cat;
                    return fileCat;
                  });

                  const isExpanded = navState.expandedFolders.has(cat);

                  return (
                    <div key={cat} className="space-y-1">
                      <div
                        onClick={() => {
                          navStateStore.toggleFolderExpand(cat);
                          navStateStore.setState({ activeCategory: cat });
                        }}
                        className={`flex items-center justify-between p-2.5 rounded-xl border cursor-pointer transition ${
                          activeCategoryName.toLowerCase() === cat.toLowerCase()
                            ? 'bg-[#F5B700]/15 border-[#F5B700]/40 text-white font-bold'
                            : 'bg-[#0E1524] border-white/5 text-slate-300 hover:border-[#F5B700]/30'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {isExpanded ? <ChevronDown className="w-3.5 h-3.5 text-[#F5B700]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                          {getCategoryIcon(cat)}
                          <span className="font-bold">{cat}</span>
                        </div>
                        <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full font-bold">
                          {categoryFiles.length} files
                        </span>
                      </div>

                      {/* Render Files inside Category */}
                      {isExpanded && (
                        <div className="pl-6 space-y-1 border-l border-white/10 ml-3">
                          {categoryFiles.length === 0 ? (
                            <div className="text-[11px] text-slate-500 py-1 font-mono italic">No files in folder</div>
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
                  <Folder className="w-12 h-12 text-slate-600 mx-auto" />
                  <div className="text-sm font-bold text-slate-300">No files in {activeCategoryName}</div>
                  <div className="text-xs text-slate-500 max-w-xs mx-auto">Upload new files to automatically categorize them in your Zero-Knowledge Vault.</div>
                  <button onClick={onOpenUpload} className="btn-gold !h-8 !px-3 !text-xs mx-auto mt-2">
                    Upload File
                  </button>
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
                          {getCategoryIcon(activeCategoryName)}
                        </div>
                        <div className="flex items-center gap-1">
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
                  <div className="text-center py-8 text-xs text-slate-500 font-mono italic">No files in folder</div>
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
                        {getCategoryIcon(activeCategoryName)}
                        <span className="truncate">{file.name}</span>
                      </div>
                      <div className="col-span-3 text-right font-mono text-[11px] text-slate-400">
                        {fmtBytes(getFileSizeBytes(file))}
                      </div>
                      <div className="col-span-3 flex items-center justify-end gap-1.5">
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenShare(file); }}
                          className="p-1 rounded bg-white/5 hover:bg-white/15 text-slate-300 hover:text-white transition"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }}
                          className="p-1 rounded bg-white/5 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* FILE DETAILS INSPECTOR (4 COLS) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5 rounded-3xl border border-white/10 space-y-4">
            <h3 className="text-xs font-bold text-[#F5B700] uppercase tracking-wider font-mono flex items-center gap-2">
              <Info className="w-4 h-4" /> File Details & Security Inspector
            </h3>

            {selectedFileItem ? (
              <div className="space-y-4 text-xs font-sans">
                {/* File Preview Thumbnail */}
                <div className="h-36 rounded-2xl bg-[#070B14] border border-white/10 overflow-hidden flex items-center justify-center relative group">
                  {selectedFileItem.type.startsWith('image/') && (selectedFileItem.dataUrl || selectedFileItem.b2FinalUrl) ? (
                    <img
                      src={selectedFileItem.dataUrl || selectedFileItem.b2FinalUrl}
                      alt={selectedFileItem.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center space-y-2">
                      {getCategoryIcon(activeCategoryName)}
                      <div className="text-[11px] text-slate-400 font-mono">{selectedFileItem.name.split('.').pop()?.toUpperCase()} File</div>
                    </div>
                  )}
                </div>

                {/* Name & Basic Info */}
                <div>
                  <div className="text-sm font-bold text-white truncate" title={selectedFileItem.name}>
                    {selectedFileItem.name}
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {fmtBytes(getFileSizeBytes(selectedFileItem))} · {selectedFileItem.type}
                  </div>
                </div>

                {/* Security Properties */}
                <div className="p-3 rounded-2xl bg-[#070B14] border border-white/10 space-y-2 text-[11px] font-mono">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Encryption:</span>
                    <span className="text-emerald-400 font-bold">AES-256-GCM</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Zero-Knowledge:</span>
                    <span className="text-emerald-400 font-[#F5B700]">Enforced</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Storage Provider:</span>
                    <span className="text-slate-300">Backblaze B2 Vault</span>
                  </div>
                </div>

                {/* Admin-Only Infrastructure View */}
                {navState.isAdminInfraMode && (
                  <div className="p-3 rounded-2xl bg-amber-950/40 border border-amber-500/30 space-y-2 text-[10px] font-mono">
                    <div className="text-amber-400 font-bold uppercase tracking-wider mb-1 flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Admin Object Key Metadata
                    </div>
                    <div className="break-all text-slate-300">
                      <span className="text-slate-500 block">Object Key Path:</span>
                      {selectedFileItem.metadata?.object_key || selectedFileItem.b2Path || `sathus/memomes/wrk_VAULT/usr_SELF/${activeCategoryName}`}
                    </div>
                    {selectedFileItem.metadata?.file_id && (
                      <div className="break-all text-slate-300">
                        <span className="text-slate-500 block">B2 File ID:</span>
                        {selectedFileItem.metadata.file_id}
                      </div>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => onOpenShare(selectedFileItem)}
                    className="flex-1 py-2 rounded-xl bg-[#F5B700] text-slate-950 font-bold text-xs hover:brightness-110 transition flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" /> Share
                  </button>
                  <button
                    onClick={() => handleDeleteFile(selectedFileItem.id)}
                    className="px-3 py-2 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 hover:bg-rose-500/30 transition text-xs font-bold"
                  >
                    Delete
                  </button>
                </div>

              </div>
            ) : (
              <div className="text-center py-12 text-slate-500 space-y-2">
                <Info className="w-8 h-8 text-slate-600 mx-auto" />
                <div className="text-xs font-mono">Select a file to inspect metadata and security attributes.</div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
