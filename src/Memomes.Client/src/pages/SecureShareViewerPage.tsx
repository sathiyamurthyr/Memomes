import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Lock, Download, AlertTriangle, RefreshCw, X,
  ShieldAlert, Clock, Flame, Eye, ZapOff, Scan
} from 'lucide-react';
import { ShareCrypto, type ShareParams } from '../utils/shareCrypto';
import { LocalVaultDb, type VaultFile } from '../utils/localVaultDb';

/* ─── helpers ─── */
const fmt = (s: number) =>
  s > 3600 ? `${Math.ceil(s / 3600)}h` : s > 60 ? `${Math.ceil(s / 60)}m ${s % 60}s` : `${s}s`;

/* ─── Mesh Grid Background ─── */
const MeshBg: React.FC = () => (
  <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
    {/* Radial gradient orbs */}
    <div style={{
      position: 'absolute', top: '-15%', left: '-10%',
      width: '55vw', height: '55vw', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(192,20,63,0.14) 0%, transparent 65%)',
      filter: 'blur(48px)'
    }} />
    <div style={{
      position: 'absolute', bottom: '-20%', right: '-10%',
      width: '50vw', height: '50vw', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(59,139,235,0.10) 0%, transparent 65%)',
      filter: 'blur(48px)'
    }} />
    <div style={{
      position: 'absolute', top: '40%', left: '50%', transform: 'translate(-50%,-50%)',
      width: '40vw', height: '40vw', borderRadius: '50%',
      background: 'radial-gradient(circle, rgba(255,212,71,0.05) 0%, transparent 65%)',
      filter: 'blur(60px)'
    }} />
    {/* Subtle grid */}
    <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.025 }}>
      <defs>
        <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255,255,255,0.8)" strokeWidth="0.5" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#grid)" />
    </svg>
  </div>
);

/* ─── Security Indicator Dot ─── */
const SecDot: React.FC<{ color?: string }> = ({ color = '#10B981' }) => (
  <span style={{
    display: 'inline-block', width: 7, height: 7, borderRadius: '50%',
    backgroundColor: color,
    boxShadow: `0 0 8px ${color}88, 0 0 16px ${color}44`,
    flexShrink: 0
  }} />
);

