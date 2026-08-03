import React, { useState, useEffect } from 'react';
import {
  Folder, FolderPlus, FileText, Image, Film, Music, Archive, Code,
  Table, Presentation, File, ChevronRight, ChevronDown, Grid, List,
  Trash2, Share2, ShieldCheck, ExternalLink, Info, Database, BarChart2
} from 'lucide-react';
import { LocalVaultDb, type VaultFile } from '../utils/localVaultDb';
import { StoragePathBuilder, type EnterpriseFileType } from '../utils/storagePathBuilder';
import { b2SyncWorker } from '../utils/b2SyncWorker';

interface EnterpriseFileExplorerProps {
  userEmail?: string;
  onOpenUpload: () => void;
  onOpenShare: (file: any) => void;
}

export const EnterpriseFileExplorer: React.FC<EnterpriseFileExplorerProps> = ({
  userEmail: _userEmail,
  onOpenUpload,
  onOpenShare
}) => {
  // Navigation & View State
  const [viewMode, setViewMode] = useState<'tree' | 'grid' | 'list'>('tree');
  const [currentPath, setCurrentPath] = useState<string[]>(['tenant001', 'company001', 'workspace001', 'user001']);
  const [_searchQuery, _setSearchQuery] = useState('');

  // Selected Item Inspector State
  const [selectedFileItem, setSelectedFileItem] = useState<VaultFile | null>(null);

  // Folder Management State
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set(['tenant001', 'company001', 'workspace001', 'user001']));
  const [_isCreatingFolder, _setIsCreatingFolder] = useState(false);
  const [_newFolderName, _setNewFolderName] = useState('');
  const [_editingFolderId, _setEditingFolderId] = useState<string | null>(null);
  const [_renamedFolderName, _setRenamedFolderName] = useState('');

  // Main Files Collection from Vault DB
  const [files, setFiles] = useState<VaultFile[]>([]);

  // Statistics Modal
  const [_showStatsModal, setShowStatsModal] = useState(false);

  // Load Vault Files & Subscribe to Sync Worker
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

  // Toggle Folder Expansion in Tree View
  const toggleFolderExpand = (folderPath: string) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderPath)) {
        next.delete(folderPath);
      } else {
        next.add(folderPath);
      }
      return next;
    });
  };

  // Helper to Category Icon
  const getCategoryIcon = (category: string) => {
    switch (category?.toLowerCase()) {
      case 'documents': return <FileText className="w-4 h-4 text-blue-400" />;
      case 'images': return <Image className="w-4 h-4 text-emerald-400" />;
      case 'videos': return <Film className="w-4 h-4 text-purple-400" />;
      case 'audio': return <Music className="w-4 h-4 text-[#F5C027]" />;
      case 'archives': return <Archive className="w-4 h-4 text-orange-400" />;
      case 'sourcecode': return <Code className="w-4 h-4 text-pink-400" />;
      case 'spreadsheets': return <Table className="w-4 h-4 text-emerald-500" />;
      case 'presentations': return <Presentation className="w-4 h-4 text-amber-400" />;
      case 'pdf': return <FileText className="w-4 h-4 text-red-400" />;
      default: return <File className="w-4 h-4 text-slate-400" />;
    }
  };

  // Delete / Trash File
  const handleDeleteFile = (id: string) => {
    LocalVaultDb.removeFile(id);
    setFiles(prev => prev.filter(f => f.id !== id));
    if (selectedFileItem?.id === id) setSelectedFileItem(null);
  };

  const categoriesList: EnterpriseFileType[] = ['Documents', 'Images', 'Videos', 'PDF', 'Spreadsheets', 'Presentations', 'Archives', 'SourceCode', 'Audio', 'Others'];

  return (
    <div className="space-y-6 text-white font-sans selection:bg-[#F5C027] selection:text-slate-950">
      
      {/* ── TOP HEADER & ACTIONS BAR ─────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <Database className="w-6 h-6 text-[#F5C027]" /> Enterprise Hierarchical File Explorer
          </h1>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Tenant & Company Hierarchy • Automatic MIME Categorization • Backblaze B2 Object Keys
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Statistics Button */}
          <button
            onClick={() => setShowStatsModal(true)}
            className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1.5 text-xs font-bold font-mono"
          >
            <BarChart2 className="w-4 h-4 text-[#F5C027]" /> Stats
          </button>

          {/* View Mode Selectors */}
          <div className="flex bg-[#070B14] p-1 rounded-xl border border-white/10">
            <button
              onClick={() => setViewMode('tree')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'tree' ? 'bg-[#F5C027] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Tree View"
            >
              <Folder className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-[#F5C027] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Grid View"
            >
              <Grid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-1.5 rounded-lg transition ${viewMode === 'list' ? 'bg-[#F5C027] text-slate-950 font-bold' : 'text-slate-400 hover:text-white'}`}
              title="List View"
            >
              <List className="w-4 h-4" />
            </button>
          </div>

          {/* Upload Button */}
          <button onClick={onOpenUpload} className="btn-gold !h-9 !px-4 !text-xs shadow-lg">
            <FolderPlus className="w-4 h-4" /> Enterprise Upload
          </button>
        </div>
      </div>

      {/* ── BREADCRUMB NAVIGATION BAR ───────────────────────────────────────── */}
      <div className="flex items-center gap-2 bg-[#0E1524] p-3 rounded-2xl border border-white/10 text-xs font-mono overflow-x-auto">
        <span className="text-[#F5C027] font-bold">Root</span>
        {currentPath.map((segment, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
            <button
              onClick={() => setCurrentPath(currentPath.slice(0, idx + 1))}
              className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-white font-semibold transition shrink-0"
            >
              {segment}
            </button>
          </React.Fragment>
        ))}
      </div>

      {/* ── MAIN CONTENT AREA (TREE / EXPLORER GRID + INSPECTOR) ───────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* EXPLORER VIEW (8 COLS) */}
        <div className="lg:col-span-8 space-y-4">
          
          {/* TREE VIEW MODE */}
          {viewMode === 'tree' && (
            <div className="glass-card p-5 rounded-3xl space-y-3 border border-white/10">
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <h3 className="text-xs font-bold text-[#F5C027] uppercase tracking-wider font-mono flex items-center gap-2">
                  <Folder className="w-4 h-4" /> Multi-Tenant Storage Tree Standard
                </h3>
                <span className="text-[10px] font-mono text-slate-400">
                  {files.length} Total Objects
                </span>
              </div>

              {/* Hierarchy Tree Node: Tenant Root */}
              <div className="space-y-2 font-mono text-xs">
                <div
                  onClick={() => toggleFolderExpand('tenant001')}
                  className="flex items-center gap-2 p-2 rounded-xl bg-[#070B14] border border-white/5 cursor-pointer hover:bg-white/5 transition"
                >
                  {expandedFolders.has('tenant001') ? <ChevronDown className="w-4 h-4 text-[#F5C027]" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  <Folder className="w-4 h-4 text-[#F5C027]" />
                  <span className="font-bold text-white">tenant001</span>
                  <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Tenant Root</span>
                </div>

                {expandedFolders.has('tenant001') && (
                  <div className="pl-6 space-y-2 border-l border-white/10 ml-4">
                    <div
                      onClick={() => toggleFolderExpand('company001')}
                      className="flex items-center gap-2 p-2 rounded-xl bg-[#070B14] border border-white/5 cursor-pointer hover:bg-white/5 transition"
                    >
                      {expandedFolders.has('company001') ? <ChevronDown className="w-4 h-4 text-[#F5C027]" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                      <Folder className="w-4 h-4 text-[#F5C027]" />
                      <span className="font-bold text-white">company001</span>
                      <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Company</span>
                    </div>

                    {expandedFolders.has('company001') && (
                      <div className="pl-6 space-y-2 border-l border-white/10 ml-4">
                        <div
                          onClick={() => toggleFolderExpand('workspace001')}
                          className="flex items-center gap-2 p-2 rounded-xl bg-[#070B14] border border-white/5 cursor-pointer hover:bg-white/5 transition"
                        >
                          {expandedFolders.has('workspace001') ? <ChevronDown className="w-4 h-4 text-[#F5C027]" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                          <Folder className="w-4 h-4 text-[#F5C027]" />
                          <span className="font-bold text-white">workspace001</span>
                          <span className="text-[10px] text-slate-500 bg-white/5 px-2 py-0.5 rounded-full">Workspace Scope</span>
                        </div>

                        {expandedFolders.has('workspace001') && (
                          <div className="pl-6 space-y-2 border-l border-white/10 ml-4">
                            {/* Category Subfolders */}
                            {categoriesList.map(cat => {
                              const categoryFiles = files.filter(f => {
                                const fileCat = (f.metadata?.folder_path || '').includes(cat) || StoragePathBuilder.classifyFileType(f.type, f.name) === cat;
                                return fileCat;
                              });

                              return (
                                <div key={cat} className="space-y-1">
                                  <div
                                    onClick={() => toggleFolderExpand(cat)}
                                    className="flex items-center justify-between p-2 rounded-xl bg-[#0E1524] border border-white/5 cursor-pointer hover:border-[#F5C027]/40 transition"
                                  >
                                    <div className="flex items-center gap-2">
                                      {expandedFolders.has(cat) ? <ChevronDown className="w-3.5 h-3.5 text-[#F5C027]" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-500" />}
                                      {getCategoryIcon(cat)}
                                      <span className="font-bold text-slate-200">{cat}</span>
                                    </div>
                                    <span className="text-[10px] text-slate-400 bg-white/5 px-2 py-0.5 rounded-full font-bold">
                                      {categoryFiles.length} files
                                    </span>
                                  </div>

                                  {/* Render Files inside Category */}
                                  {expandedFolders.has(cat) && (
                                    <div className="pl-6 space-y-1 border-l border-white/10 ml-3">
                                      {categoryFiles.length === 0 ? (
                                        <div className="text-[11px] text-slate-500 py-1 font-mono italic">No files in folder</div>
                                      ) : (
                                        categoryFiles.map(file => (
                                          <div
                                            key={file.id}
                                            onClick={() => setSelectedFileItem(file)}
                                            className={`p-2.5 rounded-xl border flex items-center justify-between cursor-pointer transition ${
                                              selectedFileItem?.id === file.id
                                                ? 'bg-[#F5C027]/15 border-[#F5C027] text-white shadow-md'
                                                : 'bg-[#070B14] border-white/5 text-slate-300 hover:bg-white/5'
                                            }`}
                                          >
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                              {getCategoryIcon(file.category || '')}
                                              <span className="truncate max-w-[200px] font-bold text-xs">{file.name}</span>
                                              {file.b2Synced && (
                                                <span className="text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded font-mono border border-emerald-500/20">
                                                  ✔ B2
                                                </span>
                                              )}
                                            </div>

                                            <div className="flex items-center gap-2">
                                              <span className="text-[10px] text-slate-500">{file.size}</span>
                                              <button
                                                onClick={(e) => {
                                                  e.stopPropagation();
                                                  onOpenShare(file);
                                                }}
                                                className="p-1 text-slate-400 hover:text-[#F5C027] transition"
                                                title="Share Link"
                                              >
                                                <Share2 className="w-3.5 h-3.5" />
                                              </button>
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
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* GRID VIEW MODE */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {files.map(file => (
                <div
                  key={file.id}
                  onClick={() => setSelectedFileItem(file)}
                  className={`glass-card p-4 rounded-2xl border space-y-3 cursor-pointer transition ${
                    selectedFileItem?.id === file.id ? 'border-[#F5C027] bg-[#F5C027]/10' : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="p-2 rounded-xl bg-white/5 border border-white/10">
                      {getCategoryIcon(file.category || '')}
                    </div>
                    {file.b2Synced && (
                      <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono border border-emerald-500/20">
                        ✔ Backblaze B2
                      </span>
                    )}
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-white truncate">{file.name}</h4>
                    <p className="text-[10px] text-slate-400 font-mono mt-0.5">{file.size} • {file.updatedAt}</p>
                  </div>

                  <div className="pt-2 border-t border-white/5 flex items-center justify-between">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onOpenShare(file);
                      }}
                      className="text-xs text-[#F5C027] hover:underline font-semibold flex items-center gap-1"
                    >
                      <Share2 className="w-3.5 h-3.5" /> Share Access
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file.id);
                      }}
                      className="text-slate-500 hover:text-red-400 transition"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* LIST VIEW MODE */}
          {viewMode === 'list' && (
            <div className="glass-card p-4 rounded-3xl border border-white/10 overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs font-mono min-w-[600px]">
                <thead>
                  <tr className="border-b border-white/10 text-slate-400 uppercase text-[10px]">
                    <th className="py-2.5 px-3">File Name</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Size</th>
                    <th className="py-2.5 px-3">Storage Provider</th>
                    <th className="py-2.5 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {files.map(file => (
                    <tr
                      key={file.id}
                      onClick={() => setSelectedFileItem(file)}
                      className={`cursor-pointer transition hover:bg-white/[0.02] ${selectedFileItem?.id === file.id ? 'bg-[#F5C027]/10 font-bold' : ''}`}
                    >
                      <td className="py-3 px-3 flex items-center gap-2 text-white">
                        {getCategoryIcon(file.category || '')}
                        <span className="truncate max-w-[200px]">{file.name}</span>
                      </td>
                      <td className="py-3 px-3 text-slate-300">{file.category || 'Documents'}</td>
                      <td className="py-3 px-3 text-slate-400">{file.size}</td>
                      <td className="py-3 px-3">
                        <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {file.b2Synced ? 'Backblaze B2' : 'Local Storage'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenShare(file);
                            }}
                            className="p-1.5 text-slate-300 hover:text-[#F5C027] transition"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteFile(file.id);
                            }}
                            className="p-1.5 text-slate-500 hover:text-red-400 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

        {/* ── RIGHT COLUMN (4 COLS): FILE METADATA & B2 URL INSPECTOR ───────── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="glass-card p-5 rounded-3xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-xs font-bold text-[#F5C027] uppercase tracking-wider font-mono flex items-center gap-1.5">
                <Info className="w-4 h-4" /> Enterprise Metadata Inspector
              </h3>
            </div>

            {selectedFileItem ? (
              <div className="space-y-4 text-xs font-mono">
                {/* File Title */}
                <div>
                  <div className="font-bold text-white text-sm break-all">{selectedFileItem.name}</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">{selectedFileItem.size} • {selectedFileItem.type}</div>
                </div>

                {/* Direct B2 Final URL */}
                {selectedFileItem.b2FinalUrl && (
                  <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/30 space-y-2">
                    <div className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                      <ShieldCheck className="w-3.5 h-3.5" /> Backblaze B2 Direct URL
                    </div>
                    <div className="bg-[#070B14] p-2 rounded-xl border border-white/10 text-[10px] text-slate-300 break-all select-all">
                      {selectedFileItem.b2FinalUrl}
                    </div>
                    <a
                      href={selectedFileItem.b2FinalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-gold w-full !h-8 !text-xs font-bold flex items-center justify-center gap-1"
                    >
                      <ExternalLink className="w-3.5 h-3.5" /> Open B2 Direct Object
                    </a>
                  </div>
                )}

                {/* Metadata Fields List */}
                <div className="p-3 rounded-2xl bg-[#070B14] border border-white/10 space-y-2 text-[11px] text-slate-300">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Tenant ID:</span>
                    <span className="text-white font-bold">{selectedFileItem.metadata?.tenant_id || 'tenant001'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Company ID:</span>
                    <span className="text-white font-bold">{selectedFileItem.metadata?.company_id || 'company001'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Workspace:</span>
                    <span className="text-white font-bold">{selectedFileItem.metadata?.workspace_id || 'workspace001'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">User ID:</span>
                    <span className="text-white font-bold">{selectedFileItem.metadata?.user_id || 'user001'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Storage Provider:</span>
                    <span className="text-emerald-400 font-bold">{selectedFileItem.metadata?.storage_provider || 'Backblaze B2'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Bucket Name:</span>
                    <span className="text-amber-300 font-bold">{selectedFileItem.metadata?.bucket_name || 'sathus-memomes-vault'}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-slate-500">Version:</span>
                    <span className="text-white font-bold">v{selectedFileItem.metadata?.version || 1}.0</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Encryption:</span>
                    <span className="text-emerald-400 font-bold">{selectedFileItem.metadata?.encryption_status || 'AES-256'}</span>
                  </div>
                </div>

                {/* Hierarchical Object Key Display */}
                <div className="p-3 rounded-2xl bg-[#070B14] border border-white/10 space-y-1">
                  <div className="text-[10px] text-[#F5C027] font-bold">Object Key Path:</div>
                  <div className="text-[10px] text-slate-400 break-all">
                    {selectedFileItem.b2Path || selectedFileItem.metadata?.object_key || 'tenant001/company001/workspace001/user001/...'}
                  </div>
                </div>

              </div>
            ) : (
              <div className="py-12 text-center text-slate-500 text-xs font-mono space-y-2">
                <Database className="w-8 h-8 mx-auto text-slate-600" />
                <div>Select any file from the tree explorer to inspect its enterprise metadata & Backblaze B2 URL</div>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
};
