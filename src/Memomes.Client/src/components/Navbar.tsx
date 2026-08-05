import React, { useState, useEffect } from 'react';
import { 
  Search, 
  Upload, 
  Bell, 
  ShieldCheck, 
  Sparkles, 
  HardDrive, 
  LogOut, 
  ChevronDown,
  Command,
  ShieldAlert,
  X
} from 'lucide-react';
import { MemomesLogo } from './MemomesLogo';
import { SecurityCenterStore, type SecurityAlert } from '../utils/securityCenterStore';

interface NavbarProps {
  userEmail?: string;
  onOpenUpload: () => void;
  onOpenAISearch: () => void;
  onLogout: () => void;
  onNavigateTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  userEmail = 'sathiya@memomes.com',
  onOpenUpload,
  onOpenAISearch,
  onLogout,
  onNavigateTab
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [activeBanner, setActiveBanner] = useState<SecurityAlert | null>(null);

  const loadAlerts = () => {
    setAlerts(SecurityCenterStore.getSecurityAlerts());
  };

  useEffect(() => {
    loadAlerts();

    // Check offline alerts on fresh login
    const offlineAlerts = SecurityCenterStore.flushOfflineAlertsOnLogin();
    if (offlineAlerts.length > 0) {
      setActiveBanner(offlineAlerts[0]);
    }

    const handleUpdate = () => loadAlerts();
    const handleBanner = (e: Event) => {
      const customEvent = e as CustomEvent<SecurityAlert>;
      if (customEvent.detail) {
        setActiveBanner(customEvent.detail);
        loadAlerts();
      }
    };

    window.addEventListener('memomes_security_center_updated', handleUpdate);
    window.addEventListener('memomes_security_alert_banner', handleBanner);

    return () => {
      window.removeEventListener('memomes_security_center_updated', handleUpdate);
      window.removeEventListener('memomes_security_alert_banner', handleBanner);
    };
  }, []);

  const unreadCount = alerts.filter(a => a.status === 'UNREAD').length;

  return (
    <header className="sticky top-0 z-40 w-full h-16 bg-[#070B14]/90 backdrop-blur-xl border-b border-white/10 px-4 md:px-6 flex items-center justify-between transition-all select-none font-sans">
      {/* Brand Logo & Security Badge */}
      <div className="flex items-center gap-4">
        <div className="cursor-pointer flex items-center gap-2" onClick={() => onNavigateTab('dashboard')}>
          <MemomesLogo size="md" showText={true} />
        </div>
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium font-mono">
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
          <span className="text-sm text-slate-400 group-hover:text-slate-200 transition-colors flex-1 truncate font-mono">
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
          className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0F172A]/90 border border-white/10 text-xs cursor-pointer hover:border-amber-500/30 transition-all font-mono"
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
          className="btn-gold !h-9 !px-3.5 !text-xs font-mono"
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
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 px-1.5 py-0.5 text-[9px] font-bold font-mono rounded-full bg-red-600 text-white border border-slate-950 animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 rounded-2xl bg-[#0F172A] border border-white/10 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 font-sans">
              <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                <h4 className="text-xs font-semibold text-white uppercase tracking-wider font-mono">Security Alerts</h4>
                <span className="text-[10px] text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full font-mono font-bold">
                  {unreadCount > 0 ? `${unreadCount} Critical Alert${unreadCount > 1 ? 's' : ''}` : '0 Unread'}
                </span>
              </div>

              {alerts.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4 font-mono">No security alerts recorded.</p>
              ) : (
                <div className="space-y-2.5 text-xs max-h-72 overflow-y-auto scrollbar-thin">
                  {alerts.map((alt) => (
                    <div
                      key={alt.id}
                      onClick={() => onNavigateTab('security')}
                      className={`p-3 rounded-xl border transition cursor-pointer ${
                        alt.severity === 'HIGH' || alt.type === 'CRITICAL_ALERT'
                          ? 'bg-red-950/30 border-red-500/30 hover:border-red-500/50'
                          : 'bg-slate-900/80 border-white/5 hover:border-white/20'
                      }`}
                    >
                      <div className="flex items-start gap-2.5">
                        <div className={`p-1.5 rounded-lg shrink-0 ${
                          alt.severity === 'HIGH' || alt.type === 'CRITICAL_ALERT' ? 'bg-red-500/10 text-red-400' : 'bg-amber-500/10 text-amber-400'
                        }`}>
                          <ShieldAlert className="w-4 h-4" />
                        </div>
                        <div className="space-y-1">
                          <p className="text-slate-200 font-bold text-xs">{alt.title}</p>
                          <p className="text-slate-300 text-[11px] leading-tight font-mono">{alt.description}</p>
                          <div className="flex items-center gap-2 text-[10px] text-slate-400 font-mono pt-1">
                            <span>📍 {alt.location || 'India'}</span>
                            <span>💻 {alt.device || 'Chrome / Windows'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Profile Dropdown */}
        <div className="relative">
          <button 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 p-1.5 rounded-xl bg-[#0F172A] border border-white/10 hover:border-amber-500/30 transition-all text-slate-200"
          >
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-amber-400 to-[#F5B700] text-slate-950 font-bold text-xs flex items-center justify-center shadow-md font-mono">
              {userEmail.substring(0, 2).toUpperCase()}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-[#0F172A] border border-white/10 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 font-sans">
              <div className="p-2 border-b border-white/10">
                <p className="text-xs font-bold text-white truncate">{userEmail}</p>
                <p className="text-[10px] text-slate-400 font-mono">Vault Storage Owner</p>
              </div>
              <button
                onClick={() => { setShowProfileMenu(false); onNavigateTab('settings'); }}
                className="w-full text-left px-3 py-2 text-xs text-slate-300 hover:text-white hover:bg-white/5 rounded-xl transition flex items-center gap-2"
              >
                Profile & Vault Settings
              </button>
              <button
                onClick={onLogout}
                className="w-full text-left px-3 py-2 text-xs text-red-400 hover:bg-red-500/10 rounded-xl transition flex items-center gap-2 font-bold"
              >
                <LogOut className="w-3.5 h-3.5" /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ── TOP-RIGHT ANIMATED RED ALERT BANNER FOR ONLINE OWNER (Action 10) ──── */}
      {activeBanner && (
        <div className="fixed top-20 right-6 z-50 w-96 rounded-2xl bg-[#0B0F19]/95 backdrop-blur-2xl border border-red-500/50 p-4 shadow-2xl animate-bounce-short shadow-red-500/20 font-sans">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2 text-red-400 font-bold text-xs font-mono uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 animate-pulse" />
              <span>{activeBanner.title}</span>
            </div>
            <button onClick={() => setActiveBanner(null)} className="text-slate-400 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-slate-200 text-xs mt-2 font-mono">{activeBanner.description}</p>
          <div className="mt-2 text-[10px] text-slate-400 font-mono flex items-center gap-3">
            <span>📍 Location: {activeBanner.location || 'India'}</span>
            <span>💻 Device: {activeBanner.device || 'Chrome / Windows'}</span>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 font-mono text-[11px]">
            <button
              onClick={() => { setActiveBanner(null); onNavigateTab('security'); }}
              className="px-3 py-1.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-center"
            >
              View Incident
            </button>
            <button
              onClick={() => {
                if (activeBanner.shareCode) SecurityCenterStore.unlockLink(activeBanner.shareCode);
                setActiveBanner(null);
              }}
              className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 font-bold border border-amber-500/30 text-center"
            >
              Unlock Link
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
