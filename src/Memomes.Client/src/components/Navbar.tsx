import React, { useState } from 'react';
import { 
  Search, 
  Upload, 
  Bell, 
  ShieldCheck, 
  User, 
  Sparkles, 
  HardDrive, 
  Lock, 
  LogOut, 
  ChevronDown,
  Command
} from 'lucide-react';
import { MemomesLogo } from './MemomesLogo';

interface NavbarProps {
  userEmail?: string;
  onOpenUpload: () => void;
  onOpenAISearch: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail = 'user@memomes.com',
  onOpenUpload,
  onOpenAISearch,
  onLogout,
  onNavigateTab
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#070B14]/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 flex items-center justify-between transition-all">
      {/* Brand Logo & Security Badge */}
      <div className="flex items-center gap-4">
        <div className="cursor-pointer flex items-center gap-2" onClick={() => onNavigateTab('dashboard')}>
          <MemomesLogo size="md" showText={true} />
        </div>
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Zero-Knowledge Active</span>
        </div>
      </div>

      {/* Global AI Search Field */}
      <div className="flex-1 max-w-xl mx-4 hidden md:block">
        <div 
          onClick={onOpenAISearch}
          className="relative flex items-center w-full h-10 px-3.5 rounded-xl bg-[#0F172A]/80 border border-white/10 hover:border-[#F5B700]/50 transition-all cursor-pointer group shadow-inner"
        >
          <Search className="w-4 h-4 text-slate-400 group-hover:text-[#F5B700] transition-colors mr-2.5" />
          <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors flex-1 truncate">
            Search files, extract insights, find passport or tax PDFs...
          </span>
          <div className="flex items-center gap-1.5 ml-2">
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-amber-500/10 text-[#F5B700] border border-amber-500/20 font-semibold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> AI Powered
            </span>
            <kbd className="hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-800 text-[10px] font-mono text-slate-400 border border-white/10">
              <Command className="w-2.5 h-2.5" /> K
            </kbd>
          </div>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2.5 md:gap-3">
        {/* Storage Bar Indicator */}
        <div 
          onClick={() => onNavigateTab('settings')}
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F172A]/90 border border-white/10 text-xs cursor-pointer hover:border-amber-500/30 transition-all"
        >
          <HardDrive className="w-3.5 h-3.5 text-[#F5B700]" />
          <div className="flex flex-col">
            <div className="flex justify-between items-center gap-3 text-[11px]">
              <span className="text-slate-300 font-medium">153 GB / 500 GB</span>
              <span className="text-amber-400 font-bold">30%</span>
            </div>
            <div className="w-24 h-1 rounded-full bg-slate-800 overflow-hidden mt-0.5">
              <div className="h-full bg-gradient-to-r from-amber-500 to-[#F5B700] w-[30%]" />
            </div>
          </div>
        </div>

        {/* Quick Upload CTA */}
        <button
          onClick={onOpenUpload}
          className="btn-gold !h-9 !px-3.5 !text-xs"
        >
          <Upload className="w-3.5 h-3.5" />
          <span className="hidden sm:inline font-bold">Upload</span>
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl bg-[#0F172A] border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all relative"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#F5B700] animate-pulse" />
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0F172A] border border-white/10 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider">Security Alerts</h4>
                <span className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded-full font-mono">2 New</span>
              </div>
              <div className="space-y-2.5 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex gap-2.5">
                  <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">Link Access Logged</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Guest viewed "Tax_Returns_2025.pdf" (Watermark Active)</p>
                    <span className="text-[10px] text-slate-500">2 mins ago</span>
                  </div>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 flex gap-2.5">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-slate-200 font-medium">Download Block Enforced</p>
                    <p className="text-slate-400 text-[11px] mt-0.5">Blocked external download attempt on shared file.</p>
                    <span className="text-[10px] text-slate-500">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0F172A] border border-white/10 hover:border-amber-500/30 transition-all text-slate-200"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-[#F5B700] text-slate-950 font-bold text-xs flex items-center justify-center shadow-md">
              {userEmail.substring(0, 2).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-[#0F172A] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in">
              <div className="px-3 py-2 border-b border-white/10 mb-1">
                <p className="text-xs font-semibold text-white truncate">{userEmail}</p>
                <p className="text-[11px] text-amber-400 flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3" /> Pro Enterprise Plan
                </p>
              </div>
              <button 
                onClick={() => { setShowProfileMenu(false); onNavigateTab('settings'); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <User className="w-3.5 h-3.5 text-slate-400" /> Account Settings
              </button>
              <button 
                onClick={() => { setShowProfileMenu(false); onNavigateTab('control-center'); }}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
              >
                <Lock className="w-3.5 h-3.5 text-[#F5B700]" /> Security Control Center
              </button>
              <button 
                onClick={onLogout}
                className="w-full text-left px-3 py-2 rounded-xl text-xs text-red-400 hover:bg-red-500/10 transition-colors flex items-center gap-2 mt-1 border-t border-white/5 pt-2"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
