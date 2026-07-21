import React from 'react';
import { Cpu, ShieldCheck } from 'lucide-react';

interface AIOnboardingBannerProps {
  progress: number;
  isIndexing: boolean;
}

export const AIOnboardingBanner: React.FC<AIOnboardingBannerProps> = ({ progress, isIndexing }) => {
  if (!isIndexing && progress >= 100) return null;

  return (
    <div className="w-full bg-gradient-to-r from-surface-container via-surface-card to-surface-container border border-amber-500/30 rounded-xl p-4 mb-6 shadow-xl relative overflow-hidden">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-amber-500/20 text-accent-gold rounded-lg border border-amber-500/40">
            <Cpu className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h4 className="text-sm font-semibold text-gray-100">On-Device Local AI & MobileCLIP Indexer</h4>
              <span className="flex items-center text-[11px] text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded-full">
                <ShieldCheck className="w-3 h-3 mr-1" /> Zero-Knowledge
              </span>
            </div>
            <p className="text-xs text-amber-200/90 mt-0.5 font-medium">
              "Running 100% Zero-Knowledge AI on your device. Your unencrypted photos and files never reach the server."
            </p>
          </div>
        </div>

        <div className="text-right">
          <span className="text-xs font-bold text-accent-gold">{progress}% Indexed</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-3 w-full bg-surface border border-stroke-default h-2 rounded-full overflow-hidden">
        <div
          className="bg-gradient-to-r from-amber-500 to-accent-gold h-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};
