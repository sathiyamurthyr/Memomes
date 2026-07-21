import React, { useState } from 'react';
import {
  Share2, Lock, KeyRound, Clock, Flame, Eye, Copy, Check, QrCode, Shield, Sparkles, X
} from 'lucide-react';
import type { FileItem } from './DashboardV2';

interface SecureShareModalProps {
  file: FileItem;
  onClose: () => void;
  onShareCreated?: (shareDetails: any) => void;
}

export const SecureShareModal: React.FC<SecureShareModalProps> = ({
  file,
  onClose,
  onShareCreated
}) => {
  const [accessTier, setAccessTier] = useState<'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL'>('VIEW_ONLY');
  const [enablePassword, setEnablePassword] = useState(false);
  const [passwordPin, setPasswordPin] = useState('');
  const [expiryOption, setExpiryOption] = useState('60s');
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [enableSelfDestruct, setEnableSelfDestruct] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  const handleGenerateShare = () => {
    const link = `https://memomes.cloud/s/${file.id}?tier=${accessTier}&expiry=${expiryOption}&zk=1`;
    setGeneratedLink(link);
    if (onShareCreated) {
      onShareCreated({
        fileId: file.id,
        recipientEmail,
        accessTier,
        expiryOption,
        enableWatermark,
        enableSelfDestruct,
        link
      });
    }
  };

  const handleCopyLink = () => {
    if (!generatedLink) return;
    navigator.clipboard.writeText(generatedLink);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-lg glass-card rounded-2xl border border-stroke-default p-6 space-y-5 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-surface-card transition"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3 border-b border-stroke-default pb-4">
          <div className="w-10 h-10 rounded-xl bg-primary/20 border border-primary/40 flex items-center justify-center">
            <Share2 className="w-5 h-5 text-accent-gold" />
          </div>
          <div>
            <h3 className="font-extrabold text-white text-base">Create Secure Share Link</h3>
            <p className="text-xs text-gray-400 font-mono truncate max-w-xs">{file.fileNameEncrypted}</p>
          </div>
        </div>

        {/* Form Body */}
        <div className="space-y-4 text-xs">
          {/* Recipient Email Input */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">Recipient Email (Optional Asymmetric Envelope)</label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="e.g. recipient@example.com"
              className="w-full bg-surface border border-stroke-default rounded-xl px-3.5 py-2 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold font-mono"
            />
          </div>

          {/* Access Tier Selector */}
          <div>
            <label className="block text-gray-300 font-bold mb-1.5">Access Tier & Permission</label>
            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'VIEW_ONLY', label: 'View Only', desc: 'No Download', icon: Eye, color: 'border-accent-gold text-accent-gold' },
                { id: 'READ_DOWNLOAD', label: 'Read & Download', desc: 'Full File Access', icon: Shield, color: 'border-accent-blue text-accent-blue' },
                { id: 'FULL_CONTROL', label: 'Full Control', desc: 'Reshare Allowed', icon: Lock, color: 'border-emerald-500 text-emerald-400' },
              ].map(tier => {
                const Icon = tier.icon;
                const isSelected = accessTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setAccessTier(tier.id as any)}
                    className={`p-3 rounded-xl border text-left transition ${
                      isSelected
                        ? `bg-surface-card ${tier.color} shadow-sm`
                        : 'bg-surface border-stroke-default text-gray-400 hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4 mb-1.5" />
                    <div className="font-bold text-gray-200">{tier.label}</div>
                    <div className="text-[10px] text-gray-500">{tier.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Toggles Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Secondary Password / PIN */}
            <div className="p-3 bg-surface rounded-xl border border-stroke-default space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-bold text-gray-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-purple-400" /> Password PIN
                </span>
                <input
                  type="checkbox"
                  checked={enablePassword}
                  onChange={(e) => setEnablePassword(e.target.checked)}
                  className="rounded border-stroke-default accent-primary"
                />
              </div>
              {enablePassword && (
                <input
                  type="text"
                  value={passwordPin}
                  onChange={(e) => setPasswordPin(e.target.value)}
                  placeholder="Set 4-digit PIN"
                  maxLength={6}
                  className="w-full bg-surface-card border border-stroke-default rounded-lg px-2.5 py-1.5 text-white font-mono text-[11px]"
                />
              )}
            </div>

            {/* Dynamic Watermark */}
            <div className="p-3 bg-surface rounded-xl border border-stroke-default flex items-center justify-between">
              <div>
                <div className="font-bold text-gray-200 flex items-center gap-1.5">
                  <Lock className="w-3.5 h-3.5 text-accent-gold" /> Anti-Leak Watermark
                </div>
                <div className="text-[10px] text-gray-500">Overlays email & IP</div>
              </div>
              <input
                type="checkbox"
                checked={enableWatermark}
                onChange={(e) => setEnableWatermark(e.target.checked)}
                className="rounded border-stroke-default accent-primary"
              />
            </div>
          </div>

          {/* Expiry Selector & Self Destruct */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-accent-blue" /> Expiry Duration
              </label>
              <select
                value={expiryOption}
                onChange={(e) => setExpiryOption(e.target.value)}
                className="w-full bg-surface border border-stroke-default rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-accent-gold"
              >
                <option value="60s">60-Second Presigned URL (Max Security)</option>
                <option value="1h">1 Hour</option>
                <option value="24h">24 Hours</option>
                <option value="7d">7 Days</option>
              </select>
            </div>

            <div className="p-2.5 bg-surface rounded-xl border border-stroke-default flex items-center justify-between">
              <div>
                <div className="font-bold text-orange-400 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" /> Self-Destruct
                </div>
                <div className="text-[10px] text-gray-500">Burn link on first read</div>
              </div>
              <input
                type="checkbox"
                checked={enableSelfDestruct}
                onChange={(e) => setEnableSelfDestruct(e.target.checked)}
                className="rounded border-stroke-default accent-orange-500"
              />
            </div>
          </div>

          {/* Generate Link Button */}
          {!generatedLink ? (
            <button
              onClick={handleGenerateShare}
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl transition flex items-center justify-center gap-2 shadow-lg"
            >
              <Sparkles className="w-4 h-4 text-accent-gold" /> Generate Encrypted Zero-Knowledge Link
            </button>
          ) : (
            /* Generated Link Display Box */
            <div className="p-3.5 bg-surface-container rounded-xl border border-accent-gold/40 space-y-3 animate-in fade-in duration-200">
              <div className="flex items-center justify-between text-[11px] font-bold text-accent-gold">
                <span className="flex items-center gap-1"><Shield className="w-3.5 h-3.5" /> Secure Share Link Active</span>
                <span>{expiryOption} Expiry</span>
              </div>
              <div className="flex items-center gap-2 bg-surface p-2 rounded-lg border border-stroke-default font-mono text-[11px] text-gray-300">
                <span className="truncate flex-1">{generatedLink}</span>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-1 bg-primary text-white font-bold rounded-lg flex items-center gap-1 shrink-0"
                >
                  {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => setShowQr(!showQr)}
                  className="p-1 bg-surface-card border border-stroke-default rounded-lg text-gray-300 hover:text-white"
                  title="Toggle QR Code"
                >
                  <QrCode className="w-4 h-4" />
                </button>
              </div>

              {showQr && (
                <div className="p-4 bg-white rounded-xl text-center flex flex-col items-center justify-center">
                  <div className="w-32 h-32 bg-black/10 border-2 border-black/20 rounded-lg flex items-center justify-center">
                    <QrCode className="w-24 h-24 text-black" />
                  </div>
                  <span className="text-[10px] text-black font-mono font-bold mt-2">Scan to decrypt on mobile</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