/* ─── Countdown Ring ─── */
const CountdownRing: React.FC<{ value: number; max: number; size?: number }> = ({ value, max, size = 56 }) => {
  const r = (size - 6) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, value / max);
  const dash = pct * circ;
  const isUrgent = value < 15;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)', flexShrink: 0 }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3}
        stroke="rgba(255,255,255,0.05)" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={3}
        stroke={isUrgent ? '#F87171' : '#FFD447'}
        strokeDasharray={`${dash} ${circ - dash}`}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${isUrgent ? '#F87171' : '#FFD447'}66)`, transition: 'stroke-dasharray 0.9s ease' }}
      />
    </svg>
  );
};

/* ─── Main Component ─── */
export const SecureShareViewerPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [initialTime, setInitialTime] = useState(60);
  const [timeLeft, setTimeLeft] = useState(60);
  const [isExpired, setIsExpired] = useState(false);
  const [isTampered, setIsTampered] = useState(false);
  const [isAlreadyBurned, setIsAlreadyBurned] = useState(false);
  const [isScreenHidden, setIsScreenHidden] = useState(false);
  const [decryptedParams, setDecryptedParams] = useState<ShareParams | null>(null);
  const [targetFile, setTargetFile] = useState<VaultFile | null>(null);
  const [pwError, setPwError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const params = new URLSearchParams(window.location.search);
  const p = params.get('p') || '';
  const pathParts = window.location.pathname.split('/');
  const shareId = pathParts[pathParts.length - 1] || 'demo-share-id';

  /* Step 1 – decrypt & validate link */
  useEffect(() => {
    const init = async () => {
      if (!p) { setIsTampered(true); return; }
      const dp = await ShareCrypto.decryptParams(shareId, p);
      if (!dp) { setIsTampered(true); return; }
      setDecryptedParams(dp);
      if (dp.oneTime && localStorage.getItem(`burned_${shareId}`) === '1') {
        setIsAlreadyBurned(true);
      }
      const t = dp.expiry === '60s' ? 60 : dp.expiry === '1h' ? 3600 : 86400;
      setTimeLeft(t);
      setInitialTime(t);
    };
    init();
  }, [shareId, p]);

  /* Step 2 – get local file */
  useEffect(() => {
    const f = LocalVaultDb.getFile(shareId);
    if (f) setTargetFile(f);
  }, [shareId]);

  /* Step 3 – countdown */
  useEffect(() => {
    if (!isUnlocked || isExpired || isAlreadyBurned || isTampered) return;
    const id = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(id); setIsExpired(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [isUnlocked, isExpired, isAlreadyBurned, isTampered]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyBurned) return;
    if (!password.trim()) { setPwError(true); return; }
    setIsUnlocked(true);
    setPwError(false);
    if (decryptedParams?.oneTime) localStorage.setItem(`burned_${shareId}`, '1');
  };

  /* Security event hooks */
  useEffect(() => {
    const isViewOnly = decryptedParams?.tier === 'VIEW_ONLY';
    if (!isViewOnly || !isUnlocked || isExpired || isAlreadyBurned) return;

    const block = (e: Event) => e.preventDefault();

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F12') return e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && ['I','J','C','i','j','c'].includes(e.key)) return e.preventDefault();
      if ((e.ctrlKey || e.metaKey) && ['u','U','p','P','s','S'].includes(e.key)) return e.preventDefault();
      if (e.key === 'PrintScreen' || e.key === 'Snapshot' || e.keyCode === 44) {
        e.preventDefault();
        setIsScreenHidden(true);
        navigator.clipboard.writeText('🔒 Memomes – Screen capture is blocked on this page.').catch(() => {});
        setTimeout(() => setIsScreenHidden(false), 3500);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || e.key === 'Snapshot' || e.keyCode === 44) {
        e.preventDefault();
        setIsScreenHidden(true);
        navigator.clipboard.writeText('🔒 Memomes – Screen capture is blocked on this page.').catch(() => {});
        setTimeout(() => setIsScreenHidden(false), 3500);
      }
    };

    const hide = () => setIsScreenHidden(true);
    const show = () => setIsScreenHidden(false);

    const style = document.createElement('style');
    style.id = 'memomes-print-shield';
    style.textContent = `@media print { body, html { display: none !important; visibility: hidden !important; } }`;
    document.head.appendChild(style);

    document.addEventListener('contextmenu', block);
    document.addEventListener('copy', block);
    document.addEventListener('selectstart', block);
    document.addEventListener('dragstart', block);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', hide);
    window.addEventListener('focus', show);
    document.addEventListener('mouseleave', hide);
    document.addEventListener('mouseenter', show);
    document.addEventListener('visibilitychange', () => document.hidden ? hide() : show());

    return () => {
      document.removeEventListener('contextmenu', block);
      document.removeEventListener('copy', block);
      document.removeEventListener('selectstart', block);
      document.removeEventListener('dragstart', block);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', hide);
      window.removeEventListener('focus', show);
      document.removeEventListener('mouseleave', hide);
      document.removeEventListener('mouseenter', show);
      document.getElementById('memomes-print-shield')?.remove();
    };
  }, [decryptedParams, isUnlocked, isExpired, isAlreadyBurned]);

  /* Watermark renderer */
  const renderWatermark = () => {
    if (!decryptedParams?.watermark) return null;
    const { text, font, density, rotation } = decryptedParams.watermark;
    const count = density === 'low' ? 4 : density === 'high' ? 16 : 9;
    const cols = density === 'low' ? 2 : density === 'high' ? 4 : 3;
    const fontMap: Record<string, string> = { mono: '"JetBrains Mono", monospace', sans: 'Inter, sans-serif', serif: 'Georgia, serif' };
    return (
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none',
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${Math.ceil(count / cols)}, 1fr)`,
        zIndex: 20, opacity: 0.07
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transform: `rotate(${rotation}deg)`,
            fontFamily: fontMap[font] || fontMap.mono,
            fontSize: 11, fontWeight: 700, color: 'white',
            textAlign: 'center', lineHeight: 1.4
          }}>
            {text}<br />
            <span style={{ fontSize: 9, opacity: 0.8 }}>{new Date().toLocaleDateString()}</span>
          </div>
        ))}
      </div>
    );
  };

  const displayUrl = targetFile ? targetFile.dataUrl : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=1200&auto=format&fit=crop&q=80';
  const displayName = targetFile ? targetFile.name : 'Confidential_Document.png';
  const displayMime = targetFile ? targetFile.type : 'image/png';
  const isViewOnly = decryptedParams?.tier === 'VIEW_ONLY';
  const tierLabel = decryptedParams?.tier === 'VIEW_ONLY' ? 'View Only' : decryptedParams?.tier === 'READ_DOWNLOAD' ? 'Download' : 'Full Control';
  const tierColor = decryptedParams?.tier === 'VIEW_ONLY' ? '#FFD447' : decryptedParams?.tier === 'READ_DOWNLOAD' ? '#3B8BEB' : '#10B981';

  /* ─── State: Tampered ─── */
  if (isTampered) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080C14' }}>
      <MeshBg />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 420,
        background: 'rgba(11,15,28,0.92)', backdropFilter: 'blur(32px)',
        border: '1px solid rgba(239,68,68,0.25)', borderRadius: 24,
        padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(239,68,68,0.08)'
      }} className="animate-float-up">
        {/* Icon */}
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
          border: '1px solid rgba(239,68,68,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(239,68,68,0.2)'
        }}>
          <ShieldAlert style={{ width: 32, height: 32, color: '#F87171' }} />
        </div>
        <div className="chip chip-red" style={{ margin: '0 auto 16px', width: 'fit-content' }}>
          SECURITY VIOLATION
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F3F5FA', margin: '0 0 12px' }}>
          Link Integrity Failed
        </h1>
        <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7, margin: 0 }}>
          The cryptographic signature of this share link could not be verified.
          The URL may have been tampered with or the link is invalid.
        </p>
        <div style={{
          marginTop: 28, padding: '14px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#4B5670', textAlign: 'left'
        }}>
          AES-GCM-256 decryption returned NULL<br />
          Share ID: {shareId.slice(0, 16)}...
        </div>
      </div>
    </div>
  );

  /* ─── State: Burned ─── */
  if (!isTampered && isAlreadyBurned) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080C14' }}>
      <MeshBg />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 420,
        background: 'rgba(11,15,28,0.92)', backdropFilter: 'blur(32px)',
        border: '1px solid rgba(251,146,60,0.25)', borderRadius: 24,
        padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(251,146,60,0.06)'
      }} className="animate-float-up">
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'radial-gradient(circle, rgba(251,146,60,0.12) 0%, transparent 70%)',
          border: '1px solid rgba(251,146,60,0.35)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(251,146,60,0.2)'
        }}>
          <Flame style={{ width: 32, height: 32, color: '#FB923C' }} />
        </div>
        <div className="chip chip-orange" style={{ margin: '0 auto 16px', width: 'fit-content' }}>
          SELF-DESTRUCTED
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: '#F3F5FA', margin: '0 0 12px' }}>
          Link Has Self-Destructed
        </h1>
        <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7, margin: 0 }}>
          This was a one-time view link. It has already been opened and the decryption keys have been permanently purged from all caches.
        </p>
        <div style={{
          marginTop: 28, padding: '14px 16px', borderRadius: 12,
          background: 'rgba(251,146,60,0.04)', border: '1px solid rgba(251,146,60,0.12)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 10, color: '#4B5670', textAlign: 'left'
        }}>
          BURN-ON-READ policy enforced<br />
          localStorage key: burned_{shareId.slice(0, 12)}...
        </div>
      </div>
    </div>
  );

  /* ─── State: Unlock Form ─── */
  if (!isTampered && !isAlreadyBurned && !isUnlocked && decryptedParams) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080C14' }}>
      <MeshBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 460 }} className="animate-float-up">
        {/* Top brand strip */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 24, userSelect: 'none'
        }}>
          <div style={{
            width: 32, height: 32, borderRadius: 10,
            background: 'linear-gradient(135deg, #C0143F, #850E2A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(192,20,63,0.4)'
          }}>
            <ShieldCheck style={{ width: 18, height: 18, color: '#FFD447' }} />
          </div>
          <span style={{ fontSize: 16, fontWeight: 800, color: '#F3F5FA', letterSpacing: '-0.03em' }}>
            memo<span style={{ color: '#C0143F' }}>mes</span>
          </span>
          <span style={{ fontSize: 10, color: '#4B5670', fontFamily: '"JetBrains Mono", monospace' }}>
            · Secure Share
          </span>
        </div>

        {/* Card */}
        <div style={{
          background: 'rgba(11,15,28,0.92)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(30,37,53,0.9)', borderRadius: 24,
          padding: '36px 32px', boxShadow: '0 32px 80px rgba(0,0,0,0.55), 0 0 0 1px rgba(255,255,255,0.025)'
        }}>
          {/* Header */}
          <div style={{ textAlign: 'center', marginBottom: 28 }}>
            <div style={{
              width: 64, height: 64, borderRadius: '50%', margin: '0 auto 16px',
              background: 'radial-gradient(circle, rgba(255,212,71,0.1) 0%, transparent 70%)',
              border: '1px solid rgba(255,212,71,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 0 30px rgba(255,212,71,0.15)'
            }} className="animate-gold-glow">
              <Lock style={{ width: 28, height: 28, color: '#FFD447' }} />
            </div>
            <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F3F5FA', margin: '0 0 6px', letterSpacing: '-0.02em' }}>
              Enter Decryption Key
            </h1>
            <p style={{ fontSize: 12, color: '#8892A4', fontFamily: '"JetBrains Mono", monospace', margin: 0 }}>
              Share ID: {shareId.slice(0, 8)}···{shareId.slice(-6)}
            </p>
          </div>

          {/* Access policy summary */}
          <div style={{
            background: 'rgba(13,17,32,0.7)', border: '1px solid #1E2535',
            borderRadius: 14, padding: '16px 18px', marginBottom: 22,
            display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 24px'
          }}>
            {[
              { label: 'Access Tier', value: tierLabel, color: tierColor },
              { label: 'Expiry Policy', value: decryptedParams.expiry, color: '#F3F5FA' },
              {
                label: 'Burn Policy',
                value: decryptedParams.oneTime ? 'Burn on Read' : 'Multi-View',
                color: decryptedParams.oneTime ? '#FB923C' : '#8892A4'
              },
              {
                label: 'Encryption',
                value: 'AES-GCM-256',
                color: '#34D399'
              }
            ].map(({ label, value, color }) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: '#4B5670', fontWeight: 600, marginBottom: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                  {label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 700, color, fontFamily: '"JetBrains Mono", monospace' }}>
                  {value}
                </div>
              </div>
            ))}
          </div>

          {/* Password form */}
          <form onSubmit={handleUnlock} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div>
              <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: '#8892A4', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Decryption Password / PIN
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  ref={inputRef}
                  type="password"
                  value={password}
                  onChange={e => { setPassword(e.target.value); setPwError(false); }}
                  placeholder="Enter the password shared by the owner…"
                  autoFocus
                  style={{
                    width: '100%', background: 'rgba(13,17,32,0.8)',
                    border: `1px solid ${pwError ? 'rgba(239,68,68,0.5)' : '#1E2535'}`,
                    borderRadius: 12, padding: '12px 16px',
                    color: '#F3F5FA', fontSize: 13,
                    fontFamily: '"JetBrains Mono", monospace',
                    transition: 'border-color 0.2s, box-shadow 0.2s',
                    boxSizing: 'border-box'
                  }}
                />
                {pwError && (
                  <p style={{ fontSize: 11, color: '#F87171', marginTop: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                    <AlertTriangle style={{ width: 12, height: 12 }} /> Please enter the decryption password.
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              style={{
                width: '100%', padding: '14px 20px',
                background: 'linear-gradient(135deg, #C0143F 0%, #9A1030 100%)',
                color: 'white', border: 'none', borderRadius: 12,
                fontSize: 13, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                boxShadow: '0 0 30px rgba(192,20,63,0.3), 0 4px 20px rgba(0,0,0,0.3)',
                transition: 'transform 0.15s, box-shadow 0.15s'
              }}
              onMouseOver={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 0 40px rgba(192,20,63,0.45), 0 8px 28px rgba(0,0,0,0.3)'; }}
              onMouseOut={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 0 30px rgba(192,20,63,0.3), 0 4px 20px rgba(0,0,0,0.3)'; }}
            >
              <RefreshCw style={{ width: 16, height: 16, color: '#FFD447' }} />
              Decrypt & Open Secure Payload
            </button>
          </form>

          {/* Security footer */}
          <div style={{
            marginTop: 20, paddingTop: 16, borderTop: '1px solid #1E2535',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
            fontSize: 10, color: '#4B5670', fontFamily: '"JetBrains Mono", monospace'
          }}>
            <SecDot color="#10B981" />
            Zero-Knowledge · End-to-End Encrypted · Tamper-Proof
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── State: Unlocked Viewer ─── */
  if (!isTampered && !isAlreadyBurned && isUnlocked && decryptedParams) return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4" style={{ background: '#080C14', minHeight: '100vh' }}>
      <MeshBg />
      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 880 }} className="animate-float-up">

        {/* ── Header ── */}
        <div style={{
          background: 'rgba(11,15,28,0.92)', backdropFilter: 'blur(32px)',
          border: '1px solid #1E2535', borderRadius: '20px 20px 0 0',
          padding: '16px 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16
        }}>
          {/* File info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: 'linear-gradient(135deg, rgba(192,20,63,0.2), rgba(192,20,63,0.05))',
              border: '1px solid rgba(192,20,63,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <Eye style={{ width: 18, height: 18, color: '#C0143F' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: '#F3F5FA', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: 300 }}>
                {displayName}
              </div>
              <div style={{ fontSize: 10, color: '#4B5670', fontFamily: '"JetBrains Mono", monospace', display: 'flex', alignItems: 'center', gap: 6 }}>
                <SecDot color="#10B981" />
                {displayMime} · Decrypted in RAM
              </div>
            </div>
          </div>

          {/* Right: badges + timer */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <div className="chip" style={{
              background: `${tierColor}12`, border: `1px solid ${tierColor}40`, color: tierColor
            }}>
              {tierLabel}
            </div>

            {decryptedParams.oneTime && (
              <div className="chip chip-orange">
                <Flame style={{ width: 9, height: 9 }} /> 1-TIME
              </div>
            )}

            {/* Countdown */}
            {decryptedParams.expiry !== '7d' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                background: timeLeft < 15 ? 'rgba(239,68,68,0.07)' : 'rgba(255,212,71,0.06)',
                border: `1px solid ${timeLeft < 15 ? 'rgba(239,68,68,0.3)' : 'rgba(255,212,71,0.25)'}`,
                borderRadius: 99, padding: '6px 12px 6px 6px'
              }}>
                <CountdownRing value={timeLeft} max={initialTime} size={32} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: timeLeft < 15 ? '#F87171' : '#FFD447', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1 }}>
                    {fmt(timeLeft)}
                  </div>
                  <div style={{ fontSize: 9, color: '#4B5670', lineHeight: 1, marginTop: 2 }}>
                    self-destruct
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Media Viewport ── */}
        <div style={{
          background: '#060910', border: '1px solid #1E2535', borderTop: 'none',
          position: 'relative', overflow: 'hidden', minHeight: 420,
          display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>

          {/* Screen Capture Shield */}
          {isScreenHidden && (
            <div style={{
              position: 'absolute', inset: 0, zIndex: 50,
              background: '#060910',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 16
            }} className="scan-overlay">
              <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(192,20,63,0.15) 0%, transparent 70%)',
                border: '2px solid rgba(192,20,63,0.5)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 40px rgba(192,20,63,0.3)'
              }} className="animate-pulse-glow">
                <Scan style={{ width: 36, height: 36, color: '#C0143F' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 16, fontWeight: 800, color: '#F3F5FA', marginBottom: 6 }}>
                  Capture Shield Active
                </div>
                <div style={{ fontSize: 12, color: '#8892A4', fontFamily: '"JetBrains Mono", monospace', maxWidth: 360, lineHeight: 1.7 }}>
                  Screen capture, focus loss, or screenshot attempt detected.
                  Content is hidden. Return focus to resume viewing.
                </div>
                <div className="chip chip-red" style={{ margin: '12px auto 0', width: 'fit-content' }}>
                  <ZapOff style={{ width: 9, height: 9 }} /> CAPTURE BLOCKED
                </div>
              </div>
            </div>
          )}

          {/* Session Expired */}
          {isExpired && (
            <div style={{ textAlign: 'center', padding: 48, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239,68,68,0.12) 0%, transparent 70%)',
                border: '1px solid rgba(239,68,68,0.35)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 30px rgba(239,68,68,0.2)'
              }}>
                <Clock style={{ width: 32, height: 32, color: '#F87171' }} />
              </div>
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: '#F3F5FA', marginBottom: 8 }}>Session Expired</div>
                <div style={{ fontSize: 13, color: '#8892A4', fontFamily: '"JetBrains Mono", monospace', lineHeight: 1.7, maxWidth: 360 }}>
                  Presigned URL key expired. All decrypted RAM buffers have been flushed. Request a new share link from the owner.
                </div>
              </div>
            </div>
          )}

          {/* File preview */}
          {!isExpired && !isScreenHidden && (
            <div style={{ position: 'relative', maxWidth: '100%', maxHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
              <img
                src={displayUrl}
                alt="Secure Content"
                style={{
                  maxWidth: '100%', maxHeight: '60vh',
                  objectFit: 'contain', borderRadius: 12,
                  userSelect: 'none', pointerEvents: isViewOnly ? 'none' : 'auto',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                  display: 'block'
                }}
                onContextMenu={e => e.preventDefault()}
                draggable={false}
              />
              {/* Watermark */}
              {isViewOnly && <div style={{ position: 'absolute', inset: 24 }}>{renderWatermark()}</div>}
            </div>
          )}

          {/* View-Only mode indicator */}
          {isViewOnly && !isExpired && !isScreenHidden && (
            <div style={{
              position: 'absolute', bottom: 16, left: 16,
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'rgba(8,12,20,0.85)', backdropFilter: 'blur(8px)',
              border: '1px solid rgba(192,20,63,0.3)', borderRadius: 99,
              padding: '6px 12px', zIndex: 10
            }}>
              <AlertTriangle style={{ width: 12, height: 12, color: '#F87171' }} />
              <span style={{ fontSize: 10, color: '#F87171', fontFamily: '"JetBrains Mono", monospace', fontWeight: 700 }}>
                VIEW ONLY — Download & Copy Blocked
              </span>
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        <div style={{
          background: 'rgba(11,15,28,0.92)', backdropFilter: 'blur(32px)',
          border: '1px solid #1E2535', borderTop: 'none', borderRadius: '0 0 20px 20px',
          padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
        }}>
          <span style={{ fontSize: 10, color: '#2E3850', fontFamily: '"JetBrains Mono", monospace' }}>
            Zero-Knowledge Decryption Envelope v2.0 · AES-GCM-256 · Memomes Cloud
          </span>

          <div style={{ display: 'flex', gap: 8 }}>
            {!isViewOnly && !isExpired && (
              <a
                href={displayUrl}
                download={displayName}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34D399', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                  transition: 'background 0.15s'
                }}
              >
                <Download style={{ width: 13, height: 13 }} /> Download
              </a>
            )}
            <button
              onClick={() => { setIsUnlocked(false); setIsExpired(false); setPassword(''); }}
              style={{
                padding: '8px 16px', borderRadius: 10,
                background: 'rgba(30,37,53,0.5)', border: '1px solid #1E2535',
                color: '#8892A4', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'background 0.15s, color 0.15s'
              }}
            >
              <X style={{ width: 13, height: 13 }} /> Lock Viewer
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  /* ─── Loading state ─── */
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#080C14' }}>
      <MeshBg />
      <div style={{ zIndex: 1, position: 'relative', textAlign: 'center' }}>
        <div style={{
          width: 48, height: 48, borderRadius: '50%', margin: '0 auto 16px',
          border: '2px solid #1E2535', borderTopColor: '#C0143F',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 13, color: '#8892A4', fontFamily: '"JetBrains Mono", monospace' }}>
          Verifying cryptographic seal…
        </div>
      </div>
    </div>
  );
};
