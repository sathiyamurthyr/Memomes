import React from 'react';
import { ShieldCheck, Lock, Flame, Globe, CheckCircle2, Zap } from 'lucide-react';

export const TrustBarSection: React.FC = () => {
  const trustMetrics = [
    { label: 'Encryption Standard', val: 'AES-256-GCM', sub: 'Web Crypto API', icon: Lock, color: 'text-amber-400' },
    { label: 'Key Derivation', val: 'PBKDF2-HMAC', sub: '100,000+ Iterations', icon: ShieldCheck, color: 'text-emerald-400' },
    { label: 'Access Control', val: 'Remote Revoke', sub: 'Instant Self-Destruct', icon: Flame, color: 'text-rose-400' },
    { label: 'Global Availability', val: '99.99% Uptime', sub: 'Redundant Backblaze CDN', icon: Globe, color: 'text-cyan-400' },
    { label: 'Protected Payloads', val: '100M+ Files', sub: 'Zero Security Breaches', icon: Zap, color: 'text-amber-300' }
  ];

  return (
    <section className="relative z-10 py-10 border-y border-white/10 bg-[#070B14]/80 backdrop-blur-xl select-none font-sans">
      <div className="max-w-7xl mx-auto px-6">
        <div className="text-center mb-6">
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-widest flex items-center justify-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Trusted Enterprise Security & Cryptographic Proof Standards</span>
          </span>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {trustMetrics.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 hover:border-amber-500/30 transition-all duration-300 group hover:scale-[1.02] shadow-inner"
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider">{item.label}</span>
                  <Icon className={`w-4 h-4 ${item.color} group-hover:scale-110 transition-transform`} />
                </div>
                <div className="text-base font-extrabold text-white font-mono">{item.val}</div>
                <div className="text-[10px] text-slate-400 font-mono mt-0.5">{item.sub}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
