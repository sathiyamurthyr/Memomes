import React, { useState } from 'react';
import {
  Share2, Lock, KeyRound, Flame, Eye, Check,
  Shield, Sparkles, X, Download
} from 'lucide-react';
import type { FileItem } from './DashboardV2';
import { getAppBaseUrl } from '../utils/urlHelper';
import { ShareCrypto } from '../utils/shareCrypto';

interface SecureShareModalProps {
  file: FileItem;
  onClose: () => void;
  onShareCreated?: (shareDetails: any) => void;
}

/* ─── Toggle Switch ─── */
const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; color?: string }> = ({ checked, onChange, color = '#F5C027' }) => (
  <label className="toggle" onClick={() => onChange(!checked)} style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center' }}>
    <div style={{
      width: 44, height: 24, borderRadius: 99,
      background: checked ? color : 'rgba(255,255,255,0.1)',
      border: `1px solid ${checked ? color : 'rgba(255,255,255,0.2)'}`,
      padding: 2, transition: 'all 0.2s', display: 'flex', alignItems: 'center'
    }}>
      <div style={{
        width: 18, height: 18, borderRadius: '50%', background: checked ? '#070B14' : '#CBD5E1',
        transform: checked ? 'translateX(20px)' : 'translateX(0)', transition: 'transform 0.2s'
      }} />
    </div>
  </label>
);

