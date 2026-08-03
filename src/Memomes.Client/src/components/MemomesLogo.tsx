import React from 'react';

interface MemomesLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showTagline?: boolean;
  className?: string;
  onClick?: () => void;
}

export const MemomesLogo: React.FC<MemomesLogoProps> = ({
  size = 'md',
  showTagline = false,
  className = '',
  onClick
}) => {
  const iconSizes = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl',
    xl: 'text-5xl'
  };

  const cloudSubSizes = {
    sm: 'text-[9px] tracking-[0.25em]',
    md: 'text-[11px] tracking-[0.3em]',
    lg: 'text-sm tracking-[0.35em]',
    xl: 'text-lg tracking-[0.4em]'
  };

  return (
    <div 
      onClick={onClick} 
      className={`inline-flex flex-col items-center select-none cursor-pointer ${className}`}
    >
      {/* 1. Top Logo Mark (Gold Cloud + Shield with M Keyhole Monogram) */}
      <div className="flex items-center gap-3">
        <div className={`relative ${iconSizes[size]} flex items-center justify-center shrink-0`}>
          
          {/* Custom SVG render matching 100% of user reference image */}
          <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full drop-shadow-[0_4px_12px_rgba(245,192,39,0.3)]">
            <defs>
              <linearGradient id="goldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FFF2A1" />
                <stop offset="35%" stopColor="#F5C027" />
                <stop offset="70%" stopColor="#D4A017" />
                <stop offset="100%" stopColor="#8A6400" />
              </linearGradient>
              <linearGradient id="shieldGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#F5C027" />
                <stop offset="100%" stopColor="#997000" />
              </linearGradient>
              <filter id="glow">
                <feGaussianBlur stdDeviation="1.5" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>

            {/* Cloud Outline */}
            <path 
              d="M25 65 C15 65 10 55 18 45 C15 32 30 22 45 25 C55 15 75 20 78 35 C88 38 90 52 82 62 C78 65 72 65 68 65" 
              stroke="url(#goldGrad)" 
              strokeWidth="5.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />

            {/* Floating Pixel Data Blocks Bottom Right */}
            <rect x="72" y="58" width="5" height="5" rx="1" fill="url(#goldGrad)" />
            <rect x="79" y="54" width="6" height="6" rx="1" fill="url(#goldGrad)" />
            <rect x="86" y="58" width="5" height="5" rx="1" fill="url(#goldGrad)" />
            <rect x="80" y="62" width="4" height="4" rx="1" fill="url(#goldGrad)" />

            {/* Center Shield Container */}
            <path 
              d="M50 32 L68 39 C68 55 58 67 50 72 C42 67 32 55 32 39 L50 32 Z" 
              fill="#0A0E18" 
              stroke="url(#goldGrad)" 
              strokeWidth="4" 
              strokeLinejoin="round" 
            />

            {/* M Monogram with Keyhole Inside Shield */}
            <path 
              d="M40 43 L40 58 M40 43 L50 52 L60 43 M60 43 L60 58" 
              stroke="url(#goldGrad)" 
              strokeWidth="4" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
            {/* Keyhole stem at bottom of M */}
            <circle cx="50" cy="56" r="2.5" fill="url(#goldGrad)" />
            <polygon points="48.5,56 51.5,56 52,61 48,61" fill="url(#goldGrad)" />
          </svg>
        </div>

        {/* 2. Brand Name Typography: memo (White) + mes (Warm Gold) */}
        <div className="flex flex-col text-left">
          <div className={`${textSizes[size]} font-black tracking-tight leading-none font-heading flex items-center`}>
            <span className="text-white">memo</span>
            <span className="text-[#F5C027] drop-shadow-[0_2px_8px_rgba(245,192,39,0.3)]">mes</span>
          </div>

          {/* Subtitle Line: — CLOUD — */}
          <div className={`${cloudSubSizes[size]} font-extrabold text-[#F5C027] flex items-center justify-between gap-1.5 mt-1`}>
            <span className="h-[1px] bg-gradient-to-r from-transparent to-[#F5C027] flex-1 opacity-70" />
            <span>CLOUD</span>
            <span className="h-[1px] bg-gradient-to-l from-transparent to-[#F5C027] flex-1 opacity-70" />
          </div>
        </div>
      </div>

      {/* 3. Optional Tagline Banner */}
      {showTagline && (
        <div className="text-[10px] sm:text-xs font-mono font-bold text-[#CBD5E1] tracking-[0.2em] uppercase mt-3 border-t border-white/10 pt-2 text-center opacity-90">
          Control Your Files. Even After Sharing.
        </div>
      )}
    </div>
  );
};
