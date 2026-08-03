import React from 'react';
import { 
  ShieldCheck, 
  Upload, 
  Share2, 
  Lock, 
  Sparkles, 
  HardDrive 
} from 'lucide-react';

interface WelcomeHeroCardProps {
  userEmail?: string;
  onOpenUpload: () => void;
  onOpenShare: () => void;
  onOpenVault: () => void;
  onOpenAskAI: () => void;
}

export const WelcomeHeroCard: React.FC<WelcomeHeroCardProps> = ({
  userEmail = 'user@memomes.com',
  onOpenUpload,
  onOpenShare,
  onOpenVault,
  onOpenAskAI
}) => {
  const userName = userEmail.split('@')[0];
  const formattedName = userName.charAt(0).toUpperCase() + userName.slice(1);

  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#111827] via-[#0F172A] to-[#1E293B] border border-white/10 p-6 md:p-8 shadow-2xl group">
      {/* Background Decorative Glows */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-[#F5B700]/10 blur-3xl pointer-events-none group-hover:bg-[#F5B700]/20 transition-all duration-700" />
      <div className="absolute -bottom-24 -left-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Left Side: Emotional Greeting & Security Health */}
        <div className="space-y-3 max-w-xl">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5" /> 98% Security Health
            </span>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-[#F5B700] text-xs font-semibold flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Zero-Knowledge Active
            </span>
          </div>

          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
              Welcome Back, {formattedName} 👋
            </h1>
            <p className="text-sm md:text-base text-slate-300 font-normal mt-1 leading-relaxed">
              Your memories and confidential documents are protected with AES-256 encryption. Control your files even after sharing.
            </p>
          </div>

          {/* Storage Snapshot */}
          <div className="pt-2 flex items-center gap-4 text-xs font-mono text-slate-300">
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5">
              <HardDrive className="w-4 h-4 text-[#F5B700]" />
              <span><strong className="text-white font-bold">153 GB</strong> Used</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/80 px-3 py-1.5 rounded-xl border border-white/5">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              <span><strong className="text-white font-bold">347 GB</strong> Available</span>
            </div>
          </div>
        </div>

        {/* Right Side: Quick Action Buttons */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-2 gap-3 shrink-0">
          <button
            onClick={onOpenUpload}
            className="btn-gold !h-11 !px-4 !text-xs shadow-lg"
          >
            <Upload className="w-4 h-4" />
            <span>Upload File</span>
          </button>

          <button
            onClick={onOpenShare}
            className="px-4 h-11 rounded-xl bg-slate-800/90 border border-white/10 hover:border-amber-500/40 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:bg-slate-800"
          >
            <Share2 className="w-4 h-4 text-[#F5B700]" />
            <span>Share Files</span>
          </button>

          <button
            onClick={onOpenVault}
            className="px-4 h-11 rounded-xl bg-slate-800/90 border border-white/10 hover:border-emerald-500/40 text-slate-200 hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:bg-slate-800"
          >
            <Lock className="w-4 h-4 text-emerald-400" />
            <span>Secure Vault</span>
          </button>

          <button
            onClick={onOpenAskAI}
            className="px-4 h-11 rounded-xl bg-gradient-to-r from-amber-500/10 to-amber-600/20 border border-amber-500/30 text-[#F5B700] hover:text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,183,0,0.15)]"
          >
            <Sparkles className="w-4 h-4 text-[#F5B700] animate-pulse" />
            <span>Ask AI</span>
          </button>
        </div>
      </div>
    </div>
  );
};
