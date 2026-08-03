import React from 'react';
import { 
  LayoutDashboard, 
  FolderKey, 
  Share2, 
  Star, 
  Clock, 
  Sparkles, 
  ShieldAlert, 
  Lock, 
  Trash2, 
  Activity, 
  Settings, 
  Zap,
  HardDrive
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  favoritesCount?: number;
  sharedCount?: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  favoritesCount = 4,
  sharedCount = 12
}) => {
  const mainNavItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'files', label: 'My Files', icon: FolderKey },
    { id: 'share-management', label: 'Share Control Hub', icon: Share2, highlight: true },
    { id: 'shared', label: 'Shared With Me', icon: Share2, badge: sharedCount },
    { id: 'favorites', label: 'Favorites', icon: Star, badge: favoritesCount },
    { id: 'recent', label: 'Recent', icon: Clock },
  ];

  const intelligentNavItems = [
    { id: 'ai-intelligence', label: 'AI Intelligence', icon: Sparkles, highlight: true },
    { id: 'control-center', label: 'Control Center', icon: ShieldAlert, alert: true },
    { id: 'secure-vault', label: 'Secure Vault', icon: Lock },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'recycle-bin', label: 'Recycle Bin', icon: Trash2 },
  ];

  return (
    <aside className="w-64 shrink-0 hidden md:flex flex-col h-[calc(100vh-4rem)] bg-[#0F172A]/70 backdrop-blur-xl border-r border-white/10 p-4 justify-between select-none">
      <div className="space-y-6">
        {/* Main Navigation Section */}
        <div>
          <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Navigation
          </h4>
          <nav className="space-y-1">
            {mainNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F5B700]/20 to-[#F5B700]/5 text-white border border-[#F5B700]/30 shadow-[0_0_15px_rgba(245,183,0,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-[#F5B700]' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge !== undefined && item.badge > 0 && (
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono ${
                      isActive ? 'bg-[#F5B700] text-slate-950 font-bold' : 'bg-slate-800 text-slate-400 border border-white/5'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Security & Intelligence Section */}
        <div>
          <h4 className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2 font-mono">
            Security & Intelligence
          </h4>
          <nav className="space-y-1">
            {intelligentNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => onSelectTab(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-[#F5B700]/20 to-[#F5B700]/5 text-white border border-[#F5B700]/30 shadow-[0_0_15px_rgba(245,183,0,0.1)]'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`w-4 h-4 ${
                      item.highlight ? 'text-[#F5B700] animate-pulse' : isActive ? 'text-[#F5B700]' : 'text-slate-400'
                    }`} />
                    <span>{item.label}</span>
                  </div>
                  {item.highlight && (
                    <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-[#F5B700] border border-amber-500/30 text-[9px] font-bold tracking-wide uppercase">
                      AI 2.0
                    </span>
                  )}
                  {item.alert && (
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_#22C55E]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Bottom Section: Settings & Upgrade Banner */}
      <div className="space-y-3 pt-4 border-t border-white/10">
        <button
          onClick={() => onSelectTab('settings')}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
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
              <span>Memomes Pro</span>
            </div>
            <span className="text-[10px] font-mono text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/20">
              Unlimited
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-tight mb-3">
            Unlock 2TB Vault, custom watermarks & Zero-Knowledge recovery.
          </p>
          <button 
            onClick={() => onSelectTab('upgrade')}
            className="w-full py-1.5 rounded-xl bg-gradient-to-r from-[#F5B700] to-amber-500 text-slate-950 font-bold text-xs hover:brightness-110 transition-all shadow-md flex items-center justify-center gap-1.5"
          >
            <HardDrive className="w-3 h-3" /> Upgrade Storage
          </button>
        </div>
      </div>
    </aside>
  );
};
