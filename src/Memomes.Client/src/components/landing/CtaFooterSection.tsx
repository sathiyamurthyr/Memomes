import React from 'react';
import { Lock, ArrowRight, Sparkles, Globe, MessageSquare, Share2 } from 'lucide-react';
import { MemomesLogo } from '../MemomesLogo';

export const CtaFooterSection: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  return (
    <div className="relative z-10 font-sans select-none">
      
      {/* ── CONVERSION CTA BANNER ────────────────────────────────────────────── */}
      <section className="py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="rounded-3xl bg-gradient-to-br from-amber-500/20 via-[#0F172A] to-blue-500/20 border border-amber-500/40 p-10 md:p-14 space-y-6 shadow-[0_0_50px_rgba(245,183,0,0.25)] relative overflow-hidden">
          
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-[#F5B700] to-amber-500 text-slate-950 flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-8 h-8" />
          </div>

          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
            Ready To Protect Your Confidential Files?
          </h2>

          <p className="text-sm text-slate-300 max-w-lg mx-auto leading-relaxed">
            Experience absolute Zero-Knowledge privacy with client AES-256 encryption, AI search, and remote revocation.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <button
              onClick={onOpenAuth}
              className="bg-gradient-to-r from-[#F5B700] via-amber-400 to-amber-500 hover:from-amber-400 hover:to-[#F5B700] text-slate-950 font-bold text-sm px-8 py-4 rounded-2xl shadow-[0_0_30px_rgba(245,183,0,0.4)] hover:scale-[1.03] transition-all duration-300 flex items-center justify-center gap-2 font-mono uppercase tracking-wider cursor-pointer w-full sm:w-auto"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Create Free Vault</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>

            <button
              onClick={onOpenAuth}
              className="px-8 py-4 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 hover:text-white text-sm font-bold transition-all duration-300 cursor-pointer w-full sm:w-auto"
            >
              Book Enterprise Demo
            </button>
          </div>

        </div>
      </section>

      {/* ── FOOTER MULTI-COLUMN LINKS ────────────────────────────────────────── */}
      <footer className="border-t border-white/10 bg-[#030712] pt-16 pb-12 text-xs text-slate-400 font-sans">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          
          {/* Brand Col */}
          <div className="col-span-2 space-y-4 text-left">
            <MemomesLogo size="md" showText={true} />
            <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
              Memomes Cloud 2.0 — Military-grade zero-knowledge cloud storage with complete remote sovereignty over every shared file.
            </p>
            <div className="flex items-center gap-2 text-emerald-400 font-mono text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>All Systems Operational (99.99% Uptime)</span>
            </div>
          </div>

          {/* Product Col */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold text-white font-mono uppercase">Product</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><a href="#features" className="hover:text-[#F5B700] transition">Client Encryption</a></li>
              <li><a href="#demo" className="hover:text-[#F5B700] transition">Remote Revoke</a></li>
              <li><a href="#ai-search" className="hover:text-[#F5B700] transition">AI Search 2.0</a></li>
              <li><a href="#use-cases" className="hover:text-[#F5B700] transition">Use Cases</a></li>
              <li><a href="#pricing" className="hover:text-[#F5B700] transition">Pricing Tiers</a></li>
            </ul>
          </div>

          {/* Security Col */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold text-white font-mono uppercase">Security & Tech</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><a href="#security" className="hover:text-[#F5B700] transition">Zero-Knowledge Specs</a></li>
              <li><a href="#security" className="hover:text-[#F5B700] transition">AES-256-GCM</a></li>
              <li><a href="#security" className="hover:text-[#F5B700] transition">Shamir Key Sharding</a></li>
              <li><a href="#comparison" className="hover:text-[#F5B700] transition">Competitor Matrix</a></li>
              <li><a href="#security" className="hover:text-[#F5B700] transition">Compliance Audits</a></li>
            </ul>
          </div>

          {/* Developers & Company */}
          <div className="space-y-3 text-left">
            <h4 className="text-xs font-bold text-white font-mono uppercase">Company</h4>
            <ul className="space-y-2 text-slate-400 text-xs">
              <li><a href="#enterprise" className="hover:text-[#F5B700] transition">Enterprise Support</a></li>
              <li><a href="#faq" className="hover:text-[#F5B700] transition">FAQ Accordion</a></li>
              <li><a href="#" className="hover:text-[#F5B700] transition">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-[#F5B700] transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-[#F5B700] transition">Contact Us</a></li>
            </ul>
          </div>

        </div>

        {/* Bottom Rights Bar */}
        <div className="max-w-7xl mx-auto px-6 border-t border-white/10 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px] text-slate-500">
          <div>© 2026 Memomes Cloud Security Architecture. All rights reserved.</div>
          <div className="flex items-center gap-4">
            <a href="#" className="hover:text-white transition" title="Global Network"><Globe className="w-4 h-4" /></a>
            <a href="#" className="hover:text-white transition" title="Community"><MessageSquare className="w-4 h-4" /></a>
            <a href="#" className="hover:text-white transition" title="Share Network"><Share2 className="w-4 h-4" /></a>
          </div>
        </div>
      </footer>

    </div>
  );
};
