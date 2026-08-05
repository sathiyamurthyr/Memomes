import React from 'react';
import { Check, X, ShieldCheck } from 'lucide-react';

export const ComparisonTableSection: React.FC = () => {
  const comparisonRows = [
    { feature: 'Client-Side Zero-Knowledge Encryption', memomes: true, dropbox: false, gdrive: false, onedrive: false },
    { feature: 'Remote Self-Destruct & Revoke', memomes: true, dropbox: false, gdrive: false, onedrive: false },
    { feature: 'Privacy-Preserving AI Semantic Search', memomes: true, dropbox: false, gdrive: false, onedrive: false },
    { feature: 'Anti-Screenshot & Capture Shield', memomes: true, dropbox: false, gdrive: false, onedrive: false },
    { feature: 'Burn-on-Read One-Time Links', memomes: true, dropbox: false, gdrive: false, onedrive: false },
    { feature: 'Shamir Secret Key Sharding Recovery', memomes: true, dropbox: false, gdrive: false, onedrive: false },
    { feature: 'Granular PIN Access Protection', memomes: true, dropbox: false, gdrive: false, onedrive: false },
    { feature: 'AES-256-GCM Web Crypto Local API', memomes: true, dropbox: false, gdrive: false, onedrive: false }
  ];

  return (
    <section id="comparison" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-mono font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Competitive Matrix</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          Memomes Cloud vs Traditional Cloud Storage
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Traditional storage providers control your plaintext encryption keys on their servers. Memomes operates strictly on Zero-Knowledge architecture.
        </p>
      </div>

      {/* Comparison Table Card */}
      <div className="rounded-3xl bg-[#0F172A] border border-white/15 overflow-hidden shadow-2xl">
        <table className="w-full text-left text-xs border-collapse">
          <thead>
            <tr className="border-b border-white/10 text-slate-400 font-mono bg-[#070B14]">
              <th className="py-4 px-6 text-sm">Security Feature</th>
              <th className="py-4 px-6 text-base text-[#F5B700] font-bold font-mono bg-amber-500/10 border-x border-amber-500/30">
                Memomes Cloud 2.0
              </th>
              <th className="py-4 px-6 text-slate-400 font-bold">Dropbox</th>
              <th className="py-4 px-6 text-slate-400 font-bold">Google Drive</th>
              <th className="py-4 px-6 text-slate-400 font-bold">OneDrive</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 text-slate-300">
            {comparisonRows.map((row, idx) => (
              <tr key={idx} className="hover:bg-white/[0.02] transition">
                <td className="py-4 px-6 font-bold text-white text-xs">{row.feature}</td>
                
                <td className="py-4 px-6 bg-amber-500/5 border-x border-amber-500/30 text-emerald-400 font-bold font-mono">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-bold">
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span>YES (Supported)</span>
                  </div>
                </td>

                <td className="py-4 px-6 text-rose-400 font-mono">
                  <div className="flex items-center gap-1 text-rose-400">
                    <X className="w-4 h-4 text-rose-500" />
                    <span>NO</span>
                  </div>
                </td>

                <td className="py-4 px-6 text-rose-400 font-mono">
                  <div className="flex items-center gap-1 text-rose-400">
                    <X className="w-4 h-4 text-rose-500" />
                    <span>NO</span>
                  </div>
                </td>

                <td className="py-4 px-6 text-rose-400 font-mono">
                  <div className="flex items-center gap-1 text-rose-400">
                    <X className="w-4 h-4 text-rose-500" />
                    <span>NO</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

    </section>
  );
};
