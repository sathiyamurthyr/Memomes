import React, { useState } from 'react';
import { Monitor, Laptop, Tablet, Smartphone, ShieldCheck, Folder, FileText, Sparkles } from 'lucide-react';

export const InteractiveScreenshotsSection: React.FC = () => {
  const [deviceMode, setDeviceMode] = useState<'desktop' | 'laptop' | 'tablet' | 'mobile'>('desktop');

  const devices = [
    { id: 'desktop', label: 'Desktop 1920px', icon: Monitor, width: 'max-w-6xl' },
    { id: 'laptop', label: 'Laptop 1440px', icon: Laptop, width: 'max-w-4xl' },
    { id: 'tablet', label: 'Tablet 1024px', icon: Tablet, width: 'max-w-2xl' },
    { id: 'mobile', label: 'Mobile 390px', icon: Smartphone, width: 'max-w-xs' }
  ];

  return (
    <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-mono font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-purple-400" />
          <span>Cross-Platform Design & Responsiveness</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          Seamless Experience Across All Devices
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Test layout responsiveness across Desktop, Laptop, Tablet, and Mobile viewports.
        </p>
      </div>

      {/* Device Selector Buttons */}
      <div className="flex items-center justify-center gap-2 mb-10 overflow-x-auto scrollbar-none pb-2">
        {devices.map(d => {
          const Icon = d.icon;
          const isActive = deviceMode === d.id;
          return (
            <button
              key={d.id}
              onClick={() => setDeviceMode(d.id as any)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all cursor-pointer ${
                isActive
                  ? 'bg-[#F5B700] text-slate-950 shadow-lg scale-105'
                  : 'bg-[#0F172A] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{d.label}</span>
            </button>
          );
        })}
      </div>

      {/* Interactive Device Screen Showcase Container */}
      <div className="flex items-center justify-center">
        <div className={`w-full ${devices.find(d => d.id === deviceMode)?.width} transition-all duration-500`}>
          <div className="rounded-3xl bg-[#030712] border border-white/15 p-4 md:p-6 shadow-[0_25px_60px_rgba(0,0,0,0.9)] space-y-4">
            
            {/* Screen Top Bar */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
                <span className="text-[11px] font-mono text-slate-400 ml-2">https://memomes.cloud/vault</span>
              </div>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">
                ● 256-Bit Encrypted
              </span>
            </div>

            {/* Screen Content Mock */}
            <div className="p-6 rounded-2xl bg-[#0B0F19] border border-white/10 space-y-4 min-h-[300px]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#F5B700]">
                    <Folder className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white font-mono">Personal Vault Storage</h4>
                    <p className="text-[11px] text-slate-400">Zero-Knowledge Encrypted Repository</p>
                  </div>
                </div>
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 text-xs font-mono text-cyan-400">
                  5.8 GB Used
                </div>
              </div>

              {/* Sample Mock File Items */}
              <div className="space-y-2">
                {[
                  { name: 'Passport_Scan_Official.pdf', size: '1.8 MB', date: 'Today', status: 'Encrypted' },
                  { name: 'Tax_Return_Form_1040.pdf', size: '2.4 MB', date: 'Yesterday', status: 'Encrypted' },
                  { name: 'Financial_Report_Q3.xlsx', size: '4.2 MB', date: 'Aug 4', status: 'Encrypted' }
                ].map((item, i) => (
                  <div key={i} className="p-3 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <FileText className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="text-slate-200 font-bold truncate">{item.name}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
                      <span>{item.size}</span>
                      <span className="text-emerald-400 font-bold flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> AES-256
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

    </section>
  );
};
