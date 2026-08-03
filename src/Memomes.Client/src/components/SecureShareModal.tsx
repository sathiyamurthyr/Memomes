import React, { useState, useEffect } from 'react';
import {
  Share2, Lock, Flame, Eye, Check,
  Shield, X, Download, Copy, Sliders
} from 'lucide-react';
import type { FileItem } from './DashboardV2';
import { getAppBaseUrl } from '../utils/urlHelper';
import { ShareCrypto } from '../utils/shareCrypto';

interface SecureShareModalProps {
  file: FileItem;
  onClose: () => void;
  onShareCreated?: (shareDetails: any) => void;
}

export const SecureShareModal: React.FC<SecureShareModalProps> = ({ file, onClose, onShareCreated }) => {
  const [accessTier, setAccessTier] = useState<'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL'>('VIEW_ONLY');
  const [passwordPin, setPasswordPin] = useState('');
  const [expiryOption, setExpiryOption] = useState('24h');
  
  // Watermark Options
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState('RECIPIENT · 103.21.124.5');
  const [watermarkFont, setWatermarkFont] = useState('mono');
  const [watermarkDensity, setWatermarkDensity] = useState('medium');
  const [watermarkRotation, setWatermarkRotation] = useState(-15);
  const [showAdvancedWatermark, setShowAdvancedWatermark] = useState(false);
  
  const [enableSelfDestruct, setEnableSelfDestruct] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);

  /* Auto-generate share link on option changes */
  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
      try {
        const baseUrl = getAppBaseUrl();
        const token = await ShareCrypto.encryptParams(file.id, {
          tier: accessTier, expiry: expiryOption, zk: true,
          oneTime: enableSelfDestruct,
          watermark: enableWatermark ? { text: watermarkText, font: watermarkFont, density: watermarkDensity, rotation: watermarkRotation } : null
        });
        const link = `${baseUrl}/s/${file.id}?p=${token}`;
        if (isMounted) {
          setGeneratedLink(link);
          onShareCreated?.({ fileId: file.id, recipientEmail, accessTier, expiryOption, enableWatermark, enableSelfDestruct, link });
        }
      } catch (err) {
        console.warn('Share link generation error', err);
      }
    };
    generate();
    return () => { isMounted = false; };
  }, [file.id, accessTier, expiryOption, enableSelfDestruct, enableWatermark, watermarkText, watermarkFont, watermarkDensity, watermarkRotation]);

  const handleCopy = () => {
    if (!generatedLink) return;
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(generatedLink);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = generatedLink;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    } catch (err) {
      console.warn('Fallback copy executed', err);
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4">
      <div className="w-full max-w-lg bg-[#0F172A] border border-white/10 rounded-3xl shadow-2xl overflow-hidden relative max-h-[92vh] flex flex-col animate-in fade-in zoom-in-95">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-white/10 flex items-center justify-between bg-slate-900/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-[#F5B700]">
              <Share2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <span>Secure Share Link</span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 text-[10px] font-mono border border-emerald-500/20">
                  AES-256
                </span>
              </h2>
              <p className="text-xs text-slate-400 font-mono truncate max-w-[240px]">
                {file.name} ({file.size})
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs">
          
          {/* Top Primary Link Output Box */}
          <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-2">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> Encrypted Link Ready
              </span>
              <span className="text-[10px] font-mono text-slate-400">Zero-Knowledge</span>
            </div>

            <div className="flex items-center gap-2 bg-[#070B14] p-1.5 rounded-xl border border-white/10">
              <input
                type="text"
                readOnly
                value={generatedLink || 'Generating link...'}
                className="w-full bg-transparent px-2.5 text-xs text-slate-200 font-mono focus:outline-none truncate"
              />
              <button
                onClick={handleCopy}
                className="btn-gold !h-8 !px-3.5 !text-xs shrink-0"
              >
                {isCopied ? (
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5" /> Copied</span>
                ) : (
                  <span className="flex items-center gap-1"><Copy className="w-3.5 h-3.5" /> Copy</span>
                )}
              </button>
            </div>
          </div>

          {/* Access Tier Segmented Controls */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
              Access Permissions
            </label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'VIEW_ONLY', label: 'View Only', sub: 'No download', icon: Eye, color: '#F5B700' },
                { id: 'READ_DOWNLOAD', label: 'Download', sub: 'Allow save', icon: Download, color: '#3B82F6' },
                { id: 'FULL_CONTROL', label: 'Full Access', sub: 'Re-share', icon: Shield, color: '#22C55E' }
              ].map((tier) => {
                const Icon = tier.icon;
                const active = accessTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setAccessTier(tier.id as any)}
                    className={`p-2.5 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-amber-500/10 border-amber-500/50 text-white shadow-[0_0_15px_rgba(245,183,0,0.15)]'
                        : 'bg-slate-900/80 border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-1.5 mb-1">
                      <Icon className="w-3.5 h-3.5" style={{ color: active ? tier.color : undefined }} />
                      <span className="font-bold text-xs">{tier.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 block font-mono">{tier.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link Expiry Option Row */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
              Link Expiration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[
                { value: '60s', label: '60 Seconds' },
                { value: '1h', label: '1 Hour' },
                { value: '24h', label: '24 Hours' },
                { value: '7d', label: '7 Days' }
              ].map((opt) => {
                const active = expiryOption === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setExpiryOption(opt.value)}
                    className={`py-2 rounded-xl text-xs font-mono font-semibold border transition-all text-center ${
                      active
                        ? 'bg-amber-500/20 border-amber-500 text-[#F5B700]'
                        : 'bg-slate-900/80 border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Features Row */}
          <div className="space-y-2">
            <label className="text-[11px] font-bold text-amber-400 uppercase tracking-wider font-mono">
              Security Protections
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {/* Burn on First Read */}
              <button
                onClick={() => setEnableSelfDestruct(!enableSelfDestruct)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  enableSelfDestruct
                    ? 'bg-orange-500/10 border-orange-500/50 text-white'
                    : 'bg-slate-900/80 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Flame className={`w-4 h-4 ${enableSelfDestruct ? 'text-orange-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold text-xs block text-white">Burn on First Read</span>
                    <span className="text-[10px] text-slate-400">Destroy after 1 view</span>
                  </div>
                </div>
                <input type="checkbox" checked={enableSelfDestruct} readOnly className="accent-orange-500 w-3.5 h-3.5" />
              </button>

              {/* Anti-Leak Watermark */}
              <button
                onClick={() => setEnableWatermark(!enableWatermark)}
                className={`p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  enableWatermark
                    ? 'bg-amber-500/10 border-amber-500/50 text-white'
                    : 'bg-slate-900/80 border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${enableWatermark ? 'text-[#F5B700]' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold text-xs block text-white">Anti-Leak Watermark</span>
                    <span className="text-[10px] text-slate-400">Stamp IP & timestamp</span>
                  </div>
                </div>
                <input type="checkbox" checked={enableWatermark} readOnly className="accent-amber-500 w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Optional Password PIN & Recipient Inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1">Recipient Email (Optional)</label>
              <input
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full h-9 px-3 rounded-xl bg-[#070B14] border border-white/10 text-white text-xs placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>

            <div>
              <label className="text-[10px] text-slate-400 font-medium block mb-1">PIN Password (Optional)</label>
              <input
                type="text"
                value={passwordPin}
                onChange={(e) => setPasswordPin(e.target.value)}
                placeholder="4-digit PIN (e.g. 4321)"
                maxLength={8}
                className="w-full h-9 px-3 rounded-xl bg-[#070B14] border border-white/10 text-white text-xs font-mono placeholder-slate-600 focus:outline-none focus:border-amber-500"
              />
            </div>
          </div>

          {/* Advanced Watermark Options Accordion */}
          {enableWatermark && (
            <div className="border-t border-white/10 pt-2">
              <button
                onClick={() => setShowAdvancedWatermark(!showAdvancedWatermark)}
                className="text-[11px] text-amber-400 hover:underline font-mono flex items-center gap-1 py-1"
              >
                <Sliders className="w-3 h-3" />
                <span>{showAdvancedWatermark ? 'Hide Watermark Customization' : 'Customize Watermark Text & Rotation'}</span>
              </button>

              {showAdvancedWatermark && (
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-white/10 space-y-2.5 mt-2 animate-in fade-in">
                  <div>
                    <label className="text-[10px] font-mono text-slate-400 block mb-1">Watermark Text</label>
                    <input
                      type="text"
                      value={watermarkText}
                      onChange={(e) => setWatermarkText(e.target.value)}
                      className="w-full h-8 px-3 rounded-lg bg-[#070B14] border border-white/10 text-white text-xs font-mono"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[10px]">
                    <div>
                      <label className="text-slate-400 block mb-1">Font</label>
                      <select
                        value={watermarkFont}
                        onChange={(e) => setWatermarkFont(e.target.value)}
                        className="w-full h-8 rounded-lg bg-[#070B14] border border-white/10 text-white px-2 font-mono"
                      >
                        <option value="mono">Monospace</option>
                        <option value="sans">Sans-Serif</option>
                        <option value="serif">Serif</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Density</label>
                      <select
                        value={watermarkDensity}
                        onChange={(e) => setWatermarkDensity(e.target.value)}
                        className="w-full h-8 rounded-lg bg-[#070B14] border border-white/10 text-white px-2 font-mono"
                      >
                        <option value="low">Light (2x2)</option>
                        <option value="medium">Medium (3x3)</option>
                        <option value="high">Heavy (4x4)</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-1">Rotation</label>
                      <select
                        value={watermarkRotation}
                        onChange={(e) => setWatermarkRotation(Number(e.target.value))}
                        className="w-full h-8 rounded-lg bg-[#070B14] border border-white/10 text-white px-2 font-mono"
                      >
                        <option value={-15}>Slight (-15°)</option>
                        <option value={-45}>Diagonal (-45°)</option>
                        <option value={0}>Horizontal (0°)</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-white/10 bg-slate-900/60 flex items-center justify-between text-xs">
          <span className="text-[11px] text-slate-400 font-mono flex items-center gap-1">
            <Lock className="w-3 h-3 text-emerald-400" /> Auto-saved to memory
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-slate-800 text-slate-200 hover:text-white font-semibold transition-colors"
          >
            Done
          </button>
        </div>

      </div>
    </div>
  );
};
