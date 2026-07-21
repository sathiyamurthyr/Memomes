import React, { useState } from 'react';
import {
  Search, Grid, List, MoreVertical, Eye, Share2, ShieldCheck,
  Plus, ChevronRight, Image as ImageIcon, Video, FileText, Music, Archive, FileCode
} from 'lucide-react';
import { FilePreviewRenderer } from '../components/FilePreviewRenderer';
import type { FileItem } from '../components/DashboardV2';

interface MyFilesPageProps {
  files: FileItem[];
  onOpenViewer: (file: FileItem) => void;
  onOpenShareModal: (file: FileItem) => void;
  onOpenControlCenter: (file: FileItem) => void;
  onContextMenu: (e: React.MouseEvent, file: FileItem) => void;
}

export const MyFilesPage: React.FC<MyFilesPageProps> = ({
  files,
  onOpenViewer,
  onOpenShareModal,
  onOpenControlCenter,
  onContextMenu
}) => {
  const [currentFolder, setCurrentFolder] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');
  const [activeFilter, setActiveFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Standard Folders
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

  // Filtered files by folder, chip filter, and search
  const filteredFiles = nonVaultFiles.filter(f => {
    if (currentFolder) {
      if (currentFolder === 'Photos') return f.contentTypeEncrypted.startsWith('image/');
      if (currentFolder === 'Videos') return f.contentTypeEncrypted.startsWith('video/');
      if (currentFolder === 'Documents') return f.contentTypeEncrypted.includes('pdf');
      if (currentFolder === 'Audio') return f.contentTypeEncrypted.startsWith('audio/');
      if (currentFolder === 'Archives') return f.contentTypeEncrypted.includes('zip');
      if (currentFolder === 'Office Files') return f.fileNameEncrypted.endsWith('.docx') || f.fileNameEncrypted.endsWith('.xlsx');
    }
    if (activeFilter === 'photos') return f.contentTypeEncrypted.startsWith('image/');
    if (activeFilter === 'videos') return f.contentTypeEncrypted.startsWith('video/');
    if (activeFilter === 'documents') return f.contentTypeEncrypted.includes('pdf');
    if (activeFilter === 'archives') return f.contentTypeEncrypted.includes('zip');
    if (searchQuery.trim()) {
      return f.fileNameEncrypted.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  const sortedFiles = [...filteredFiles].sort((a, b) => {
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });

  return (
    <div className="space-y-6">
      {/* Page Header & Breadcrumb within My Files */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2 text-xs font-mono text-gray-400 mb-1">
            <button onClick={() => setCurrentFolder(null)} className="hover:text-white transition">My Files</button>
            {currentFolder && (
              <>
                <ChevronRight className="w-3.5 h-3.5 text-gray-600" />
                <span className="text-accent-gold font-bold">{currentFolder}</span>
              </>
            )}
          </div>
          <h2 className="text-lg font-extrabold text-white">
            {currentFolder ? `${currentFolder} Folder` : 'My Files Explorer'}
          </h2>
        </div>

        <button
          onClick={() => alert('Create New Folder prompt.')}
          className="px-4 py-2 bg-surface hover:bg-surface-card border border-stroke-default text-gray-200 hover:text-white text-xs font-bold rounded-xl transition flex items-center gap-1.5"
        >
          <Plus className="w-4 h-4 text-accent-gold" /> New Folder
        </button>
      </div>

      {/* System Folders Hierarchy Grid (Visible on Root) */}
      {!currentFolder && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {systemFolders.map((folder, i) => {
            const Icon = folder.icon;
            return (
              <div
                key={i}
                onClick={() => setCurrentFolder(folder.name)}
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

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 justify-between items-center bg-surface p-2.5 rounded-2xl border border-stroke-default">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search files by name in My Files..."
            className="w-full bg-surface-container border border-stroke-default rounded-xl pl-10 pr-4 py-1.5 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto overflow-x-auto">
          {['all', 'photos', 'videos', 'documents', 'archives'].map(chip => (
            <button
              key={chip}
              onClick={() => setActiveFilter(chip)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-xl capitalize whitespace-nowrap transition ${
                activeFilter === chip
                  ? 'bg-primary text-white border border-red-500/40'
                  : 'bg-surface-container text-gray-400 hover:text-white border border-stroke-default'
              }`}
            >
              {chip}
            </button>
          ))}

          <div className="flex items-center bg-surface-container p-1 rounded-xl border border-stroke-default shrink-0 ml-2">
            <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-lg transition ${viewMode === 'grid' ? 'bg-surface-card text-accent-gold' : 'text-gray-400'}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode('table')} className={`p-1.5 rounded-lg transition ${viewMode === 'table' ? 'bg-surface-card text-accent-gold' : 'text-gray-400'}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* File Explorer Display */}
      {viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {sortedFiles.map(file => (
            <div
              key={file.id}
              onContextMenu={(e) => onContextMenu(e, file)}
              className="glass-card rounded-xl p-4 border border-stroke-default flex flex-col justify-between group hover:border-primary/60 transition relative"
            >
              <div>
                <div className="relative">
                  <FilePreviewRenderer
                    fileId={file.id}
                    fileName={file.fileNameEncrypted}
                    contentType={file.contentTypeEncrypted}
                    thumbnailUrl={file.thumbnailUrl}
                    sizeBytes={file.sizeBytes}
                    onOpen={() => onOpenViewer(file)}
                  />
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

              {/* 3 Prominent Actions */}
              <div className="mt-4 pt-3 border-t border-stroke-default space-y-2">
                <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                  <button onClick={() => onOpenViewer(file)} className="py-1.5 bg-surface hover:bg-surface-card border border-stroke-default rounded-lg text-gray-200 hover:text-white transition flex items-center justify-center gap-1">
                    <Eye className="w-3.5 h-3.5 text-accent-gold" /> View
                  </button>
                  <button onClick={() => onOpenShareModal(file)} className="py-1.5 bg-primary/20 hover:bg-primary/40 border border-primary/40 rounded-lg text-accent-gold transition flex items-center justify-center gap-1">
                    <Share2 className="w-3.5 h-3.5 text-accent-gold" /> Share
                  </button>
                  <button onClick={() => onOpenControlCenter(file)} className="py-1.5 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/40 rounded-lg text-amber-300 transition flex items-center justify-center gap-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-accent-gold" /> Control
                  </button>
                </div>
                <div className="flex justify-end pt-1">
                  <button onClick={(e) => onContextMenu(e, file)} className="p-1 text-gray-400 hover:text-white flex items-center gap-1 text-[11px]">
                    <MoreVertical className="w-3.5 h-3.5" /> <span className="text-[10px]">More</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="glass-card rounded-2xl border border-stroke-default overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-surface-container/90 border-b border-stroke-default text-gray-400 font-mono">
              <tr>
                <th className="p-3.5">Name</th>
                <th className="p-3.5">Type</th>
                <th className="p-3.5">Size</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5 text-right">Primary Actions</th>
                <th className="p-3.5 text-right">More</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stroke-default">
              {sortedFiles.map(file => (
                <tr key={file.id} onContextMenu={(e) => onContextMenu(e, file)} className="hover:bg-surface-card transition">
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
                      <button onClick={() => onOpenViewer(file)} className="px-2 py-1 bg-surface hover:bg-surface-card text-gray-300 border border-stroke-default rounded text-[11px]">View</button>
                      <button onClick={() => onOpenShareModal(file)} className="px-2 py-1 bg-primary/20 text-accent-gold hover:bg-primary/40 border border-primary/30 rounded text-[11px]">Share</button>
                      <button onClick={() => onOpenControlCenter(file)} className="px-2 py-1 bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border border-amber-500/30 rounded text-[11px]">Control</button>
                    </div>
                  </td>
                  <td className="p-3.5 text-right">
                    <button onClick={(e) => onContextMenu(e, file)} className="p-1 text-gray-400 hover:text-white"><MoreVertical className="w-4 h-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
