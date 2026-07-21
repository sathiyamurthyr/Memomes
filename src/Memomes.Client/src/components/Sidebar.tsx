import React from 'react';
import {
  LayoutDashboard, Folder, Shield, Lock, Users, Share2, Star,
  Clock, Trash2, Activity, Sparkles, Wifi, Settings, HelpCircle, ChevronLeft, ChevronRight
} from 'lucide-react';

interface SidebarProps {
  activeSection: string;
  onSelectSection: (section: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSelectSection,
  isCollapsed,
  onToggleCollapse
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'my-files', label: 'My Files', icon: Folder },
    { id: 'secure-shares', label: 'Secure Shares', icon: Shield },
    { id: 'digital-vault', label: 'Digital Vault', icon: Lock, badge: 'Zero-K' },
    { id: 'shared-with-me', label: 'Shared With Me', icon: Users },
    { id: 'shared-by-me', label: 'Shared By Me', icon: Share2 },
    { id: 'favorites', label: 'Favorites', icon: Star },
    { id: 'recent', label: 'Recent', icon: Clock },
    { id: 'trash', label: 'Trash', icon: Trash2 },
    { id: 'activity', label: 'Activity Log', icon: Activity },
    { id: 'ai-search', label: 'AI Search', icon: Sparkles },
    { id: 'nearby-share', label: 'Nearby Share', icon: Wifi },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 bottom-0 z-30 bg-surface-container/95 backdrop-blur-xl border-r border-stroke-default transition-all duration-300 flex flex-col justify-between ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      <div>
        {/* Brand Header */}
        <div className="h-16 px-4 flex items-center justify-between border-b border-stroke-default">
          {!isCollapsed && (
            <div className="flex items-center space-x-2.5">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-primary to-accent-gold p-0.5 shadow-md">
                <div className="w-full h-full bg-surface-container rounded-[10px] flex items-center justify-center">
                  <Lock className="w-4 h-4 text-accent-gold" />
                </div>
              </div>
              <span className="font-extrabold text-white text-sm tracking-wide">Memomes</span>
            </div>
          )}

          <button
            onClick={onToggleCollapse}
            className="p-1.5 rounded-lg bg-surface hover:bg-surface-card border border-stroke-default text-gray-400 hover:text-white mx-auto"
            title={isCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>
        </div>

        {/* Navigation Items */}
        <div className="p-3 space-y-1 overflow-y-auto max-h-[calc(100vh-140px)]">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onSelectSection(item.id)}
                className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-xs font-medium transition ${
                  isActive
                    ? 'bg-primary/20 text-accent-gold border border-primary/40 shadow-sm'
                    : 'text-gray-400 hover:text-white hover:bg-surface-card'
                } ${isCollapsed ? 'justify-center px-0' : ''}`}
                title={isCollapsed ? item.label : undefined}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-accent-gold' : ''}`} />
                {!isCollapsed && (
                  <div className="flex-1 flex justify-between items-center text-left">
                    <span>{item.label}</span>
                    {item.badge && (
                      <span className="text-[9px] font-extrabold bg-amber-500/20 text-accent-gold px-1.5 py-0.5 rounded-full border border-amber-500/30">
                        {item.badge}
                      </span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Footer Settings */}
      <div className="p-3 border-t border-stroke-default space-y-1">
        <button
          onClick={() => onSelectSection('settings')}
          className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-surface-card rounded-xl ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <Settings className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Settings</span>}
        </button>
        <button
          onClick={() => onSelectSection('help')}
          className={`w-full flex items-center space-x-3 px-3 py-2 text-xs font-medium text-gray-400 hover:text-white hover:bg-surface-card rounded-xl ${
            isCollapsed ? 'justify-center px-0' : ''
          }`}
        >
          <HelpCircle className="w-4 h-4 shrink-0" />
          {!isCollapsed && <span>Help & Support</span>}
        </button>
      </div>
    </aside>
  );
};
