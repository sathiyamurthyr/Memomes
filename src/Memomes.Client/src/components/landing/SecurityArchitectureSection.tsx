import React from 'react';
import { Shield, Lock, Server, KeyRound, Flame, ArrowRight, ShieldCheck } from 'lucide-react';

export const SecurityArchitectureSection: React.FC = () => {
  const nodes = [
    { label: 'Client Device', sub: 'Browser RAM Intake', icon: Shield, color: 'border-blue-500/40 text-blue-400 bg-blue-500/10' },
    { label: 'AES-256 Encryption', sub: 'Web Crypto Local API', icon: Lock, color: 'border-amber-500/40 text-amber-400 bg-amber-500/10' },
    { label: 'Backblaze Storage', sub: 'Encrypted .enc Objects', icon: Server, color: 'border-purple-500/40 text-purple-400 bg-purple-500/10' },
    { label: 'Zero Knowledge', sub: '0% Server Keys', icon: KeyRound, color: 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10' },
    { label: 'Owner Sovereignty', sub: 'Instant Remote Kill', icon: Flame, color: 'border-rose-500/40 text-rose-400 bg-rose-500/10' }
  ];

  return (
    <section id="security" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Cryptographic Architecture Standard</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          End-to-End Cryptographic Flow
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Plaintext data exists ONLY in your device RAM during active processing.
        </p>
      </div>

      {/* Interactive Flow Nodes */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 relative">
        {nodes.map((n, i) => {
          const Icon = n.icon;
          return (
            <div key={i} className="flex flex-col items-center">
              <div className={`w-full p-5 rounded-3xl border ${n.color} space-y-3 text-center transition-all duration-300 hover:scale-105 shadow-xl`}>
                <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center mx-auto">
                  <Icon className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-white font-heading">{n.label}</h3>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{n.sub}</p>
                </div>
              </div>

              {i < nodes.length - 1 && (
                <div className="hidden md:flex items-center justify-center my-2 text-slate-500">
                  <ArrowRight className="w-4 h-4 text-amber-500/60 animate-pulse" />
                </div>
              )}
            </div>
          );
        })}
      </div>

    </section>
  );
};