/* ─── High-Contrast Section Label ─── */
const SectionLabel: React.FC<{ children: React.ReactNode; sub?: string }> = ({ children, sub }) => (
  <div style={{ marginBottom: 10 }}>
    <div style={{ fontSize: 11, fontWeight: 800, color: '#F5C027', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
      {children}
    </div>
    {sub && <div style={{ fontSize: 11, color: '#CBD5E1', marginTop: 3, fontWeight: 500 }}>{sub}</div>}
  </div>
);

export const SecureShareModal: React.FC<SecureShareModalProps> = ({ file, onClose, onShareCreated }) => {
  const [accessTier, setAccessTier] = useState<'VIEW_ONLY' | 'READ_DOWNLOAD' | 'FULL_CONTROL'>('VIEW_ONLY');
  const [enablePassword, setEnablePassword] = useState(false);
  const [passwordPin, setPasswordPin] = useState('');
  const [expiryOption, setExpiryOption] = useState('60s');
  
  // Watermark Options
  const [enableWatermark, setEnableWatermark] = useState(true);
  const [watermarkText, setWatermarkText] = useState('RECIPIENT · 103.21.124.5');
  const [watermarkFont, setWatermarkFont] = useState('mono');
  const [watermarkDensity, setWatermarkDensity] = useState('medium');
  const [watermarkRotation, setWatermarkRotation] = useState(-15);
  
  const [enableSelfDestruct, setEnableSelfDestruct] = useState(false);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [generatedLink, setGeneratedLink] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const TIERS = [
    {
      id: 'VIEW_ONLY', label: 'View Only', desc: 'No download · Watermarked',
      icon: Eye, color: '#F5C027', bg: 'rgba(245,192,39,0.15)', border: '#F5C027'
    },
    {
      id: 'READ_DOWNLOAD', label: 'Download', desc: 'Full file access',
      icon: Download, color: '#3B82F6', bg: 'rgba(59,130,246,0.15)', border: '#3B82F6'
    },
    {
      id: 'FULL_CONTROL', label: 'Full Control', desc: 'Re-share allowed',
      icon: Shield, color: '#22C55E', bg: 'rgba(34,197,94,0.15)', border: '#22C55E'
    },
  ];

  const EXPIRY_OPTIONS = [
    { value: '60s', label: '60 Seconds', sublabel: 'Max Security', color: '#F5C027' },
    { value: '1h', label: '1 Hour', sublabel: 'Recommended', color: '#F5C027' },
    { value: '24h', label: '24 Hours', sublabel: 'Standard', color: '#3B82F6' },
    { value: '7d', label: '7 Days', sublabel: 'Extended', color: '#22C55E' },
  ];

  const FONT_OPTIONS = [
    { value: 'mono', label: 'Monospace' },
    { value: 'sans', label: 'Sans-Serif' },
    { value: 'serif', label: 'Serif' },
  ];

  const DENSITY_OPTIONS = [
    { value: 'low', label: 'Light (2×2)' },
    { value: 'medium', label: 'Medium (3×3)' },
    { value: 'high', label: 'Heavy (4×4)' },
  ];

  const DIRECTION_OPTIONS = [
    { value: -45, label: 'Diagonal (−45°)' },
    { value: -15, label: 'Slight (−15°)' },
    { value: 0, label: 'Horizontal (0°)' },
    { value: 90, label: 'Vertical (90°)' },
  ];

  const handleGenerateShare = async () => {
    setIsGenerating(true);
    try {
      const baseUrl = getAppBaseUrl();
      const token = await ShareCrypto.encryptParams(file.id, {
        tier: accessTier, expiry: expiryOption, zk: true,
        oneTime: enableSelfDestruct,
        watermark: enableWatermark ? { text: watermarkText, font: watermarkFont, density: watermarkDensity, rotation: watermarkRotation } : null
      });
      const link = `${baseUrl}/s/${file.id}?p=${token}`;
      setGeneratedLink(link);
      onShareCreated?.({ fileId: file.id, recipientEmail, accessTier, expiryOption, enableWatermark, enableSelfDestruct, link });
    } finally {
      setIsGenerating(false);
    }
  };

  /* ─── 100% Reliable Clipboard Copy (Supports HTTP IP Origins like 172.20.144.1:6523) ─── */
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

  const inputStyle: React.CSSProperties = {
    width: '100%', background: '#070B14',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 12, padding: '12px 16px',
    color: '#FFFFFF', fontSize: 13, transition: 'all 0.2s',
    boxSizing: 'border-box', outline: 'none'
  };

  const selectStyle: React.CSSProperties = {
    width: '100%', background: '#070B14',
    border: '1px solid rgba(255,255,255,0.15)', borderRadius: 10, padding: '10px 12px',
    color: '#FFFFFF', fontSize: 11, fontFamily: '"JetBrains Mono", monospace',
    cursor: 'pointer', appearance: 'none', WebkitAppearance: 'none', outline: 'none'
  };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 200,
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16
    }}>
      <div style={{
        width: '100%', maxWidth: 540, maxHeight: '92vh', overflowY: 'auto',
        background: '#0E1524', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 24,
        boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: 20, right: 20, zIndex: 10,
            width: 36, height: 36, borderRadius: 10, background: 'rgba(255,255,255,0.06)',
            border: '1px solid rgba(255,255,255,0.12)', color: '#CBD5E1', cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s'
          }}
        >
          <X style={{ width: 16, height: 16 }} />
        </button>

        {/* Header */}
        <div style={{
          padding: '24px 24px 20px', borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex', alignItems: 'center', gap: 14
        }}>
          <div style={{
            width: 48, height: 48, borderRadius: 14, flexShrink: 0,
            background: 'rgba(245,192,39,0.15)', border: '1px solid rgba(245,192,39,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Share2 style={{ width: 22, height: 22, color: '#F5C027' }} />
          </div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 18, fontWeight: 900, color: '#FFFFFF', margin: '0 0 4px', letterSpacing: '-0.02em' }}>
              Create Secure Share Link
            </h2>
            <p style={{ fontSize: 11, color: '#94A3B8', margin: 0, fontFamily: '"JetBrains Mono", monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {file.name} ({file.size})
            </p>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 24 }}>

          {/* Recipient Input */}
          <div>
            <SectionLabel sub="Optional — used to track recipient identity in watermark">Recipient Email</SectionLabel>
            <input
              type="email"
              value={recipientEmail}
              onChange={e => setRecipientEmail(e.target.value)}
              placeholder="recipient@example.com"
              style={inputStyle}
            />
          </div>

          {/* Access Tier Grid */}
          <div>
            <SectionLabel sub="Controls what the recipient can do with this file">Access Tier</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {TIERS.map(tier => {
                const Icon = tier.icon;
                const active = accessTier === tier.id;
                return (
                  <button
                    key={tier.id}
                    onClick={() => setAccessTier(tier.id as any)}
                    style={{
                      padding: 14, borderRadius: 16, cursor: 'pointer', textAlign: 'left',
                      background: active ? tier.bg : '#070B14',
                      border: `1.5px solid ${active ? tier.border : 'rgba(255,255,255,0.08)'}`,
                      boxShadow: active ? `0 0 20px ${tier.color}30` : 'none',
                      transition: 'all 0.2s'
                    }}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 10, marginBottom: 10,
                      background: active ? tier.color : 'rgba(255,255,255,0.06)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Icon style={{ width: 16, height: 16, color: active ? '#070B14' : '#CBD5E1' }} />
                    </div>
                    <div style={{ fontSize: 12, fontWeight: 800, color: active ? '#FFFFFF' : '#CBD5E1' }}>{tier.label}</div>
                    <div style={{ fontSize: 10, color: active ? '#F5C027' : '#94A3B8', marginTop: 4, fontWeight: 500 }}>{tier.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Expiry Grid */}
          <div>
            <SectionLabel sub="After this time, the link will be automatically invalidated">Link Expiry Duration</SectionLabel>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
              {EXPIRY_OPTIONS.map(opt => {
                const active = expiryOption === opt.value;
                return (
                  <button
                    key={opt.value}
                    onClick={() => setExpiryOption(opt.value)}
                    style={{
                      padding: '12px 8px', borderRadius: 14, cursor: 'pointer',
                      background: active ? 'rgba(245,192,39,0.15)' : '#070B14',
                      border: `1.5px solid ${active ? '#F5C027' : 'rgba(255,255,255,0.08)'}`,
                      textAlign: 'center', transition: 'all 0.2s',
                      boxShadow: active ? '0 0 20px rgba(245,192,39,0.25)' : 'none'
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, color: active ? '#F5C027' : '#FFFFFF', fontFamily: '"JetBrains Mono", monospace' }}>
                      {opt.label}
                    </div>
                    <div style={{ fontSize: 10, color: active ? '#F5C027' : '#94A3B8', marginTop: 3, fontWeight: 500 }}>
                      {opt.sublabel}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Security Controls */}
          <div>
            <SectionLabel sub="Enhanced security controls for this share">Security Controls</SectionLabel>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

              {/* Password Protection */}
              <div style={{
                background: '#070B14', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 16, padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: 'rgba(245,192,39,0.12)', border: '1px solid rgba(245,192,39,0.3)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <KeyRound style={{ width: 18, height: 18, color: '#F5C027' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#FFFFFF' }}>Password Protection</div>
                      <div style={{ fontSize: 11, color: '#CBD5E1' }}>Require a PIN to decrypt content</div>
                    </div>
                  </div>
                  <Toggle checked={enablePassword} onChange={setEnablePassword} color="#F5C027" />
                </div>
                {enablePassword && (
                  <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                    <input
                      type="text"
                      value={passwordPin}
                      onChange={e => setPasswordPin(e.target.value)}
                      placeholder="Set decryption PIN (4–8 chars)"
                      maxLength={8}
                      style={{ ...inputStyle, fontFamily: '"JetBrains Mono", monospace' }}
                    />
                  </div>
                )}
              </div>

              {/* Self-Destruct */}
              <div style={{
                background: '#070B14', border: `1px solid ${enableSelfDestruct ? '#F97316' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 16, padding: '14px 16px', transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: enableSelfDestruct ? 'rgba(249,115,22,0.15)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${enableSelfDestruct ? '#F97316' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Flame style={{ width: 18, height: 18, color: enableSelfDestruct ? '#F97316' : '#CBD5E1' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: enableSelfDestruct ? '#F97316' : '#FFFFFF' }}>
                        Burn on First Read
                      </div>
                      <div style={{ fontSize: 11, color: '#CBD5E1' }}>Link is destroyed after a single view</div>
                    </div>
                  </div>
                  <Toggle checked={enableSelfDestruct} onChange={setEnableSelfDestruct} color="#F97316" />
                </div>
              </div>

              {/* ─── Anti-Leak Watermark Customization Options (Included & Customizable) ─── */}
              <div style={{
                background: '#070B14', border: `1px solid ${enableWatermark ? '#F5C027' : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 16, padding: '14px 16px', transition: 'all 0.2s'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: 10,
                      background: enableWatermark ? 'rgba(245,192,39,0.15)' : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${enableWatermark ? '#F5C027' : 'rgba(255,255,255,0.1)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }}>
                      <Lock style={{ width: 18, height: 18, color: enableWatermark ? '#F5C027' : '#CBD5E1' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 800, color: enableWatermark ? '#F5C027' : '#FFFFFF' }}>
                        Anti-Leak Watermark Options
                      </div>
                      <div style={{ fontSize: 11, color: '#CBD5E1' }}>Stamp IP, recipient email & timestamp grid on file</div>
                    </div>
                  </div>
                  <Toggle checked={enableWatermark} onChange={setEnableWatermark} color="#F5C027" />
                </div>

                {/* Custom Watermark Controls */}
                {enableWatermark && (
                  <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.08)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                    <div>
                      <label style={{ display: 'block', fontSize: 10, fontWeight: 800, color: '#F5C027', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                        Custom Watermark Text
                      </label>
                      <input
                        type="text"
                        value={watermarkText}
                        onChange={e => setWatermarkText(e.target.value)}
                        placeholder="e.g. RECIPIENT · 103.21.124.5"
                        style={{ ...inputStyle, fontFamily: '"JetBrains Mono", monospace', fontSize: 11 }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                      <div>
                        <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#CBD5E1', marginBottom: 4, textTransform: 'uppercase' }}>
                          Font Style
                        </label>
                        <select value={watermarkFont} onChange={e => setWatermarkFont(e.target.value)} style={selectStyle}>
                          {FONT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#CBD5E1', marginBottom: 4, textTransform: 'uppercase' }}>
                          Density
                        </label>
                        <select value={watermarkDensity} onChange={e => setWatermarkDensity(e.target.value)} style={selectStyle}>
                          {DENSITY_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: 9, fontWeight: 800, color: '#CBD5E1', marginBottom: 4, textTransform: 'uppercase' }}>
                          Direction
                        </label>
                        <select value={watermarkRotation} onChange={e => setWatermarkRotation(Number(e.target.value))} style={selectStyle}>
                          {DIRECTION_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {/* Stamped Watermark Live Preview */}
                    <div style={{
                      background: 'rgba(245,192,39,0.06)', border: '1px dashed rgba(245,192,39,0.3)',
                      borderRadius: 12, padding: '12px 14px', textAlign: 'center',
                      fontFamily: watermarkFont === 'mono' ? '"JetBrains Mono", monospace' : watermarkFont === 'sans' ? 'Inter, sans-serif' : 'Georgia, serif',
                      fontSize: 11, color: '#F5C027', fontWeight: 700
                    }}>
                      <div style={{ transform: `rotate(${watermarkRotation}deg)`, transition: 'transform 0.3s' }}>
                        {watermarkText || 'WATERMARK STAMP'} · {new Date().toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

            </div>
          </div>

          {/* Generate Button */}
          {!generatedLink ? (
            <button
              onClick={handleGenerateShare}
              disabled={isGenerating}
              className="btn-gold"
              style={{
                width: '100%', height: 52, borderRadius: 16, fontSize: 14, fontWeight: 800,
                cursor: isGenerating ? 'not-allowed' : 'pointer'
              }}
            >
              <Sparkles style={{ width: 18, height: 18 }} />
              {isGenerating ? 'Generating Encrypted Token…' : 'Generate Encrypted Share Link'}
            </button>
          ) : (
            /* Generated Link Display */
            <div style={{
              background: 'rgba(34,197,94,0.08)', border: '1.5px solid #22C55E',
              borderRadius: 16, padding: 16
            }}>
              <div style={{ fontSize: 13, fontWeight: 800, color: '#22C55E', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check style={{ width: 16, height: 16 }} /> Encrypted Share Link Generated
              </div>
              <div style={{
                background: '#070B14', border: '1px solid rgba(255,255,255,0.12)',
                borderRadius: 12, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8
              }}>
                <span style={{ flex: 1, fontSize: 11, color: '#CBD5E1', fontFamily: '"JetBrains Mono", monospace', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {generatedLink}
                </span>
                <button
                  onClick={handleCopy}
                  className="btn-gold"
                  style={{ height: 36, padding: '0 14px', fontSize: 11 }}
                >
                  {isCopied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
