import React from 'react';
import { ShieldAlert, LogOut, X, Laptop, MapPin, Globe, Clock, AlertTriangle } from 'lucide-react';
import type { ActiveSessionRecord } from '../utils/deviceSecurityEngine';

interface ConcurrentSessionConflictModalProps {
  activeSession: ActiveSessionRecord;
  newDeviceName: string;
  newIpLocation: string;
  onForceLogoutExisting: () => void;
  onCancelNewLogin: () => void;
}

export const ConcurrentSessionConflictModal: React.FC<ConcurrentSessionConflictModalProps> = ({
  activeSession,
  newDeviceName,
  newIpLocation,
  onForceLogoutExisting,
  onCancelNewLogin
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans text-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-[#0B1120] border border-amber-500/40 rounded-3xl p-6 space-y-5 shadow-[0_0_50px_rgba(245,183,0,0.15)] text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-[#F5B700] shadow-[0_0_20px_rgba(245,183,0,0.2)]">
              <ShieldAlert className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Active Session Limit Reached</h3>
              <p className="text-[11px] text-amber-400 font-mono font-medium">1 Active Device Allowed (Personal Account)</p>
            </div>
          </div>
          <button onClick={onCancelNewLogin} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Warning Description */}
        <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-slate-200 text-xs leading-relaxed space-y-1">
          <div className="font-bold text-amber-300 flex items-center gap-1.5 font-mono">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" /> Concurrent Login Attempt Detected
          </div>
          <p className="text-slate-300">
            Another device is currently signed in to your Memomes Cloud account. You must choose whether to terminate the existing session or cancel this new login.
          </p>
        </div>

        {/* Active Session Card */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            Currently Active Device
          </span>
          <div className="p-4 rounded-2xl bg-[#050816] border border-white/10 space-y-2.5 font-mono">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-white font-bold">
                <Laptop className="w-4 h-4 text-[#F5B700]" />
                <span>{activeSession.browser} on {activeSession.os}</span>
              </div>
              <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold">
                ACTIVE NOW
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-300 border-t border-white/5 pt-2">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span className="truncate">{activeSession.location}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Globe className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>IP: {activeSession.ip}</span>
              </div>
              <div className="flex items-center gap-1.5 col-span-2">
                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>Logged in: {new Date(activeSession.createdAt).toLocaleTimeString()} ({new Date(activeSession.createdAt).toLocaleDateString()})</span>
              </div>
            </div>
          </div>
        </div>

        {/* New Login Attempt Card */}
        <div className="space-y-2">
          <span className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider block">
            New Incoming Device Attempt
          </span>
          <div className="p-3 rounded-xl bg-white/5 border border-white/10 flex items-center justify-between font-mono text-xs">
            <span className="text-white font-bold">{newDeviceName}</span>
            <span className="text-slate-400 text-[11px]">{newIpLocation}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-3 pt-2 font-mono">
          <button
            onClick={onCancelNewLogin}
            className="py-3 px-4 rounded-2xl bg-white/10 hover:bg-white/20 text-slate-200 font-bold hover:text-white transition flex items-center justify-center gap-2"
          >
            <X className="w-4 h-4" /> Cancel New Login
          </button>
          <button
            onClick={onForceLogoutExisting}
            className="py-3 px-4 rounded-2xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 border border-rose-500/40 font-bold transition flex items-center justify-center gap-2 shadow-lg"
          >
            <LogOut className="w-4 h-4" /> Terminate Active Session
          </button>
        </div>

      </div>
    </div>
  );
};
