import React from 'react';
import { ShieldCheck, Smartphone, KeyRound, Lock, Clock, CheckCircle } from 'lucide-react';

export const SecurityPanelV2: React.FC = () => {
  return (
    <div className="glass-card rounded-2xl p-6 border border-stroke-default flex flex-col justify-between">
      <div>
        {/* Security Score Meter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            <h3 className="font-bold text-gray-100 text-sm">Security & Enclave Score</h3>
          </div>
          <div className="flex items-center space-x-1.5 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">
            <span className="text-sm font-extrabold text-emerald-400">98 / 100</span>
            <span className="text-[10px] text-emerald-300 font-bold">EXCELLENT</span>
          </div>
        </div>

        {/* Extended Security Attributes Grid */}
        <div className="space-y-2 text-xs text-gray-300">
          <div className="flex justify-between p-2.5 bg-surface rounded-xl border border-stroke-default">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-accent-gold" /> Zero-Knowledge Engine
            </span>
            <span className="font-mono text-accent-gold font-bold">AES-256-GCM (12B IV)</span>
          </div>

          <div className="flex justify-between p-2.5 bg-surface rounded-xl border border-stroke-default">
            <span className="text-gray-400 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-emerald-400" /> Social Recovery Status
            </span>
            <span className="font-mono text-emerald-400 font-semibold flex items-center gap-1">
              <CheckCircle className="w-3 h-3" /> Shamir 3-of-2 Ready
            </span>
          </div>

          <div className="flex justify-between p-2.5 bg-surface rounded-xl border border-stroke-default">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Smartphone className="w-3.5 h-3.5 text-accent-blue" /> Active Devices
            </span>
            <span className="font-mono text-white">1 Device Connected</span>
          </div>

          <div className="flex justify-between p-2.5 bg-surface rounded-xl border border-stroke-default">
            <span className="text-gray-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-purple-400" /> Last Encrypted Backup
            </span>
            <span className="font-mono text-gray-300">Today, 18:42 IST</span>
          </div>
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-stroke-default flex items-center justify-between text-[11px]">
        <span className="text-gray-400">Vault Lock Status:</span>
        <span className="text-emerald-400 font-bold flex items-center gap-1">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" /> Armed & Protected
        </span>
      </div>
    </div>
  );
};
