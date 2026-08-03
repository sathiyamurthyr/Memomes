import React, { useState, useEffect, useRef } from 'react';
import {
  ArrowLeft, Share2, Lock, Flame, Eye, Check, Shield, Download,
  Copy, Sliders, RefreshCw, AlertTriangle, QrCode, Globe, Clock,
  UserCheck, Ban, Sparkles
} from 'lucide-react';
import type { FileItem } from './DashboardV2';
import { getAppBaseUrl } from '../utils/urlHelper';
import { ShareCrypto } from '../utils/shareCrypto';

interface SharedRecipientRecord {
  id: string;
  recipientEmail: string;
  linkToken: string;
  accessTier: 'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL';
  createdAt: string;
  expiresAt: string;
  viewCount: number;
  lastViewedIp: string;
  lastViewedLocation: string;
  status: 'ACTIVE' | 'EXPIRED' | 'REVOKED';
  enableWatermark: boolean;
  enableSelfDestruct: boolean;
  pinProtected: boolean;
}

interface ShareManagementPageProps {
  file: FileItem;
  userEmail: string;
  onBack: () => void;
}

export const ShareManagementPage: React.FC<ShareManagementPageProps> = ({ file, userEmail, onBack }) => {
  // Access Tier & Expiry
  const [accessTier, setAccessTier] = useState<'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL'>('VIEW_ONLY');
  const [expiryOption, setExpiryOption] = useState('24h');
  const [customExpiryDate, setCustomExpiryDate] = useState('');

  // Watermark Customization
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState(`CONFIDENTIAL • ${userEmail} • IP: 103.21.124.5`);
  const [watermarkFont, setWatermarkFont] = useState('mono');
  const [watermarkDensity, setWatermarkDensity] = useState<'low' | 'medium' | 'high'>('medium');
  const [watermarkRotation, setWatermarkRotation] = useState(-15);
  const [watermarkOpacity, setWatermarkOpacity] = useState(45);
  const [showWatermarkControls, setShowWatermarkControls] = useState(true);

  // Security Features
  const [enableSelfDestruct, setEnableSelfDestruct] = useState(false);
  const [passwordPin, setPasswordPin] = useState('');
  const [enableAntiScreenshot, setEnableAntiScreenshot] = useState(true);
  const [allowedIpRange, setAllowedIpRange] = useState('');
  const [recipientEmailInput, setRecipientEmailInput] = useState('');

  // Generated Link & Feedback
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [showQrCode, setShowQrCode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Shared User Records List State
  const [sharedRecords, setSharedRecords] = useState<SharedRecipientRecord[]>([
    {
      id: 'sr-101',
      recipientEmail: 'alex.partner@enterprise.com',
      linkToken: 's_89a1f2c4',
      accessTier: 'VIEW_ONLY',
      createdAt: '2 hours ago',
      expiresAt: '22 hours left',
      viewCount: 4,
      lastViewedIp: '103.21.124.5',
      lastViewedLocation: 'New York, US',
      status: 'ACTIVE',
      enableWatermark: true,
      enableSelfDestruct: false,
      pinProtected: true
    },
    {
      id: 'sr-102',
      recipientEmail: 'client-audit@firm.org',
      linkToken: 's_3b78e901',
      accessTier: 'READ_DOWNLOAD',
      createdAt: '1 day ago',
      expiresAt: 'Expired',
      viewCount: 1,
      lastViewedIp: '182.74.15.9',
      lastViewedLocation: 'London, UK',
      status: 'EXPIRED',
      enableWatermark: true,
      enableSelfDestruct: true,
      pinProtected: false
    }
  ]);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const isVideo = file.category === 'video' || file.type?.startsWith('video/') || /\.(mp4|mov|mkv|avi|webm|m4v)$/i.test(file.name);
  const isImage = file.category === 'image' || file.type?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name);
  const isPdf = file.name.endsWith('.pdf') || file.type?.includes('pdf');

  // Trigger toast alert
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Generate AES Encrypted Share Link
  useEffect(() => {
    let isMounted = true;
    const generate = async () => {
      try {
        const baseUrl = getAppBaseUrl();
        const token = await ShareCrypto.encryptParams(file.id, {
          tier: accessTier,
          expiry: expiryOption === 'custom' ? customExpiryDate : expiryOption,
          zk: true,
          oneTime: enableSelfDestruct,
          pin: passwordPin || null,
          watermark: enableWatermark ? {
            text: watermarkText,
            font: watermarkFont,
            density: watermarkDensity,
            rotation: watermarkRotation,
            opacity: watermarkOpacity
          } : null
        });
        const link = `${baseUrl}/s/${file.id}?p=${token}`;
        if (isMounted) setGeneratedLink(link);
      } catch (err) {
        console.warn('Share link generation error', err);
      }
    };
    generate();
    return () => { isMounted = false; };
  }, [file.id, accessTier, expiryOption, customExpiryDate, enableSelfDestruct, passwordPin, enableWatermark, watermarkText, watermarkFont, watermarkDensity, watermarkRotation, watermarkOpacity]);

  // Render Real-time Watermarked Image Canvas Preview
  useEffect(() => {
    if (isImage && file.previewUrl && canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        canvas.width = img.width || 800;
        canvas.height = img.height || 600;

        // Draw original image
        ctx.drawImage(img, 0, 0);

        // Draw Watermark Overlay if enabled
        if (enableWatermark) {
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((watermarkRotation * Math.PI) / 180);

          const fontSize = Math.max(14, Math.floor(canvas.width / 24));
          const fontFamily = watermarkFont === 'mono' ? 'monospace' : watermarkFont === 'serif' ? 'serif' : 'sans-serif';
          ctx.font = `bold ${fontSize}px ${fontFamily}`;

          const opacityVal = watermarkOpacity / 100;
          ctx.fillStyle = `rgba(245, 183, 0, ${opacityVal})`;
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 6;
          ctx.textAlign = 'center';

          const stepY = watermarkDensity === 'low' ? canvas.height / 3 : watermarkDensity === 'high' ? canvas.height / 7 : canvas.height / 5;
          for (let y = -canvas.height; y < canvas.height; y += stepY) {
            ctx.fillText(watermarkText, 0, y);
          }
          ctx.restore();
        }
      };
      img.src = file.previewUrl;
    }
  }, [isImage, file.previewUrl, enableWatermark, watermarkText, watermarkFont, watermarkDensity, watermarkRotation, watermarkOpacity]);

  // Copy Link Handler
  const handleCopyLink = () => {
    if (!generatedLink) return;
    try {
      if (navigator.clipboard?.writeText) {
        navigator.clipboard.writeText(generatedLink);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = generatedLink;
        textarea.style.position = 'fixed';
        textarea.style.left = '-999999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setIsCopied(true);
      showToast('✔ AES-256 Share Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch {
      setIsCopied(true);
      showToast('✔ Link copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    }
  };

  // Create & Append New Share Link to Roster
  const handleCreateNewShare = () => {
    const newRecord: SharedRecipientRecord = {
      id: `sr-${Date.now()}`,
      recipientEmail: recipientEmailInput.trim() || 'Anonymous Link Access',
      linkToken: `s_${Math.random().toString(36).slice(2, 10)}`,
      accessTier,
      createdAt: 'Just now',
      expiresAt: expiryOption === '60s' ? '60 Seconds' : expiryOption === '1h' ? '1 Hour' : expiryOption === '24h' ? '24 Hours' : '7 Days',
      viewCount: 0,
      lastViewedIp: 'Pending View',
      lastViewedLocation: 'Unverified',
      status: 'ACTIVE',
      enableWatermark,
      enableSelfDestruct,
      pinProtected: Boolean(passwordPin)
    };

    setSharedRecords(prev => [newRecord, ...prev]);
    setRecipientEmailInput('');
    showToast('✔ New secure share link generated and recorded!');
  };

  // Toggle Access Revocation
  const toggleRevoke = (id: string) => {
    setSharedRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        const newStatus = rec.status === 'REVOKED' ? 'ACTIVE' : 'REVOKED';
        showToast(newStatus === 'REVOKED' ? '🛑 Access revoked immediately!' : '✔ Access re-activated!');
        return { ...rec, status: newStatus };
      }
      return rec;
    }));
  };

  // Extend Expiry +24 Hours
  const extendExpiry = (id: string) => {
    setSharedRecords(prev => prev.map(rec => {
      if (rec.id === id) {
        showToast('⏰ Expiry extended by +24 Hours!');
        return { ...rec, status: 'ACTIVE', expiresAt: '24 hours left' };
      }
      return rec;
    }));
  };

  return (
    <div className="min-h-screen bg-[#070B14] text-white p-4 md:p-8 space-y-6 font-sans selection:bg-[#F5B700] selection:text-slate-950">
      
      {/* Toast Notification Alert */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 bg-[#F5B700] text-slate-950 px-4 py-3 rounded-2xl font-bold text-xs shadow-2xl flex items-center gap-2 animate-bounce">
          <Sparkles className="w-4 h-4" /> {toastMessage}
        </div>
      )}

      {/* ── TOP HEADER NAVBAR ────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2.5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-2 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Vault
          </button>
          <div>
            <h1 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
              <Share2 className="w-6 h-6 text-[#F5B700]" /> Secure Share & Access Hub
            </h1>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Control viewer permissions, enforce watermarks, and track access logs
            </p>
          </div>
        </div>

        {/* File Quick Info Badge */}
        <div className="flex items-center gap-3 bg-[#0E1524] p-3 rounded-2xl border border-white/10 text-xs font-mono">
          <div className="w-8 h-8 rounded-xl bg-[#F5B700]/15 border border-[#F5B700]/30 text-[#F5B700] flex items-center justify-center font-bold text-xs">
            {file.badgeType || 'FILE'}
          </div>
          <div>
            <div className="font-bold text-white max-w-[180px] truncate">{file.name}</div>
            <div className="text-[10px] text-slate-400">{file.size} • AES-256 Encrypted</div>
          </div>
        </div>
      </div>

      {/* ── MAIN CONTENT GRID (RESPONSIVE 12-COL LAYOUT) ────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* ── LEFT COLUMN (5 COLS): LIVE FILE & WATERMARK PREVIEW ────────────── */}
        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-3xl space-y-4 border border-white/10">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-[#F5B700]" /> Live Recipient Stream Preview
              </h3>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                Viewer View
              </span>
            </div>

            {/* Media Canvas Box */}
            <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-slate-950 border border-white/10 flex items-center justify-center group">
              {isImage && file.previewUrl ? (
                <canvas ref={canvasRef} className="w-full h-full object-contain" />
              ) : isVideo && file.previewUrl ? (
                <div className="relative w-full h-full">
                  <video
                    src={file.previewUrl}
                    controls
                    preload="metadata"
                    controlsList="nodownload"
                    className="w-full h-full object-contain"
                  />
                  {enableWatermark && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-15deg] text-amber-400/40 text-sm font-mono font-bold select-none text-center p-4">
                      {watermarkText}
                    </div>
                  )}
                </div>
              ) : isPdf && file.previewUrl ? (
                <div className="relative w-full h-full bg-slate-900 overflow-hidden">
                  <iframe
                    src={file.previewUrl}
                    title={file.name}
                    className="w-full h-full bg-white/95"
                  />
                  {enableWatermark && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-20deg] text-amber-400/40 text-xs font-mono font-bold select-none p-4">
                      {watermarkText}
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-6 text-center space-y-3 relative">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5B700]/10 border border-[#F5B700]/30 flex items-center justify-center text-[#F5B700]">
                    <Lock className="w-8 h-8" />
                  </div>
                  <div className="font-bold text-xs text-white">{file.name}</div>
                  <div className="text-[11px] text-slate-400 font-mono">{file.size} • Encrypted Document Payload</div>
                  {enableWatermark && (
                    <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-20deg] text-amber-400/30 text-xs font-mono font-bold select-none p-4">
                      {watermarkText}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Watermark Customizer Accordion */}
            <div className="border-t border-white/10 pt-3 space-y-3">
              <button
                onClick={() => setShowWatermarkControls(!showWatermarkControls)}
                className="w-full flex items-center justify-between text-xs font-bold text-[#F5B700] hover:underline font-mono"
              >
                <span className="flex items-center gap-1.5">
                  <Sliders className="w-4 h-4" /> Customize Anti-Leak Watermark
                </span>
                <span>{showWatermarkControls ? '▲ Hide' : '▼ Expand'}</span>
              </button>

              {showWatermarkControls && (
                <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 space-y-3 text-xs font-mono">
                  {/* Enable Switch */}
                  <div className="flex items-center justify-between border-b border-white/5 pb-2">
                    <span className="text-slate-300 font-bold">Enable Anti-Leak Watermark</span>
                    <input
                      type="checkbox"
                      checked={enableWatermark}
                      onChange={e => setEnableWatermark(e.target.checked)}
                      className="accent-[#F5B700] w-4 h-4 cursor-pointer"
                    />
                  </div>

                  {enableWatermark && (
                    <>
                      <div>
                        <label className="text-[10px] text-slate-400 block mb-1">Watermark Stamp Text</label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={e => setWatermarkText(e.target.value)}
                          className="w-full h-9 px-3 rounded-xl bg-[#0E1524] border border-white/10 text-white text-xs font-mono focus:border-[#F5B700] focus:outline-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-slate-400 block mb-1">Font Style</label>
                          <select
                            value={watermarkFont}
                            onChange={e => setWatermarkFont(e.target.value)}
                            className="w-full h-8 rounded-lg bg-[#0E1524] border border-white/10 text-white px-2 font-mono"
                          >
                            <option value="mono">Monospace</option>
                            <option value="sans">Sans-Serif</option>
                            <option value="serif">Serif</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Grid Density</label>
                          <select
                            value={watermarkDensity}
                            onChange={e => setWatermarkDensity(e.target.value as any)}
                            className="w-full h-8 rounded-lg bg-[#0E1524] border border-white/10 text-white px-2 font-mono"
                          >
                            <option value="low">Light (2x2)</option>
                            <option value="medium">Medium (3x3)</option>
                            <option value="high">Dense (4x4)</option>
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <div>
                          <label className="text-slate-400 block mb-1">Rotation Angle</label>
                          <select
                            value={watermarkRotation}
                            onChange={e => setWatermarkRotation(Number(e.target.value))}
                            className="w-full h-8 rounded-lg bg-[#0E1524] border border-white/10 text-white px-2 font-mono"
                          >
                            <option value={-15}>Slight (-15°)</option>
                            <option value={-45}>Diagonal (-45°)</option>
                            <option value={0}>Horizontal (0°)</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-slate-400 block mb-1">Opacity: {watermarkOpacity}%</label>
                          <input
                            type="range"
                            min="15"
                            max="80"
                            value={watermarkOpacity}
                            onChange={e => setWatermarkOpacity(Number(e.target.value))}
                            className="w-full accent-[#F5B700]"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (7 COLS): LINK GENERATOR & SECURITY CONTROLS ──────── */}
        <div className="lg:col-span-7 space-y-4">
          
          {/* AES-256 Link Output Box */}
          <div className="glass-card p-5 rounded-3xl space-y-3 border border-emerald-500/30 bg-emerald-950/10">
            <div className="flex items-center justify-between text-xs text-emerald-400 font-bold">
              <span className="flex items-center gap-1.5">
                <Check className="w-4 h-4" /> AES-256 Encrypted Share URL
              </span>
              <span className="text-[10px] font-mono text-slate-400">Zero-Knowledge Token</span>
            </div>

            <div className="flex items-center gap-2 bg-[#070B14] p-2 rounded-2xl border border-white/10">
              <input
                type="text"
                readOnly
                value={generatedLink || 'Generating link...'}
                className="w-full bg-transparent px-3 text-xs text-slate-200 font-mono focus:outline-none truncate"
              />
              <button
                onClick={handleCopyLink}
                className="btn-gold !h-9 !px-4 !text-xs shrink-0 flex items-center gap-1"
              >
                {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{isCopied ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => setShowQrCode(!showQrCode)}
                className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-[#F5B700] transition"
                title="Mobile QR Code"
              >
                <QrCode className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile QR Code Dropdown */}
            {showQrCode && (
              <div className="p-4 rounded-2xl bg-[#070B14] border border-[#F5B700]/30 text-center space-y-3 animate-fade-in">
                <div className="text-xs font-bold text-[#F5B700]">Scan with Mobile Camera to Test Access</div>
                <div className="w-36 h-36 mx-auto bg-white p-3 rounded-2xl flex items-center justify-center shadow-2xl">
                  {/* High Resolution Rendered Mobile QR Code */}
                  <svg className="w-full h-full" viewBox="0 0 100 100">
                    <path fill="#070B14" d="M0 0h30v30H0zM70 0h30v30H70zM0 70h30v30H0zM10 10h10v10H10zM80 10h10v10H80zM10 80h10v10H10zM35 5h10v10H35zM50 5h15v5H50zM5 35h10v15H5zM20 40h15v10H20zM40 35h20v20H40zM70 40h10v15H70zM85 35h10v10H85zM35 70h10v20H35zM55 75h15v15H55zM75 70h20v10H75zM80 85h15v10H80z" />
                  </svg>
                </div>
                <div className="text-[10px] text-slate-400 font-mono">Compatible with iOS & Android Camera App</div>
              </div>
            )}
          </div>

          {/* Access Permissions Segmented Control */}
          <div className="glass-card p-5 rounded-3xl space-y-3 border border-white/10">
            <label className="text-xs font-bold text-[#F5B700] uppercase tracking-wider font-mono">
              1. Select Access Permission Level
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { id: 'VIEW_ONLY', label: 'View Only Stream', sub: 'Downloads & print blocked', icon: Eye, color: '#F5B700' },
                { id: 'READ_DOWNLOAD', label: 'Read & Download', sub: 'Save original file', icon: Download, color: '#3B82F6' },
                { id: 'FULL_CONTROL', label: 'Full Control', sub: 'Re-share & manage access', icon: Shield, color: '#22C55E' }
              ].map(tier => {
                const Icon = tier.icon;
                const active = accessTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setAccessTier(tier.id as any)}
                    className={`p-3.5 rounded-2xl border text-left transition-all ${
                      active
                        ? 'bg-[#F5B700]/10 border-[#F5B700]/50 text-white shadow-[0_0_20px_rgba(245,183,0,0.15)]'
                        : 'bg-[#070B14] border-white/5 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-4 h-4" style={{ color: active ? tier.color : undefined }} />
                      <span className="font-bold text-xs">{tier.label}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 block font-mono">{tier.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Link Expiration Settings */}
          <div className="glass-card p-5 rounded-3xl space-y-3 border border-white/10">
            <label className="text-xs font-bold text-[#F5B700] uppercase tracking-wider font-mono flex items-center gap-1.5">
              <Clock className="w-4 h-4" /> 2. Set Expiration Timer
            </label>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { value: '60s', label: '60 Secs' },
                { value: '1h', label: '1 Hour' },
                { value: '24h', label: '24 Hours' },
                { value: '7d', label: '7 Days' },
                { value: 'custom', label: 'Custom' }
              ].map(opt => {
                const active = expiryOption === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setExpiryOption(opt.value)}
                    className={`py-2.5 rounded-xl text-xs font-mono font-semibold border transition-all text-center ${
                      active
                        ? 'bg-[#F5B700]/20 border-[#F5B700] text-[#F5B700]'
                        : 'bg-[#070B14] border-white/5 text-slate-400 hover:text-white'
                    }`}
                  >
                    {opt.label}
                  </button>
                );
              })}
            </div>

            {expiryOption === 'custom' && (
              <div className="pt-2">
                <input
                  type="datetime-local"
                  value={customExpiryDate}
                  onChange={e => setCustomExpiryDate(e.target.value)}
                  className="w-full h-9 px-3 rounded-xl bg-[#070B14] border border-white/10 text-white text-xs font-mono focus:border-[#F5B700] focus:outline-none"
                />
              </div>
            )}
          </div>

          {/* Advanced Security Protections Grid */}
          <div className="glass-card p-5 rounded-3xl space-y-3 border border-white/10">
            <label className="text-xs font-bold text-[#F5B700] uppercase tracking-wider font-mono">
              3. Advanced Anti-Leak Protections
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              {/* Burn on First Read */}
              <button
                onClick={() => setEnableSelfDestruct(!enableSelfDestruct)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  enableSelfDestruct
                    ? 'bg-orange-500/10 border-orange-500/50 text-white'
                    : 'bg-[#070B14] border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Flame className={`w-4 h-4 ${enableSelfDestruct ? 'text-orange-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold block text-white">Burn on First Read</span>
                    <span className="text-[10px] text-slate-400">Destroy link after 1 view</span>
                  </div>
                </div>
                <input type="checkbox" checked={enableSelfDestruct} readOnly className="accent-orange-500 w-4 h-4" />
              </button>

              {/* Anti-Screenshot Guard */}
              <button
                onClick={() => setEnableAntiScreenshot(!enableAntiScreenshot)}
                className={`p-3.5 rounded-2xl border text-left flex items-center justify-between transition-all ${
                  enableAntiScreenshot
                    ? 'bg-purple-500/10 border-purple-500/50 text-white'
                    : 'bg-[#070B14] border-white/5 text-slate-400'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Lock className={`w-4 h-4 ${enableAntiScreenshot ? 'text-purple-400' : 'text-slate-500'}`} />
                  <div>
                    <span className="font-bold block text-white">Anti-Screenshot Guard</span>
                    <span className="text-[10px] text-slate-400">Blur on focus loss</span>
                  </div>
                </div>
                <input type="checkbox" checked={enableAntiScreenshot} readOnly className="accent-purple-500 w-4 h-4" />
              </button>
            </div>

            {/* Recipient Email & PIN Lock Inputs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-xs">
              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">Target Recipient Email (Optional)</label>
                <input
                  type="email"
                  value={recipientEmailInput}
                  onChange={e => setRecipientEmailInput(e.target.value)}
                  placeholder="recipient@company.com"
                  className="w-full h-9 px-3 rounded-xl bg-[#070B14] border border-white/10 text-white text-xs placeholder-slate-600 focus:border-[#F5B700] focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[11px] text-slate-400 font-mono block mb-1">Access PIN Password (Optional)</label>
                <input
                  type="text"
                  value={passwordPin}
                  onChange={e => setPasswordPin(e.target.value)}
                  placeholder="4-digit PIN (e.g. 9876)"
                  maxLength={8}
                  className="w-full h-9 px-3 rounded-xl bg-[#070B14] border border-white/10 text-white text-xs font-mono placeholder-slate-600 focus:border-[#F5B700] focus:outline-none"
                />
              </div>
            </div>

            {/* Geo/IP Restriction Input */}
            <div className="pt-1">
              <label className="text-[11px] text-slate-400 font-mono block mb-1 flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-[#F5B700]" /> Whitelisted IP / Subnet Range (Optional)
              </label>
              <input
                type="text"
                value={allowedIpRange}
                onChange={e => setAllowedIpRange(e.target.value)}
                placeholder="e.g. 103.21.124.0/24 or leave blank for any IP"
                className="w-full h-9 px-3 rounded-xl bg-[#070B14] border border-white/10 text-white text-xs font-mono placeholder-slate-600 focus:border-[#F5B700] focus:outline-none"
              />
            </div>

            {/* Generate & Record Share Link Action Button */}
            <div className="pt-2">
              <button
                onClick={handleCreateNewShare}
                className="btn-gold w-full !h-11 font-extrabold flex items-center justify-center gap-2 shadow-xl"
              >
                <Share2 className="w-4 h-4" /> Issue & Record Secure Share Link
              </button>
            </div>
          </div>

        </div>
      </div>

      {/* ── BOTTOM SECTION: SHARED RECIPIENTS & VIEWER AUDIT LOG ROSTER ──────── */}
      <div className="glass-card p-6 rounded-3xl space-y-4 border border-white/10">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-4">
          <div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-[#F5B700]" /> Active Shared Access Roster & Viewer Audit Log
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Monitor real-time recipient activity, track viewer IP addresses, and revoke access instantly
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-[#F5B700] bg-[#F5B700]/10 px-3 py-1 rounded-xl border border-[#F5B700]/20 font-bold">
              {sharedRecords.filter(r => r.status === 'ACTIVE').length} Active Links
            </span>
          </div>
        </div>

        {/* Shared Records Table / Responsive Cards */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px] text-xs font-mono">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3">Recipient / Link ID</th>
                <th className="py-3 px-3">Access Tier</th>
                <th className="py-3 px-3">Issued / Expiry</th>
                <th className="py-3 px-3">Views</th>
                <th className="py-3 px-3">Last Viewer IP</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3 text-right">Instant Revoke Control</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {sharedRecords.map(record => (
                <tr key={record.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="py-3 px-3 font-bold text-white">
                    <div>{record.recipientEmail}</div>
                    <div className="text-[10px] text-slate-500">{record.linkToken}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                      record.accessTier === 'VIEW_ONLY' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' :
                      record.accessTier === 'READ_DOWNLOAD' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' :
                      'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                    }`}>
                      {record.accessTier}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <div>{record.createdAt}</div>
                    <div className="text-[10px] text-slate-500">{record.expiresAt}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className="font-bold text-white">{record.viewCount} views</span>
                  </td>
                  <td className="py-3 px-3 text-slate-300">
                    <div>{record.lastViewedIp}</div>
                    <div className="text-[10px] text-slate-500">{record.lastViewedLocation}</div>
                  </td>
                  <td className="py-3 px-3">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold flex items-center gap-1 w-max ${
                      record.status === 'ACTIVE' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                      record.status === 'EXPIRED' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                      'bg-red-500/15 text-red-400 border border-red-500/30'
                    }`}>
                      {record.status === 'ACTIVE' ? <Check className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
                      {record.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {record.status === 'EXPIRED' && (
                        <button
                          onClick={() => extendExpiry(record.id)}
                          className="px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 transition text-[11px] font-bold flex items-center gap-1"
                        >
                          <RefreshCw className="w-3 h-3" /> Extend +24h
                        </button>
                      )}

                      <button
                        onClick={() => toggleRevoke(record.id)}
                        className={`px-3 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1 ${
                          record.status === 'REVOKED'
                            ? 'bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30'
                            : 'bg-red-500/15 text-red-400 hover:bg-red-500/25 border border-red-500/30'
                        }`}
                      >
                        {record.status === 'REVOKED' ? (
                          <> <Check className="w-3.5 h-3.5" /> Re-Activate </>
                        ) : (
                          <> <Ban className="w-3.5 h-3.5" /> Revoke Access </>
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
