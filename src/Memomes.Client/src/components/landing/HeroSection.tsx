import React, { useState, useEffect } from 'react';
import {
  ShieldCheck, ArrowRight, Play, Sparkles, Shield,
  CheckCircle2, HardDrive, Search, Share2, Flame
} from 'lucide-react';

interface HeroSectionProps {
  onOpenAuth: () => void;
  onOpenDemoModal: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onOpenAuth,
  onOpenDemoModal
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'search' | 'share' | 'revoke'>('upload');
  const [simulatedProgress, setSimulatedProgress] = useState(78);

  useEffect(() => {
    const interval = setInterval(() => {
      setSimulatedProgress(prev => (prev >= 100 ? 25 : prev + 15));
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative z-10 pt-12 lg:pt-16 pb-20 px-6 max-w-[1920px] w-full mx-auto font-sans">
      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
        
        {/* ── LEFT COLUMN: HEADLINE, SUBHEADING, CTAS & TRUST ──────────────── */}
        <div className="lg:col-span-7 space-y-8 text-left">
          
          {/* Top Pill Badge */}
          <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-gradient-to-r from-amber-500/10 via-amber-400/15 to-blue-500/10 border border-amber-500/30 text-[#F5B700] text-xs font-mono font-bold tracking-wide shadow-[0_0_20px_rgba(245,183,0,0.15)]">
            <Shield className="w-4 h-4 text-[#F5B700] animate-pulse" />
            <span>CLOUD 2.0 — Complete Control Over Every File After Sharing</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.08] font-heading">
            Military-Grade Encryption.<br />
            <span className="bg-gradient-to-r from-[#F5B700] via-amber-400 to-[#3B82F6] bg-clip-text text-transparent drop-shadow-[0_4px_25px_rgba(245,183,0,0.25)]">
              Zero-Knowledge Privacy.
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-base sm:text-lg text-slate-300 max-w-2xl font-normal leading-relaxed">
            The world's most secure cloud storage engine where you control every file—even after sharing.
            Client-side AES-256-GCM encryption, instant AI semantic search, anti-screenshot shields, and remote self-destruct.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <button
              onClick={onOpenAuth}
              className="bg-gradient-to-r from-[#F5B700] via-amber-400 to-amber-500 hover:from-amber-400 hover:to-[#F5B700] text-slate-950 font-bold text-sm px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(245,183,0,0.4)] hover:shadow-[0_0_40px_rgba(245,183,0,0.6)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2.5 font-mono uppercase tracking-wider cursor-pointer"
            >
              <Sparkles className="w-5 h-5 text-slate-950 fill-slate-950" />
              <span>Launch Vault</span>
              <ArrowRight className="w-5 h-5 text-slate-950" />
            </button>

            <button
              onClick={onOpenDemoModal}
              className="px-7 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-amber-400/40 text-slate-200 hover:text-white text-sm font-bold transition-all duration-300 flex items-center justify-center gap-2.5 cursor-pointer backdrop-blur-md hover:scale-[1.02]"
            >
              <Play className="w-4 h-4 text-[#F5B700] fill-[#F5B700]" />
              <span>Watch Interactive Demo</span>
            </button>
          </div>

          {/* Trust Safeguard Badges */}
          <div className="pt-4 border-t border-white/10 grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>No Credit Card</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>5GB Free Forever</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>AES-256-GCM</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Zero-Knowledge</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN: INTERACTIVE LIVE DASHBOARD PREVIEW ──────────────── */}
        <div className="lg:col-span-5 relative">
          
          {/* Glowing Aura Ring Backdrop */}
          <div className="absolute -inset-4 bg-gradient-to-r from-amber-500/20 via-blue-500/20 to-purple-500/20 rounded-[32px] blur-2xl opacity-60 animate-pulse pointer-events-none" />

          {/* Card Container */}
          <div className="relative rounded-3xl bg-[#0F172A]/90 border border-white/15 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] backdrop-blur-2xl space-y-4 font-sans text-xs">
            
            {/* Top Toolbar Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                <span className="text-[11px] font-mono text-slate-400 ml-2">sathus-memomes-vault</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-emerald-400" /> Active
              </span>
            </div>

            {/* Interactive Preview Tabs */}
            <div className="grid grid-cols-4 gap-1.5 p-1 bg-black/40 rounded-xl border border-white/5 font-mono text-[10px]">
              {[
                { id: 'upload', label: 'Upload', icon: HardDrive },
                { id: 'search', label: 'AI Search', icon: Search },
                { id: 'share', label: 'Share', icon: Share2 },
                { id: 'revoke', label: 'Revoke', icon: Flame }
              ].map(tab => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-1.5 rounded-lg flex items-center justify-center gap-1 font-bold transition-all ${
                      isActive
                        ? 'bg-[#F5B700] text-slate-950 shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <Icon className="w-3 h-3" />
                    <span>{tab.label}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab Preview View */}
            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 space-y-3 min-h-[220px]">
              {activeTab === 'upload' && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-slate-300 font-mono">
                    <span className="font-bold flex items-center gap-1.5">
                      <HardDrive className="w-4 h-4 text-[#F5B700]" /> Encrypting Passport_Scan.pdf
                    </span>
                    <span className="text-amber-400 font-bold">{simulatedProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden border border-white/10">
                    <div
                      className="bg-gradient-to-r from-amber-500 to-[#F5B700] h-full transition-all duration-300"
                      style={{ width: `${simulatedProgress}%` }}
                    />
                  </div>
                  <div className="p-3 rounded-xl bg-white/5 border border-white/10 text-[11px] font-mono text-slate-400 space-y-1">
                    <div>Path: sathus/memomes/users/in/wrk_01H.../PDF/</div>
                    <div>Key: <span className="text-emerald-400 font-bold">obj_8d91e7a4f26bc39d.enc</span></div>
                    <div>Encryption: <span className="text-cyan-400 font-bold">AES-256-GCM Zero-Knowledge</span></div>
                  </div>
                </div>
              )}

              {activeTab === 'search' && (
                <div className="space-y-3">
                  <div className="p-2.5 rounded-xl bg-white/5 border border-amber-500/30 flex items-center gap-2 font-mono text-amber-300">
                    <Search className="w-4 h-4 text-[#F5B700]" />
                    <span>Find Form 1040 Tax Return...</span>
                  </div>
                  <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/30 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className="font-bold text-white">Tax_Return_Form_1040_2025.pdf</span>
                    </div>
                    <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded font-bold">98% Match</span>
                  </div>
                </div>
              )}

              {activeTab === 'share' && (
                <div className="space-y-3 font-mono">
                  <div className="text-xs text-white font-bold flex items-center justify-between">
                    <span>Secure Share Link</span>
                    <span className="text-emerald-400 text-[10px] bg-emerald-500/20 px-2 py-0.5 rounded">Active</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-black/60 border border-white/10 text-[11px] text-cyan-300 truncate">
                    https://memomes.cloud/s/sh_01K8F2M9Q4P7
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">Expiry: 24 Hours</div>
                    <div className="p-2 rounded-lg bg-white/5 border border-white/10">Burn: On Read</div>
                  </div>
                </div>
              )}

              {activeTab === 'revoke' && (
                <div className="space-y-3 text-center py-2">
                  <div className="w-10 h-10 rounded-2xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 mx-auto">
                    <Flame className="w-5 h-5" />
                  </div>
                  <div className="text-xs font-bold text-white font-mono">Remote Access Revoked</div>
                  <p className="text-[11px] text-slate-400">
                    All recipient RAM key buffers purged instantly. Presigned S3 URLs invalidated.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Status Footer */}
            <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono pt-1">
              <span className="flex items-center gap-1 text-emerald-400">
                <ShieldCheck className="w-3.5 h-3.5" /> 100% Client-Side Private
              </span>
              <button onClick={onOpenAuth} className="text-[#F5B700] hover:underline font-bold">
                Try Live Vault →
              </button>
            </div>

          </div>
        </div>

      </div>
    </section>
  );
};
