import React from 'react';
import {
  ShieldCheck, Lock, ArrowRight, ShieldAlert, KeyRound, Flame, Eye,
  Sparkles, Check, Shield
} from 'lucide-react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  return (
    <div className="min-h-screen bg-[#080B14] text-[#F8FAFC] flex flex-col font-sans selection:bg-[#3B82F6] selection:text-white relative overflow-hidden">
      
      {/* Background Mesh Orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div style={{
          position: 'absolute', top: '-25%', left: '-15%',
          width: '70vw', height: '70vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.15) 0%, transparent 65%)',
          filter: 'blur(80px)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-20%', right: '-15%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 65%)',
          filter: 'blur(80px)'
        }} />
      </div>

      {/* Navigation Header */}
      <header className="sticky top-0 z-50 bg-[#0B1220]/80 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#3B82F6] to-[#7C3AED] flex items-center justify-center shadow-lg shadow-[#3B82F6]/25">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-xl font-extrabold tracking-tight text-white font-heading">
                memo<span className="bg-gradient-to-r from-[#3B82F6] to-[#7C3AED] bg-clip-text text-transparent">mes</span>
              </span>
              <span className="hidden sm:inline-block ml-2 px-2.5 py-0.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-[10px] font-mono font-bold">
                CLOUD 2.0
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-[#94A3B8]">
            <a href="#features" className="hover:text-white transition">Security Architecture</a>
            <a href="#comparison" className="hover:text-white transition">Comparison</a>
            <a href="#specs" className="hover:text-white transition">Specs</a>
          </nav>

          <div className="flex items-center gap-4">
            <button
              onClick={onOpenAuth}
              className="px-5 py-2.5 rounded-2xl text-xs font-bold text-[#CBD5E1] hover:text-white bg-[#111827] border border-white/[0.06] hover:border-white/[0.12] transition"
            >
              Sign In
            </button>
            <button
              onClick={onOpenAuth}
              className="btn-primary text-xs"
            >
              <Sparkles className="w-4 h-4 text-white" />
              Launch Vault
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 pt-20 pb-24 px-6 max-w-7xl mx-auto text-center space-y-8">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#3B82F6]/10 border border-[#3B82F6]/30 text-[#3B82F6] text-xs font-bold font-mono tracking-wide">
          <Shield className="w-4 h-4 text-[#7C3AED]" />
          An Intelligent Personal Cloud with Complete Control After Sharing
        </div>

        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-white tracking-tight max-w-5xl mx-auto leading-[1.1] font-heading">
          Military-Grade Encryption.<br />
          <span className="bg-gradient-to-r from-[#3B82F6] via-[#7C3AED] to-[#14B8A6] bg-clip-text text-transparent">
            Zero-Knowledge Privacy.
          </span>
        </h1>

        <p className="text-base sm:text-lg text-[#CBD5E1] max-w-2xl mx-auto font-normal leading-relaxed">
          Store, encrypt, and share sensitive media with client-side AES-256-GCM, Shamir Secret Key Sharding, anti-screenshot shields, and self-destructing access links.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <button
            onClick={onOpenAuth}
            className="btn-primary w-full sm:w-auto text-sm px-8"
          >
            <Lock className="w-5 h-5 text-white" />
            Create Free Zero-Knowledge Vault
            <ArrowRight className="w-5 h-5" />
          </button>
          
          <a
            href="#features"
            className="btn-secondary w-full sm:w-auto text-sm px-8"
          >
            <ShieldAlert className="w-4 h-4 text-[#3B82F6]" />
            View Security Specification
          </a>
        </div>

        {/* Live Security Metrics Banner */}
        <div id="specs" className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-4xl mx-auto">
          {[
            { label: 'Encryption Algorithm', val: 'AES-GCM-256', sub: 'Web Crypto API' },
            { label: 'Key Derivation', val: 'PBKDF2-HMAC', sub: '100,000+ Iterations' },
            { label: 'Key Recovery', val: 'Shamir 3-of-2', sub: 'Social Key Splitting' },
            { label: 'Cloud Storage', val: 'MinIO & S3/B2', sub: 'Redundant Backblaze' },
          ].map((stat, i) => (
            <div key={i} className="glass-card p-4 text-left">
              <div className="text-[10px] font-mono text-[#94A3B8] uppercase tracking-wider">{stat.label}</div>
              <div className="text-sm font-extrabold text-white font-mono mt-1">{stat.val}</div>
              <div className="text-[10px] text-[#3B82F6] font-semibold mt-0.5">{stat.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Bento Grid Section */}
      <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
            Built For Absolute Confidentiality
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-xl mx-auto">
            Every file is encrypted on your local hardware before leaving memory. No plaintext data ever touches cloud disks.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="glass-card p-8 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-[#3B82F6]/10 border border-[#3B82F6]/30 flex items-center justify-center text-[#3B82F6] group-hover:scale-110 transition">
              <KeyRound className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white font-heading">Client-Side Zero-Knowledge</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Your master password derives 256-bit cryptographic keys locally in WebAssembly / Web Crypto. Server operators cannot read your files.
            </p>
            <div className="pt-2 text-[11px] font-mono text-[#22C55E] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> PBKDF2 100k Iterations
            </div>
          </div>

          <div className="glass-card p-8 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-[#7C3AED]/10 border border-[#7C3AED]/30 flex items-center justify-center text-[#7C3AED] group-hover:scale-110 transition">
              <Flame className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white font-heading">Self-Destruct & Burn-on-Read</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Set single-view burn links that immediately destroy RAM key buffers and invalidate S3 presigned URLs after initial read.
            </p>
            <div className="pt-2 text-[11px] font-mono text-[#F59E0B] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> 60s / 1h / 24h Timed Expiry
            </div>
          </div>

          <div className="glass-card p-8 space-y-4 group">
            <div className="w-12 h-12 rounded-2xl bg-[#14B8A6]/10 border border-[#14B8A6]/30 flex items-center justify-center text-[#14B8A6] group-hover:scale-110 transition">
              <Eye className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-extrabold text-white font-heading">Anti-Screenshot & Capture Shield</h3>
            <p className="text-xs text-[#94A3B8] leading-relaxed">
              Real-time canvas blocker detects Windows PrtScn key, Snipping tools, F12 DevTools, and window focus loss to conceal decrypted content.
            </p>
            <div className="pt-2 text-[11px] font-mono text-[#3B82F6] flex items-center gap-1.5">
              <Check className="w-3.5 h-3.5" /> Dynamic Clipboard Scrambler
            </div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section id="comparison" className="relative z-10 py-20 px-6 max-w-7xl mx-auto space-y-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
            Memomes Cloud vs Traditional Storage
          </h2>
          <p className="text-sm text-[#94A3B8] max-w-xl mx-auto">
            Traditional cloud services hold your encryption keys on their servers. Memomes operates strictly on Zero-Knowledge architecture.
          </p>
        </div>

        <div className="glass-card overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/[0.06] text-[#94A3B8] font-mono bg-[#0D1320]">
                <th className="py-4 px-6">Security Metric</th>
                <th className="py-4 px-6 text-[#3B82F6] font-extrabold">Memomes Cloud v2.0</th>
                <th className="py-4 px-6 text-[#94A3B8]">Dropbox / Google Drive</th>
                <th className="py-4 px-6 text-[#94A3B8]">Standard S3 Bucket</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.06] text-[#CBD5E1]">
              <tr>
                <td className="py-4 px-6 font-bold text-white">Client-Side Zero-Knowledge Encryption</td>
                <td className="py-4 px-6 text-[#22C55E] font-bold font-mono">✓ AES-256-GCM Local</td>
                <td className="py-4 px-6 text-[#EF4444]">✗ Server-Side Only</td>
                <td className="py-4 px-6 text-[#EF4444]">✗ Plaintext Upload</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-white">Burn-on-Read One-Time Links</td>
                <td className="py-4 px-6 text-[#22C55E] font-bold font-mono">✓ Built-in Memory Purge</td>
                <td className="py-4 px-6 text-[#EF4444]">✗ Not Supported</td>
                <td className="py-4 px-6 text-[#EF4444]">✗ Not Supported</td>
              </tr>
              <tr>
                <td className="py-4 px-6 font-bold text-white">Anti-Screenshot Capture Shield</td>
                <td className="py-4 px-6 text-[#22C55E] font-bold font-mono">✓ PrtScn / Focus-loss Blocker</td>
                <td className="py-4 px-6 text-[#EF4444]">✗ Screen Grabs Allowed</td>
                <td className="py-4 px-6 text-[#EF4444]">✗ Screen Grabs Allowed</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* CTA Footer */}
      <section className="relative z-10 py-20 px-6 max-w-5xl mx-auto text-center">
        <div className="glass-card p-12 space-y-6">
          <div className="w-16 h-16 rounded-2xl bg-[#3B82F6]/20 border border-[#3B82F6]/40 flex items-center justify-center text-[#3B82F6] mx-auto shadow-lg">
            <Lock className="w-8 h-8" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-heading">
            Ready To Protect Your Confidential Files?
          </h2>
          <p className="text-xs sm:text-sm text-[#CBD5E1] max-w-lg mx-auto">
            Experience absolute Zero-Knowledge privacy. No central key server can decrypt your files without your master password.
          </p>
          <button
            onClick={onOpenAuth}
            className="btn-primary text-sm px-8"
          >
            <Sparkles className="w-4 h-4 text-white" />
            Launch Digital Vault Now
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 border-t border-white/[0.06] text-center text-xs text-[#94A3B8] font-mono">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>Memomes Cloud Security Architecture v2.0 · End-to-End Encrypted</div>
          <div className="flex items-center gap-4">
            <span className="text-[#22C55E]">● All Systems Operational</span>
            <span>AES-GCM-256</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
