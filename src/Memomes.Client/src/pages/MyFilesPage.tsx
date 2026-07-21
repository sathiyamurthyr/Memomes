import React, { useState, useEffect } from 'react';
import {
  Folder, Search, Grid, List, MoreVertical, Eye, Share2, ShieldCheck,
  ChevronRight, Image as ImageIcon, Video, FileText, Music, Archive, FileCode,
  Upload, Download, FolderInput, CheckSquare, Square, X, FolderPlus
} from 'lucide-react';
import { FilePreviewRenderer } from '../components/FilePreviewRenderer';
import { FileDetailsPanel } from '../components/FileDetailsPanel';
import type { FileItem } from '../components/DashboardV2';

interface MyFilesPageProps {
  files: FileItem[];
  onUploadClick: () => void;
  onOpenViewer: (file: FileItem) => void;
  onOpenShareModal: (file: FileItem) => void;
  onOpenControlCenter: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
}

export const MyFilesPage: React.FC<MyFilesPageProps> = ({
  files,
  onUploadClick,
  onOpenViewer,
  onOpenShareModal,
  onOpenControlCenter,
  onContextMenu
}) => {
  // Navigation & Folder Breadcrumb State
  const [folderPath, setFolderPath] = useState<string[]>([]);
  const currentFolder = folderPath.length > 0 ? folderPath[folderPath.length - 1] : null;

  // View & Filter States
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'name-asc' | 'name-desc' | 'largest' | 'smallest' | 'recently-shared'>('newest');

  // Multi-Select & Selection State
  const [selectedFileIds, setSelectedFileIds] = useState<string[]>([]);
  const [inspectedFile, setInspectedFile] = useState<FileItem | null>(null);

  // Drag-and-Drop Overlay State
  const [isDraggingOver, setIsDraggingOver] = useState(false);

  // Keyboard Shortcuts Listener (Ctrl+A, ESC, Delete, Ctrl+V)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault();
        setSelectedFileIds(files.map(f => f.id));
      } else if (e.key === 'Escape') {
        setSelectedFileIds([]);
        setInspectedFile(null);
      } else if (e.key === 'Delete' && selectedFileIds.length > 0) {
        alert(`Soft deleted ${selectedFileIds.length} files to Vault Trash.`);
        setSelectedFileIds([]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [files, selectedFileIds]);

  // System Categories Folders
  const systemFolders = [
    { name: 'Photos', icon: ImageIcon, count: files.filter(f => f.contentTypeEncrypted.startsWith('image/')).length, color: 'text-accent-gold' },
    { name: 'Videos', icon: Video, count: files.filter(f => f.contentTypeEncrypted.startsWith('video/')).length, color: 'text-primary' },
    { name: 'Documents', icon: FileText, count: files.filter(f => f.contentTypeEncrypted.includes('pdf')).length, color: 'text-accent-blue' },
    { name: 'Audio', icon: Music, count: files.filter(f => f.contentTypeEncrypted.startsWith('audio/')).length, color: 'text-purple-400' },
    { name: 'Archives', icon: Archive, count: files.filter(f => f.contentTypeEncrypted.includes('zip')).length, color: 'text-accent-green' },
    { name: 'Office Files', icon: FileCode, count: files.filter(f => f.fileNameEncrypted.endsWith('.docx') || f.fileNameEncrypted.endsWith('.xlsx')).length, color: 'text-amber-400' },
  ];

  // Filter out Vault-only files
  const nonVaultFiles = files.filter(f => !f.tags?.includes('VaultOnly'));

  // Filter & Search Logic
  const filteredFiles = nonVaultFiles.filter(f => {
    if (currentFolder) {
      if (currentFolder === 'Photos') return f.contentTypeEncrypted.startsWith('image/');
      if (currentFolder === 'Videos') return f.contentTypeEncrypted.startsWith('video/');
      if (currentFolder === 'Documents') return f.contentTypeEncrypted.includes('pdf');
      if (currentFolder === 'Audio') return f.contentTypeEncrypted.startsWith('audio/');
      if (currentFolder === 'Archives') return f.contentTypeEncrypted.includes('zip');
      if (currentFolder === 'Office Files') return f.fileNameEncrypted.endsWith('.docx') || f.fileNameEncrypted.endsWith('.xlsx');
    }

    if (typeFilter === 'photos') return f.contentTypeEncrypted.startsWith('image/');
    if (typeFilter === 'videos') return f.contentTypeEncrypted.startsWith('video/');
    if (typeFilter === 'documents') return f.contentTypeEncrypted.includes('pdf');
    if (typeFilter === 'archives') return f.contentTypeEncrypted.includes('zip');

    if (searchQuery.trim()) {
      return f.fileNameEncrypted.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  // Sorting Logic
  const sortedFiles = [...filteredFiles].sort((a, b) => {
    if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    if (sortBy === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    if (sortBy === 'name-asc') return a.fileNameEncrypted.localeCompare(b.fileNameEncrypted);
    if (sortBy === 'name-desc') return b.fileNameEncrypted.localeCompare(a.fileNameEncrypted);
    if (sortBy === 'largest') return b.sizeBytes - a.sizeBytes;
    if (sortBy === 'smallest') return a.sizeBytes - b.sizeBytes;
    if (sortBy === 'recently-shared') return (b.activeSharesCount || 0) - (a.activeSharesCount || 0);
    return 0;
  });

  const toggleSelectFile = (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (e.ctrlKey || e.metaKey || e.shiftKey) {
      setSelectedFileIds(prev =>
        prev.includes(fileId) ? prev.filter(id => id !== fileId) : [...prev, fileId]
      );
    } else {
      // Single selection toggles details inspector
      const file = files.find(f => f.id === fileId);
      if (file) setInspectedFile(file);
    }
  };

  const handleSelectAll = () => {
    if (selectedFileIds.length === sortedFiles.length) {
      setSelectedFileIds([]);
    } else {
      setSelectedFileIds(sortedFiles.map(f => f.id));
    }
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDraggingOver(true); }}
      onDragLeave={() => setIsDraggingOver(false)}
      onDrop={(e) => { e.preventDefault(); setIsDraggingOver(false); onUploadClick(); }}
      className="space-y-6 relative"
    >
      {/* Drag-and-Drop Full Screen Glass Overlay */}
      {isDraggingOver && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center border-4 border-dashed border-accent-gold m-4 rounded-3xl animate-in fade-in duration-200">
          <div className="w-20 h-20 rounded-full bg-primary/20 border-2 border-accent-gold flex items-center justify-center animate-bounce mb-4">
            <Upload className="w-10 h-10 text-accent-gold" />
          </div>
          <h2 className="text-2xl font-extrabold text-white">Drop files to encrypt & upload</h2>
          <p className="text-sm text-gray-400 mt-1 font-mono">Zero-Knowledge client encryption pipeline will start automatically</p>
        </div>
      )}

      {/* Header with Primary CTA [ Upload File ] & Secondary [ New Folder ] */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          {/* Breadcrumb Trail */}
          <nav aria-label="Breadcrumb" className="flex items-center space-x-1.5 text-xs font-mono text-gray-400 mb-1">
            <button onClick={() => setFolderPath([])} className="hover:text-white transition">My Files</button>
            {folderPath.map((folder, index) => (
              <React.Fragment key={index}>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                <button
                  onClick={() => setFolderPath(folderPath.slice(0, index + 1))}
                  className="text-accent-gold font-bold hover:underline"
                >
                  {folder}
                </button>
              </React.Fragment>
            ))}
          </nav>
          <h2 className="text-xl font-extrabold text-white">
            {currentFolder ? `${currentFolder} Folder` : 'My Files Explorer'}
          </h2>
        </div>

        {/* Primary CTA: Upload File | Secondary CTA: New Folder */}
        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={onUploadClick}
            className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl transition flex items-center gap-2 shadow-lg hover:shadow-red-950/50"
          >
            <Upload className="w-4 h-4 text-accent-gold" /> Upload File
          </button>
          <button
            onClick={() => {
              const name = prompt('Enter new folder name:');
              if (name) setFolderPath(prev => [...prev, name]);
            }}
            className="px-4 py-2.5 bg-surface hover:bg-surface-card border border-stroke-default text-gray-200 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
          >
            <FolderPlus className="w-4 h-4 text-accent-gold" /> New Folder
          </button>
        </div>
      </div>

      {/* Category Cards (Clicking opens dedicated subfolders) */}
      {!currentFolder && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {systemFolders.map((folder, i) => {
            const Icon = folder.icon;
            return (
              <div
                key={i}
                onClick={() => setFolderPath([folder.name])}
                className="glass-card rounded-xl p-3.5 border border-stroke-default hover:border-accent-gold/40 transition cursor-pointer group"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="w-8 h-8 rounded-lg bg-surface flex items-center justify-center border border-stroke-default group-hover:scale-110 transition">
                    <Icon className={`w-4 h-4 ${folder.color}`} />
                  </div>
                  <span className="text-[10px] font-mono text-gray-400 bg-surface px-2 py-0.5 rounded-full border border-stroke-default">
                    {folder.count} items
                  </span>
                </div>
                <div className="font-bold text-xs text-gray-200 group-hover:text-white">{folder.name}</div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sorting Dropdown & Advanced Filters Toolbar */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-center bg-surface p-3 rounded-2xl border border-stroke-default">
        {/* Search Bar */}
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name in My Files..."
            className="w-full bg-surface-container border border-stroke-default rounded-xl pl-10 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold font-mono"
          />
        </div>

        {/* Filter Chips & Sorting Dropdown */}
        <div className="flex items-center gap-2 w-full lg:w-auto overflow-x-auto">
          {/* Type Chips */}
          {['all', 'photos', 'videos', 'documents', 'archives'].map(chip => (
            <button
              key={chip}
              onClick={() => setTypeFilter(chip)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize whitespace-nowrap transition ${
                typeFilter === chip
                  ? 'bg-primary text-white border border-red-500/40'
                  : 'bg-surface-container text-gray-400 hover:text-white border border-stroke-default'
              }`}
            >
              {chip}
            </button>
          ))}

          {/* Sorting Dropdown */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-surface-container border border-stroke-default rounded-xl px-3 py-1.5 text-xs text-accent-gold font-mono focus:outline-none focus:border-accent-gold shrink-0"
          >
            <option value="newest">Sort: Newest First</option>
            <option value="oldest">Sort: Oldest First</option>
            <option value="name-asc">Sort: Name A-Z</option>
            <option value="name-desc">Sort: Name Z-A</option>
            <option value="largest">Sort: Size (Largest)</option>
            <option value="smallest">Sort: Size (Smallest)</option>
            <option value="recently-shared">Sort: Most Shared</option>
          </select>

          {/* Grid vs Table Toggle */}
          <div className="flex items-center bg-surface-container p-1 rounded-xl border border-stroke-default shrink-0">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-surface-card text-accent-gold' : 'text-gray-400'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-surface-card text-accent-gold' : 'text-gray-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Floating Multi-Select Bulk Action Toolbar */}
      {selectedFileIds.length > 0 && (
        <div className="sticky top-20 z-30 p-3 bg-surface-container/95 backdrop-blur-xl border border-accent-gold/50 rounded-2xl shadow-2xl flex items-center justify-between animate-in slide-in-from-top duration-200">
          <div className="flex items-center space-x-3 text-xs">
            <button onClick={handleSelectAll} className="p-1 text-accent-gold">
              <CheckSquare className="w-4 h-4" />
            </button>
            <span className="font-bold text-white font-mono">
              {selectedFileIds.length} file{selectedFileIds.length > 1 ? 's' : ''} selected
            </span>
          </div>

          <div className="flex items-center space-x-2 text-xs font-bold">
            <button onClick={() => alert(`Bulk move ${selectedFileIds.length} files.`)} className="px-3 py-1.5 bg-surface hover:bg-surface-card border border-stroke-default rounded-lg text-gray-200 flex items-center gap-1">
              <FolderInput className="w-3.5 h-3.5 text-accent-gold" /> Move
            </button>
            <button onClick={() => alert(`Bulk share link created for ${selectedFileIds.length} files.`)} className="px-3 py-1.5 bg-primary/20 text-accent-gold border border-primary/30 rounded-lg flex items-center gap-1">
              <Share2 className="w-3.5 h-3.5" /> Share
            </button>
            <button onClick={() => alert(`Bulk control policies applied.`)} className="px-3 py-1.5 bg-amber-500/10 text-amber-300 border border-amber-500/30 rounded-lg flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> Control
            </button>
            <button onClick={() => alert(`Downloading zip payload...`)} className="px-3 py-1.5 bg-surface hover:bg-surface-card border border-stroke-default rounded-lg text-gray-200 flex items-center gap-1">
              <Download className="w-3.5 h-3.5 text-emerald-400" /> Download
            </button>
            <button onClick={() => { setSelectedFileIds([]); setInspectedFile(null); }} className="p-1.5 text-gray-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Main Body Layout: File Grid + Single-Click Details Inspector Side Panel */}
      <div className="flex gap-6 items-start">
        <div className="flex-1">
          {/* Empty State Component */}
          {sortedFiles.length === 0 ? (
            <div className="glass-card rounded-2xl p-16 border border-stroke-default text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-surface-card border border-stroke-default flex items-center justify-center mx-auto text-gray-500">
                <Folder className="w-8 h-8" />
              </div>
              <div>
                <h3 className="font-extrabold text-white text-base">No files here</h3>
                <p className="text-xs text-gray-400 mt-1">Upload your first encrypted file to get started.</p>
              </div>
              <button
                onClick={onUploadClick}
                className="px-6 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition inline-flex items-center gap-2"
              >
                <Upload className="w-4 h-4 text-accent-gold" /> Upload File
              </button>
            </div>
          ) : viewMode === 'grid' ? (
            /* File Cards Grid with View | Share | Control Buttons */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {sortedFiles.map(file => {
                const isSelected = selectedFileIds.includes(file.id);
                return (
                  <div
                    key={file.id}
                    onClick={(e) => toggleSelectFile(file.id, e)}
                    onContextMenu={(e) => onContextMenu(e, file)}
                    className={`glass-card rounded-xl p-4 border transition relative flex flex-col justify-between group cursor-pointer ${
                      isSelected
                        ? 'border-accent-gold bg-amber-500/5 shadow-lg'
                        : 'border-stroke-default hover:border-primary/60'
                    }`}
                  >
                    <div>
                      {/* Thumbnail Container */}
                      <div className="relative">
                        <FilePreviewRenderer
                          fileId={file.id}
                          fileName={file.fileNameEncrypted}
                          contentType={file.contentTypeEncrypted}
                          thumbnailUrl={file.thumbnailUrl}
                          sizeBytes={file.sizeBytes}
                          onOpen={() => onOpenViewer(file)}
                        />

                        {/* Multi-select checkbox */}
                        <div className="absolute top-2 right-2 z-10">
                          <button onClick={(e) => toggleSelectFile(file.id, e)} className="p-0.5 rounded bg-black/60 backdrop-blur-sm">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-accent-gold" /> : <Square className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition" />}
                          </button>
                        </div>

                        {/* Shared Badge */}
                        {file.activeSharesCount !== undefined && file.activeSharesCount > 0 && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 bg-black/80 backdrop-blur-md border border-accent-gold/50 rounded-full text-[10px] font-bold text-accent-gold flex items-center gap-1">
                            <Share2 className="w-3 h-3 text-accent-gold" /> Shared ({file.activeSharesCount})
                          </div>
                        )}
                      </div>

                      <div className="mt-3 font-semibold text-gray-100 text-xs truncate" title={file.fileNameEncrypted}>
                        {file.fileNameEncrypted}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-gray-400 font-mono mt-1">
                        <span>{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
                        <span>{new Date(file.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Preserve 3 Direct Action Buttons: View | Share | Control */}
                    <div className="mt-4 pt-3 border-t border-stroke-default space-y-2">
                      <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenViewer(file); }}
                          className="py-1.5 bg-surface hover:bg-surface-card border border-stroke-default rounded-lg text-gray-200 hover:text-white transition flex items-center justify-center gap-1"
                        >
                          <Eye className="w-3.5 h-3.5 text-accent-gold" /> View
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenShareModal(file); }}
                          className="py-1.5 bg-primary/20 hover:bg-primary/40 border border-primary/40 rounded-lg text-accent-gold transition flex items-center justify-center gap-1"
                        >
                          <Share2 className="w-3.5 h-3.5 text-accent-gold" /> Share
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); onOpenControlCenter(file); }}
                          className="py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 transition flex items-center justify-center gap-1"
                        >
                          <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" /> Control
                        </button>
                      </div>
                      <div className="flex justify-end pt-1">
                        <button onClick={(e) => { e.stopPropagation(); onContextMenu(e, file); }} className="p-1 text-gray-400 hover:text-white flex items-center gap-1 text-[11px]">
                          <MoreVertical className="w-3.5 h-3.5" /> <span className="text-[10px]">More</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Table View */
            <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
              <table className="w-full text-left text-xs">
                <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
                  <tr>
                    <th className="p-3.5 w-8">
                      <button onClick={handleSelectAll} className="p-0.5">
                        {selectedFileIds.length === sortedFiles.length ? <CheckSquare className="w-4 h-4 text-accent-gold" /> : <Square className="w-4 h-4 text-gray-400" />}
                      </button>
                    </th>
                    <th className="p-3.5">Name</th>
                    <th className="p-3.5">Type</th>
                    <th className="p-3.5">Size</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Primary Actions</th>
                    <th className="p-3.5 text-right">More</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stroke-default">
                  {sortedFiles.map(file => {
                    const isSelected = selectedFileIds.includes(file.id);
                    return (
                      <tr
                        key={file.id}
                        onClick={(e) => toggleSelectFile(file.id, e)}
                        onContextMenu={(e) => onContextMenu(e, file)}
                        className={`transition cursor-pointer ${isSelected ? 'bg-amber-500/10' : 'hover:bg-surface-card'}`}
                      >
                        <td className="p-3.5">
                          <button onClick={(e) => toggleSelectFile(file.id, e)} className="p-0.5">
                            {isSelected ? <CheckSquare className="w-4 h-4 text-accent-gold" /> : <Square className="w-4 h-4 text-gray-500" />}
                          </button>
                        </td>
                        <td className="p-3.5 font-semibold text-gray-200">{file.fileNameEncrypted}</td>
                        <td className="p-3.5 text-gray-400 font-mono text-[10px]">{file.contentTypeEncrypted}</td>
                        <td className="p-3.5 text-gray-300 font-mono">{(file.sizeBytes / 1024 / 1024).toFixed(1)} MB</td>
                        <td className="p-3.5">
                          {file.activeSharesCount ? (
                            <span className="px-2 py-0.5 bg-amber-950/60 text-accent-gold border border-amber-500/30 rounded-full text-[10px] font-bold">Shared ({file.activeSharesCount})</span>
                          ) : (
                            <span className="px-2 py-0.5 bg-surface text-gray-400 border border-stroke-default rounded-full text-[10px]">Private</span>
                          )}
                        </td>
                        <td className="p-3.5 text-right">
                          <div className="flex items-center justify-end gap-1 font-bold">
                            <button onClick={(e) => { e.stopPropagation(); onOpenViewer(file); }} className="px-2 py-1 bg-surface hover:bg-surface-card text-gray-300 border border-stroke-default rounded text-[11px]">View</button>
                            <button onClick={(e) => { e.stopPropagation(); onOpenShareModal(file); }} className="px-2 py-1 bg-primary/20 text-accent-gold hover:bg-primary/40 border border-primary/30 rounded text-[11px]">Share</button>
                            <button onClick={(e) => { e.stopPropagation(); onOpenControlCenter(file); }} className="px-2 py-1 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 rounded text-[11px]">Control</button>
                          </div>
                        </td>
                        <td className="p-3.5 text-right">
                          <button onClick={(e) => { e.stopPropagation(); onContextMenu(e, file); }} className="p-1 text-gray-400 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Single-Click File Details Inspector Side Panel */}
        {inspectedFile && (
          <FileDetailsPanel
            file={inspectedFile}
            onClose={() => setInspectedFile(null)}
            onOpenViewer={onOpenViewer}
            onOpenShareModal={onOpenShareModal}
            onOpenControlCenter={onOpenControlCenter}
          />
        )}
      </div>
    </div>
  );
};
