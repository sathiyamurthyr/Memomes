import React, { useState, useEffect } from 'react';
import { Sparkles, Menu, X, ArrowRight } from 'lucide-react';
import { MemomesLogo } from './MemomesLogo';

interface EnterpriseHeaderProps {
  onOpenAuth: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export const EnterpriseHeader: React.FC<EnterpriseHeaderProps> = ({
  onOpenAuth,
  onNavigateSection
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { id: 'features', label: 'Security Architecture' },
    { id: 'comparison', label: 'Zero-Knowledge' },
    { id: 'specs', label: 'Features' },
    { id: 'enterprise', label: 'Enterprise' },
    { id: 'pricing', label: 'Pricing' }
  ];

  const handleNavClick = (id: string) => {
    setMobileMenuOpen(false);
    if (onNavigateSection) {
      onNavigateSection(id);
    } else {
      const el = document.getElementById(id);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header
      className={`sticky top-0 z-50 w-full transition-all duration-300 select-none ${
        scrolled
          ? 'h-[80px] bg-[#030712]/90 backdrop-blur-2xl border-b border-amber-500/20 shadow-[0_10px_30px_rgba(0,0,0,0.8)]'
          : 'h-[80px] bg-[#030712]/80 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_25px_rgba(0,0,0,0.5)]'
      }`}
    >
      <div className="max-w-[1920px] w-full mx-auto px-6 sm:px-8 lg:px-12 h-full flex items-center justify-between font-sans">
        
        {/* ── LEFT: BRAND LOGO + CLOUD 2.0 BADGE ────────────────────────────── */}
        <div className="flex items-center gap-4 shrink-0">
          <div
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-3 cursor-pointer group"
            tabIndex={0}
            aria-label="Memomes Cloud Homepage"
            onKeyDown={(e) => { if (e.key === 'Enter') window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            <MemomesLogo size="md" showText={true} />
            
            {/* CLOUD 2.0 Badge attached to the logo */}
            <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 via-amber-400/10 to-amber-500/20 border border-amber-500/40 text-[#F5B700] text-[10px] font-mono font-extrabold uppercase tracking-wider shadow-[0_0_12px_rgba(245,183,0,0.25)] flex items-center gap-1 shrink-0 group-hover:scale-105 transition-transform duration-300">
              <Sparkles className="w-3 h-3 text-[#F5B700] animate-pulse" />
              <span>CLOUD 2.0</span>
            </div>
          </div>
        </div>

        {/* ── CENTER: NAVIGATION (SPACING 48–64PX, PERFECT VERTICAL ALIGNMENT) ── */}
        <nav
          aria-label="Main Navigation"
          className="hidden md:flex items-center gap-12 lg:gap-14 xl:gap-16 text-xs font-semibold text-slate-300 font-sans"
        >
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => handleNavClick(link.id)}
              className="relative py-2 text-slate-300 hover:text-[#F5B700] transition-colors duration-300 group focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B700] focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-lg px-1 font-medium"
            >
              <span>{link.label}</span>
              {/* Smooth Animated Gold Underline */}
              <span className="absolute bottom-0 left-0 w-0 h-[2px] bg-gradient-to-r from-[#F5B700] to-amber-500 group-hover:w-full transition-all duration-300 rounded-full shadow-[0_0_8px_#F5B700]" />
            </button>
          ))}
        </nav>

        {/* ── RIGHT: CTA BUTTONS (LAUNCH VAULT = PRIMARY, SIGN IN = SECONDARY) ── */}
        <div className="hidden sm:flex items-center gap-3.5 lg:gap-4 shrink-0">
          {/* Secondary CTA: Sign In */}
          <button
            onClick={onOpenAuth}
            className="px-5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 hover:border-amber-400/40 text-slate-200 hover:text-white text-xs font-bold transition-all duration-300 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B700]"
          >
            Sign In
          </button>

          {/* Primary CTA: Launch Vault */}
          <button
            onClick={onOpenAuth}
            className="bg-gradient-to-r from-[#F5B700] via-amber-400 to-amber-500 hover:from-amber-400 hover:to-[#F5B700] text-slate-950 font-bold text-xs px-6 py-2.5 rounded-xl shadow-[0_0_25px_rgba(245,183,0,0.35)] hover:shadow-[0_0_35px_rgba(245,183,0,0.55)] hover:scale-[1.03] active:scale-[0.98] transition-all duration-300 flex items-center gap-2 font-mono uppercase tracking-wider focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B700]"
          >
            <Sparkles className="w-4 h-4 text-slate-950 fill-slate-950" />
            <span>Launch Vault</span>
            <ArrowRight className="w-4 h-4 text-slate-950" />
          </button>
        </div>

        {/* ── MOBILE HAMBURGER BUTTON ────────────────────────────────────────── */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={onOpenAuth}
            className="px-3 py-1.5 rounded-lg bg-gradient-to-r from-[#F5B700] to-amber-500 text-slate-950 font-bold text-xs font-mono"
          >
            Launch
          </button>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-xl bg-white/5 border border-white/10 text-slate-300 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#F5B700]"
            aria-label="Toggle Mobile Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6 text-[#F5B700]" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

      </div>

      {/* ── MOBILE SLIDE-OVER DRAWER OVERLAY ─────────────────────────────────── */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-x-0 top-[80px] bg-[#030712]/95 backdrop-blur-2xl border-b border-amber-500/30 p-6 space-y-6 shadow-2xl animate-in fade-in slide-in-from-top-4 duration-300 font-sans z-50">
          <nav className="flex flex-col gap-4 text-sm font-semibold text-slate-200">
            {navLinks.map((link) => (
              <button
                key={link.id}
                onClick={() => handleNavClick(link.id)}
                className="text-left py-2 px-3 rounded-xl hover:bg-white/5 text-slate-300 hover:text-[#F5B700] transition-all flex items-center justify-between border border-transparent hover:border-white/10"
              >
                <span>{link.label}</span>
                <ArrowRight className="w-4 h-4 text-slate-500" />
              </button>
            ))}
          </nav>

          <div className="pt-4 border-t border-white/10 flex flex-col gap-3">
            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
              className="w-full py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/15 text-slate-200 text-sm font-bold text-center transition"
            >
              Sign In
            </button>

            <button
              onClick={() => { setMobileMenuOpen(false); onOpenAuth(); }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-[#F5B700] to-amber-500 text-slate-950 font-bold text-sm text-center flex items-center justify-center gap-2 shadow-lg font-mono uppercase tracking-wider"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>Launch Vault</span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
