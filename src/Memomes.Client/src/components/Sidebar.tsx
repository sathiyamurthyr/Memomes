import React, { useState } from 'react';
import { 
  LayoutDashboard,
  Folder, 
  FileText, 
  Image as IconImage, 
  Video as IconVideo, 
  FileCode as IconCode, 
  Music as IconMusic, 
  Archive as IconArchive, 
  FileSpreadsheet, 
  Presentation, 
  Star, 
  Clock, 
  Share2, 
  Trash2, 
  ChevronDown, 
  ChevronRight, 
  Lock, 
  Sparkles, 
  Settings, 
  Zap, 
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string, categoryFilter?: string) => void;
  favoritesCount?: number;
  sharedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount = 4,
  sharedCount = 12
}) => {
  const [isMyFilesExpanded, setIsMyFilesExpanded] = useState(true);

  const virtualFolders = [
    { id: 'documents', label: 'Documents', icon: FileText, filter: 'Documents' },
    { id: 'images', label: 'Images', icon: IconImage, filter: 'Images' },
    { id: 'videos', label: 'Videos', icon: IconVideo, filter: 'Videos' },
    { id: 'pdf', label: 'PDF', icon: FileText, filter: 'PDF' },
    { id: 'audio', label: 'Audio', icon: IconMusic, filter: 'Audio' },
    { id: 'spreadsheets', label: 'Spreadsheets', icon: FileSpreadsheet, filter: 'Spreadsheets' },
    { id: 'presentations', label: 'Presentations', icon: Presentation, filter: 'Presentations' },
    { id: 'source-code', label: 'Source Code', icon: IconCode, filter: 'SourceCode' },
    { id: 'archives', label: 'Archives', icon: IconArchive, filter: 'Archives' },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col h-[calc(100vh-4rem)] bg-[#0F172A]/70 backdrop-blur-xl border-r border-white/10 p-4 justify-between select-none font-sans text-xs">
      <div className="space-y-6 overflow-y-auto pr-1">
        {/* Virtual File Hierarchy Section */}
        <div>
          <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono flex items-center justify-between">
            <span>Memomes Cloud Vault</span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22C55E]" title="Zero-Knowledge Vault Active" />
          </h4>

          <nav className="space-y-1">
            {/* Dashboard Main Menu */}
            <button
              onClick={() => onSelectTab('dashboard')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition-all ${
                activeTab === 'dashboard'
                  ? 'bg-[#F5B700]/15 text-white border border-[#F5B700]/30 shadow-sm'
                  : 'text-slate-200 hover:bg-white/5'
              }`}
            >
              <LayoutDashboard className="w-4 h-4 text-[#F5B700]" />
              <span>Dashboard</span>
            </button>

            {/* My Files Main Folder Header */}
            <div>
              <button
                onClick={() => {
                  onSelectTab('files');
                  setIsMyFilesExpanded(!isMyFilesExpanded);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-bold transition-all ${
                  activeTab === 'files'
                    ? 'bg-[#F5B700]/15 text-white border border-[#F5B700]/30 shadow-sm'
                    : 'text-slate-200 hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Folder className="w-4 h-4 text-[#F5B700]" />
                  <span>My Files</span>
                </div>
                {isMyFilesExpanded ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
              </button>

              {/* Sub-virtual folders */}
              {isMyFilesExpanded && (
                <div className="pl-4 pr-1 py-1 space-y-0.5 border-l border-white/10 ml-5 mt-1">
                  {virtualFolders.map((sub) => {
                    const SubIcon = sub.icon;
                    const isSubActive = activeTab === `files-${sub.id}`;
                    return (
                      <button
                        key={sub.id}
                        onClick={() => onSelectTab(`files-${sub.id}`, sub.filter)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                          isSubActive
                            ? 'bg-white/10 text-[#F5B700] font-bold'
                            : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                        }`}
                      >
                        <SubIcon className="w-3.5 h-3.5 text-slate-400" />
                        <span>{sub.label}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Favorites */}
            <button
              onClick={() => onSelectTab('favorites')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'favorites'
                  ? 'bg-[#F5B700]/15 text-white border border-[#F5B700]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Star className="w-4 h-4 text-amber-400" />
                <span>Favorites</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400 border border-white/5">
                {favoritesCount}
              </span>
            </button>

            {/* Shared */}
            <button
              onClick={() => onSelectTab('shared')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'shared'
                  ? 'bg-[#F5B700]/15 text-white border border-[#F5B700]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Share2 className="w-4 h-4 text-cyan-400" />
                <span>Shared</span>
              </div>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400 border border-white/5">
                {sharedCount}
              </span>
            </button>

            {/* Recent */}
            <button
              onClick={() => onSelectTab('recent')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'recent'
                  ? 'bg-[#F5B700]/15 text-white border border-[#F5B700]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Clock className="w-4 h-4 text-purple-400" />
              <span>Recent</span>
            </button>

            {/* Recycle Bin */}
            <button
              onClick={() => onSelectTab('recycle-bin')}
              className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium transition-all ${
                activeTab === 'recycle-bin'
                  ? 'bg-[#F5B700]/15 text-white border border-[#F5B700]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              <span>Recycle Bin</span>
            </button>
          </nav>
        </div>

        {/* Security & Intelligence Section */}
        <div>
          <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Intelligence & Control
          </h4>
          <nav className="space-y-1">
            <button
              onClick={() => onSelectTab('ai-intelligence')}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'ai-intelligence'
                  ? 'bg-[#F5B700]/15 text-white border border-[#F5B700]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-[#F5B700] animate-pulse" />
                <span>AI Intelligence</span>
              </div>
              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[#F5B700] border border-amber-500/30 text-[9px] font-bold uppercase">
                AI 2.0
              </span>
            </button>

            <button
              onClick={() => onSelectTab('secure-vault')}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                activeTab === 'secure-vault'
                  ? 'bg-[#F5B700]/15 text-white border border-[#F5B700]/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              }`}
            >
              <Lock className="w-4 h-4 text-emerald-400" />
              <span>Secure Vault</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Bottom Section: Settings & Upgrade Banner */}
      <div className="space-y-3 pt-3 border-t border-white/10 shrink-0">
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all ${
            activeTab === 'settings'
              ? 'bg-[#F5B700]/10 text-white border border-[#F5B700]/30'
              : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
          }`}
        >
          <Settings className="w-4 h-4 text-slate-400" />
          <span>Settings</span>
        </button>

        {/* Upgrade Card Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-amber-500/10 via-[#111827] to-amber-600/5 border border-amber-500/20 relative overflow-hidden group">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-1.5 text-xs font-bold text-white">
              <Zap className="w-3.5 h-3.5 text-[#F5B700]" />
              <span>Memomes Cloud</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              Pro Vault
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mb-3">
            Secure Zero-Knowledge Storage Engine.
          </p>
          <button 
            onClick={() => onSelectTab('upgrade')}
            className="w-full py-1.5 rounded-xl bg-gradient-to-r from-[#F5B700] to-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <HardDrive className="w-3.5 h-3.5" /> Manage Storage
          </button>
        </div>
      </div>
    </aside>
  );
};
