import React, { useState } from 'react';
import { HardDrive, Lock, Search, Share2, Flame, CheckCircle2, Sparkles } from 'lucide-react';

export const HowItWorksSection: React.FC<{ onOpenAuth: () => void }> = () => {
  const [activeStep, setActiveStep] = useState(0);

  const steps = [
    {
      step: '01',
      title: 'Upload Any File',
      desc: 'Drag and drop documents, PDFs, photos, audio, or video files into your zero-knowledge vault.',
      icon: HardDrive,
      detail: 'Files are processed in browser RAM without saving unencrypted temporary files.'
    },
    {
      step: '02',
      title: 'Local Client Encryption',
      desc: 'AES-256-GCM encrypts file bytes locally on your hardware before uploading to Backblaze.',
      icon: Lock,
      detail: 'Master key derived using PBKDF2 with 100,000+ iterations.'
    },
    {
      step: '03',
      title: 'AI Semantic Indexing',
      desc: 'Privacy-preserving vector indexing allows instant natural language search across encrypted files.',
      icon: Search,
      detail: 'Extract text from scanned PDFs and photos using local OCR.'
    },
    {
      step: '04',
      title: 'Share Secure Links',
      desc: 'Generate end-to-end encrypted share links with custom PIN access and timed expiration dates.',
      icon: Share2,
      detail: 'Set single-use burn-on-read links for ultra-sensitive files.'
    },
    {
      step: '05',
      title: 'Maintain Remote Ownership',
      desc: 'Revoke access at any moment. Instantly destroy RAM keys and kill share links globally.',
      icon: Flame,
      detail: 'Remote kill switch gives you total sovereignty over shared data.'
    }
  ];

  return (
    <section id="how-it-works" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>Simple 5-Step Process</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          How Memomes Cloud Works
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          From intake to remote revocation, your data remains 100% under your control.
        </p>
      </div>

      {/* Timeline Stepper Container */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 relative">
        {steps.map((st, idx) => {
          const Icon = st.icon;
          const isActive = activeStep === idx;
          return (
            <div
              key={st.step}
              onClick={() => setActiveStep(idx)}
              className={`p-6 rounded-3xl border transition-all cursor-pointer flex flex-col justify-between space-y-6 ${
                isActive
                  ? 'bg-gradient-to-b from-amber-500/20 to-amber-600/10 border-amber-500/50 shadow-[0_0_30px_rgba(245,183,0,0.2)]'
                  : 'bg-[#0F172A]/80 border-white/10 hover:border-white/20'
              }`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black font-mono text-[#F5B700]">{st.step}</span>
                  <div className={`p-2.5 rounded-xl ${isActive ? 'bg-[#F5B700] text-slate-950' : 'bg-white/5 text-slate-400'}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white font-heading">{st.title}</h3>
                  <p className="text-xs text-slate-300 leading-relaxed mt-2 font-sans">{st.desc}</p>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 text-[11px] font-mono text-slate-400 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{st.detail}</span>
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
