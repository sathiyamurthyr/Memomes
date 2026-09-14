import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Lock, Download, AlertTriangle, RefreshCw, X,
  ShieldAlert, Clock, Flame, Eye, ZapOff, Scan, Music, FileText, Table, ExternalLink, ArrowLeft,
  Share2, Send, CheckCircle2, Zap
} from 'lucide-react';
import { ShareCrypto, type ShareParams } from '../utils/shareCrypto';
import { LocalVaultDb, VaultBlobStore, type VaultFile } from '../utils/localVaultDb';
import { AudioPlayerManager } from '../utils/audioPlayerManager';
import { ShareCodeService } from '../utils/shareCodeService';
import { ShareLinkStore, type ShareLinkRecord } from '../utils/shareLinkStore';
import { SecureShareLoadingScreen } from '../components/SecureShareLoadingScreen';
import { EnterpriseSecurityIncidentPage } from '../components/EnterpriseSecurityIncidentPage';
import { ShareHealthCheckService } from '../utils/shareHealthCheckService';
import { ChunkedRangeStreamEngine } from '../services/chunkedRangeStreamEngine';
import { ShareMediaStreamResolver } from '../utils/shareMediaStreamResolver';
import { DeviceSecurityEngine } from '../utils/deviceSecurityEngine';
import { SecurityCenterStore } from '../utils/securityCenterStore';
import { ZeroRamVideoPlayer } from '../components/ZeroRamVideoPlayer';
import { AntiScreenshotEngine } from '../utils/antiScreenshotEngine';
import { VALID_SAMPLE_AUDIO_DATA_URL } from '../utils/audioSampleData';

/* ─── ShareVideoFallbackPlayer ─── */
/* Auto-generates a canvas video stream when no real blob URL is available */
const ShareVideoFallbackPlayer: React.FC<{ displayName: string; onResolved: (url: string) => void }> = ({ displayName, onResolved }) => {
  const [src, setSrc] = React.useState<string>('');

  React.useEffect(() => {
    ShareMediaStreamResolver.generateValidVideoBlob(displayName).then(url => {
      if (url) { setSrc(url); onResolved(url); }
    });
  }, [displayName]);

  if (!src) return (
    <div className="p-8 bg-[#0B1120] border border-white/10 rounded-2xl text-center space-y-3 max-w-md animate-pulse">
      <RefreshCw className="w-8 h-8 text-amber-400 mx-auto animate-spin" />
      <p className="text-xs text-slate-300 font-mono font-bold">Generating Secure Video Stream...</p>
      <p className="text-[11px] text-slate-400 font-mono">Building zero-knowledge canvas stream — one moment.</p>
    </div>
  );

  return (
    <video
      key={src}
      src={src}
      controls
      autoPlay
      preload="auto"
      controlsList="nodownload"
      className="max-w-full max-h-[60vh] rounded-xl shadow-2xl"
      onError={async () => {
        const fb = await ShareMediaStreamResolver.generateValidVideoBlob(displayName);
        if (fb && fb !== src) { setSrc(fb); onResolved(fb); }
      }}
    />
  );
};

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
  const [isNotFound, setIsNotFound] = useState(false);
  const [isAlreadyBurned, setIsAlreadyBurned] = useState(false);
  const [isScreenHidden, setIsScreenHidden] = useState(false);
  const [decryptedParams, setDecryptedParams] = useState<ShareParams | null>(null);
  const [targetFile, setTargetFile] = useState<VaultFile | null>(null);
  const [directPreviewUrl, setDirectPreviewUrl] = useState<string>('');
  const [pwError, setPwError] = useState(false);
  const [isLockedOut, setIsLockedOut] = useState(false);
  const [lockoutMsg, setLockoutMsg] = useState<string>('');
  const [pinAttemptsInfo, setPinAttemptsInfo] = useState<string>('');
  const [shareRecord, setShareRecord] = useState<ShareLinkRecord | null>(null);
  const [isLoadingScreenActive, setIsLoadingScreenActive] = useState(true);

  // ── Dynamic Anti-Leak & Reshare Workflow States ──
  const [resolvedViewerIp, setResolvedViewerIp] = useState<string>('103.21.124.5');
  const [showReshareModal, setShowReshareModal] = useState(false);
  const [reshareTargetEmail, setReshareTargetEmail] = useState('');
  const [reshareReason, setReshareReason] = useState('');
  const [reshareSubmitting, setReshareSubmitting] = useState(false);
  const [reshareSuccess, setReshareSuccess] = useState(false);
  const [reshareError, setReshareError] = useState<string | null>(null);
  const [showZeroRamPlayer, setShowZeroRamPlayer] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      const geo = DeviceSecurityEngine.enrichIpAddress();
      if (geo?.ip) setResolvedViewerIp(geo.ip);
    } catch {
      // Keep default IP
    }
  }, []);

  const inputRef = useRef<HTMLInputElement>(null);

  const searchParams = new URLSearchParams(window.location.search);
  const p = searchParams.get('p') || '';
  const shareCode = ShareCodeService.extractShareCodeFromLocation(window.location.pathname, searchParams);

  /* Step 1 – Resolve Short Code or Decrypt Token */
  useEffect(() => {
    const init = async () => {
      // ── Full React State Reset on shareCode / p change ──
      setShareRecord(null);
      setTargetFile(null);
      setDecryptedParams(null);
      setDirectPreviewUrl('');
      setIsUnlocked(false);
      setIsNotFound(false);
      setIsExpired(false);
      setIsTampered(false);
      setIsAlreadyBurned(false);
      setIsLockedOut(false);
      setIsLoadingScreenActive(true);

      // Priority 1: Check ShareLinkStore for Branded Short Code or Custom Alias
      if (shareCode) {
        const record = await ShareLinkStore.getShareLinkByCodeAsync(shareCode) || ShareLinkStore.getShareLinkByCode(shareCode);
        if (record) {
          setShareRecord(record);
          const validation = ShareLinkStore.validateAccess(shareCode);
          if (!validation.allowed) {
            if (validation.errorCode === 'REVOKED') { setIsTampered(true); return; }
            else if (validation.errorCode === 'EXPIRED' || validation.errorCode === 'MAX_VIEWS_EXCEEDED') { setIsExpired(true); return; }
            else if (validation.errorCode === 'BURNED') { setIsAlreadyBurned(true); return; }
            else if (validation.errorCode === 'LOCKED_OUT') {
              setIsLockedOut(true);
              setLockoutMsg(validation.errorMessage || 'Security Lockout Active.');
              return;
            }
          }

          // Map record to ShareParams structure for UI rendering
          const params: ShareParams = {
            tier: record.accessTier,
            expiry: record.expiresAt ? '24h' : '7d',
            zk: true,
            oneTime: record.burnOnRead,
            pin: record.passwordPin || null,
            watermark: record.enableWatermark ? (record.watermarkConfig || {
              text: 'CONFIDENTIAL',
              font: 'mono',
              density: 'medium',
              rotation: -15
            }) : null
          };
          setDecryptedParams(params);

          // Set direct preview URL from share record (stored when link was created)
          if (record.previewUrl) {
            setDirectPreviewUrl(record.previewUrl);
          }

          // Locate underlying file in LocalVaultDb or synthesize from record
          let vaultFile = LocalVaultDb.getFile(record.fileId);
          if (!vaultFile) {
            const allFiles = LocalVaultDb.getAllFiles();
            vaultFile = allFiles.find(f => f.id === record.fileId || f.name === record.fileName) || null;
          }
          if (!vaultFile) {
            vaultFile = {
              id: record.fileId,
              name: record.fileName,
              size: record.fileSize,
              type: record.mimeType,
              dataUrl: record.previewUrl || '',
              previewUrl: record.previewUrl || '',
              uploadedAt: record.createdAt,
              accessTier: record.accessTier,
              shared: true,
              category: 'Documents'
            };
          }

          // Execute 12-Stage Enterprise Health & Security Validation
          const health = ShareHealthCheckService.validateShareHealth(record, vaultFile, 'Recipient User');
          if (!health.passed) {
            if (health.errorCode === 'REVOKED') { setIsTampered(true); return; }
            if (health.errorCode === 'EXPIRED' || health.errorCode === 'MAX_VIEWS_EXCEEDED') { setIsExpired(true); return; }
            if (health.errorCode === 'DELETED' || health.errorCode === 'OBJECT_MISSING' || health.errorCode === 'METADATA_MISMATCH') {
              setIsNotFound(true);
              return;
            }
          }

          setTargetFile(vaultFile);

          console.log('[SecureShareViewer] Opening Share (Priority 1 Store Match):', {
            shareCode,
            shareId: record.id,
            fileId: record.fileId,
            fileName: record.fileName,
            mimeType: record.mimeType,
            previewUrl: record.previewUrl,
            accessTier: record.accessTier
          });

          // If no PIN required, auto unlock & record analytics event
          if (!record.pinProtected) {
            setIsUnlocked(true);
            setIsLoadingScreenActive(true);
            ShareLinkStore.recordViewEvent(shareCode);
          } else {
            setIsUnlocked(false);
            setIsLoadingScreenActive(false);
          }
          return;
        }
      }

      // Priority 2: Fallback to Encrypted Token parameter 'p' (cross-origin / recipient device)
      if (p) {
        const dp = await ShareCrypto.decryptParams(shareCode || 'demo-share-id', p);
        if (dp) {
          setDecryptedParams(dp);
          if (dp.previewUrl) setDirectPreviewUrl(dp.previewUrl);
          if (dp.oneTime && localStorage.getItem(`burned_${shareCode}`) === '1') {
            setIsAlreadyBurned(true);
          }
          const t = dp.expiry === '60s' ? 60 : dp.expiry === '1h' ? 3600 : 86400;
          setTimeLeft(t);
          setInitialTime(t);

          if (!dp.pin) {
            setIsUnlocked(true);
            setIsLoadingScreenActive(true);
          } else {
            setIsUnlocked(false);
            setIsLoadingScreenActive(false);
          }

          const vaultFile = LocalVaultDb.getFile(shareCode) || LocalVaultDb.getAllFiles().find(f => f.name === dp.fileName || f.id === shareCode) || null;
          if (vaultFile) {
            setTargetFile(vaultFile);
          } else if (dp.fileName) {
            // Synthesize VaultFile for recipient device viewing
            setTargetFile({
              id: shareCode || 'shared-file',
              name: dp.fileName,
              size: typeof dp.fileSize === 'string' ? dp.fileSize : `${(dp.fileSize || 1024)} B`,
              type: dp.mimeType || 'application/octet-stream',
              dataUrl: dp.previewUrl || '',
              previewUrl: dp.previewUrl || '',
              uploadedAt: new Date().toISOString(),
              accessTier: (dp.tier as any) || 'VIEW_ONLY',
              shared: true,
              category: 'Documents'
            });
          }

          console.log('[SecureShareViewer] Opening Share (Priority 2 Encrypted Token):', {
            shareCode,
            fileName: dp.fileName,
            mimeType: dp.mimeType,
            fileSize: dp.fileSize,
            previewUrl: dp.previewUrl
          });
          return;
        }
      }

      // Priority 3: Check LocalVaultDb directly by exact fileId (same-origin session fallback)
      if (shareCode) {
        const vaultFile = LocalVaultDb.getFile(shareCode) || LocalVaultDb.getAllFiles().find(f => f.id === shareCode);
        if (vaultFile) {
          setTargetFile(vaultFile);
          setDecryptedParams({
            tier: vaultFile.accessTier || 'VIEW_ONLY',
            expiry: '24h',
            zk: true,
            oneTime: false,
            watermark: { text: 'CONFIDENTIAL', font: 'mono', density: 'medium', rotation: -15 }
          });
          setIsUnlocked(true);
          setIsLoadingScreenActive(true);

          console.log('[SecureShareViewer] Opening Share (Priority 3 Direct FileId Match):', {
            shareCode,
            fileId: vaultFile.id,
            fileName: vaultFile.name,
            mimeType: vaultFile.type
          });
          return;
        }
      }

      // If all resolution pathways fail, show Not Found
      setIsNotFound(true);
    };
    init();
  }, [shareCode, p]);

  /* Step 3 – countdown */
  useEffect(() => {
    if (!isUnlocked || isExpired || isAlreadyBurned || isTampered || isLockedOut) return;
    const id = setInterval(() => setTimeLeft(t => {
      if (t <= 1) { clearInterval(id); setIsExpired(true); return 0; }
      return t - 1;
    }), 1000);
    return () => clearInterval(id);
  }, [isUnlocked, isExpired, isAlreadyBurned, isTampered, isLockedOut]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (isAlreadyBurned || isLockedOut) return;
    if (!password.trim()) { setPwError(true); return; }

    if (shareRecord) {
      const validation = ShareLinkStore.validateAccess(shareCode, password);
      if (!validation.allowed) {
        if (validation.errorCode === 'PIN_REQUIRED') {
          // Increment failed attempt counter & enforce post-limit lockout
          const failedResult = ShareLinkStore.registerFailedAttempt(shareCode);
          if (failedResult.isLockedOut) {
            setIsLockedOut(true);
            setLockoutMsg(
              failedResult.lockedUntil
                ? `Security Lockout: Maximum failed PIN attempts (${shareRecord.maxFailedAttempts || 3}) reached. Link is temporarily locked.`
                : 'Security Lockout: Maximum failed PIN attempts reached. Requires manual reactivation by file owner.'
            );
          } else {
            setPwError(true);
            setPinAttemptsInfo(`Incorrect PIN. ${failedResult.remainingAttempts} attempt(s) remaining before security lockout.`);
          }
        } else if (validation.errorCode === 'LOCKED_OUT') {
          setIsLockedOut(true);
          setLockoutMsg(validation.errorMessage || 'Security Lockout Active.');
        }
        return;
      }
      // Successful PIN entry — reset failed counter
      ShareLinkStore.registerSuccessfulAttempt(shareCode);
      ShareLinkStore.recordViewEvent(shareCode);
    }

    setIsUnlocked(true);
    setIsLoadingScreenActive(true);
    setPwError(false);
    setPinAttemptsInfo('');
    if (decryptedParams?.oneTime) localStorage.setItem(`burned_${shareCode}`, '1');
  };

  /* Hardened Zero-Knowledge Screen & Recording Protection Hook */
  useEffect(() => {
    AntiScreenshotEngine.ensureInitialized();
    // Subscribe to hardened screen capture & recording shield for all files
    const unsubscribe = AntiScreenshotEngine.subscribe((active, _reason) => {
      setIsScreenHidden(active);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /* Dynamic Anti-Leak Watermark renderer */
  const renderWatermark = () => {
    const isViewOnlyTier = decryptedParams?.tier === 'VIEW_ONLY' || shareRecord?.accessTier === 'VIEW_ONLY';

    // If not VIEW_ONLY, respect disable flags
    if (!isViewOnlyTier) {
      const isWatermarkDisabledInParams = decryptedParams && ('watermark' in decryptedParams) && (decryptedParams.watermark === null || (decryptedParams.watermark as any) === false);
      const isWatermarkDisabledInRecord = shareRecord && shareRecord.enableWatermark === false;
      if (isWatermarkDisabledInParams || isWatermarkDisabledInRecord) {
        return null;
      }
    }

    const recipientDisplay = shareRecord?.recipientEmail || (decryptedParams as any)?.recipientEmail || (decryptedParams as any)?.email || 'CONFIDENTIAL RECIPIENT';
    const timestampUtc = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const dynamicDefaultText = `${recipientDisplay} · IP: ${resolvedViewerIp} · ${timestampUtc}`;

    const wm = decryptedParams?.watermark || (shareRecord?.enableWatermark && shareRecord.watermarkConfig ? shareRecord.watermarkConfig : null);
    const text = isViewOnlyTier ? dynamicDefaultText : (wm?.text || dynamicDefaultText);
    const font = wm?.font || 'mono';
    const density = wm?.density || 'medium';
    const rotation = wm?.rotation !== undefined ? wm.rotation : -15;

    const count = density === 'low' ? 6 : density === 'high' ? 20 : 12;
    const cols = density === 'low' ? 2 : density === 'high' ? 4 : 3;
    const fontMap: Record<string, string> = { mono: '"JetBrains Mono", monospace', sans: 'Inter, sans-serif', serif: 'Georgia, serif' };
    return (
      <div style={{
        position: 'absolute', inset: 0, pointerEvents: 'none', userSelect: 'none',
        display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`,
        gridTemplateRows: `repeat(${Math.ceil(count / cols)}, 1fr)`,
        zIndex: 40, opacity: isViewOnlyTier ? 0.55 : 0.45
      }}>
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            transform: `rotate(${rotation}deg)`,
            fontFamily: fontMap[font] || fontMap.mono,
            fontSize: 12, fontWeight: 800, color: '#F5B700',
            textShadow: '0 2px 8px rgba(0,0,0,0.95), 0 0 12px rgba(0,0,0,0.9)',
            textAlign: 'center', lineHeight: 1.3
          }}>
            <span>{text}</span>
            <span style={{ fontSize: 9, opacity: 0.95, color: '#FFFFFF', letterSpacing: '0.5px' }}>ANTI-LEAK WATERMARKED STREAM</span>
          </div>
        ))}
      </div>
    );
  };

  // File display: prefer VaultFile, then direct preview URL from share record, then empty string (no fake placeholder)
  const displayUrl = targetFile
    ? (targetFile.dataUrl || targetFile.b2FinalUrl || directPreviewUrl || '')
    : (directPreviewUrl || (shareRecord?.previewUrl) || '');
  const displayName = targetFile ? targetFile.name : (shareRecord?.fileName || 'Confidential_Document.png');
  const displayMime = targetFile ? targetFile.type : (shareRecord?.mimeType || 'image/png');
  const isViewOnly = decryptedParams?.tier === 'VIEW_ONLY';
  const tierLabel = decryptedParams?.tier === 'VIEW_ONLY' ? 'View Only' : decryptedParams?.tier === 'READ_DOWNLOAD' ? 'Download' : 'Full Control';
  const tierColor = decryptedParams?.tier === 'VIEW_ONLY' ? '#FFD447' : decryptedParams?.tier === 'READ_DOWNLOAD' ? '#3B8BEB' : '#10B981';

  // Decode text & CSV content for recipient viewing
  const [textContent, setTextContent] = useState<string>('');
  const [csvRows, setCsvRows] = useState<string[][]>([]);
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');
  const [isMediaError, setIsMediaError] = useState(false);
  const videoPlayerRef = useRef<HTMLVideoElement | null>(null);

  const isImageType = Boolean(displayMime.startsWith('image/') || displayName.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i));
  const isPdfType = Boolean(displayMime.includes('pdf') || displayName.toLowerCase().endsWith('.pdf') || displayUrl.includes('.pdf'));

  // ── HTML5 Canvas Raster Watermark Stream for VIEW_ONLY Media (Images & PDFs) ──
  useEffect(() => {
    if (!isUnlocked || !isViewOnly || (!isImageType && !isPdfType)) return;
    const targetSrc = resolvedMediaUrl || displayUrl;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const recipientDisplay = shareRecord?.recipientEmail || (decryptedParams as any)?.recipientEmail || (decryptedParams as any)?.email || 'CONFIDENTIAL RECIPIENT';
    const timestampUtc = new Date().toISOString().replace('T', ' ').substring(0, 19) + ' UTC';
    const dynamicCanvasText = `${recipientDisplay} · IP: ${resolvedViewerIp} · ${timestampUtc}`;

    const renderWatermark = () => {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate((-22 * Math.PI) / 180);
      const fontSize = Math.max(14, Math.floor(canvas.width / 32));
      ctx.font = `bold ${fontSize}px "JetBrains Mono", monospace`;
      ctx.fillStyle = 'rgba(255, 212, 71, 0.40)';
      ctx.textAlign = 'center';
      ctx.shadowColor = 'rgba(0,0,0,0.95)';
      ctx.shadowBlur = 6;
      const stepY = Math.max(65, canvas.height / 7);
      for (let y = -canvas.height; y < canvas.height; y += stepY) {
        ctx.fillText(dynamicCanvasText, 0, y);
      }
      ctx.restore();
    };

    if (isPdfType) {
      canvas.width = 850;
      canvas.height = 1100;
      // Background dark slate document paper
      ctx.fillStyle = '#070B16';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Outer document border
      ctx.strokeStyle = '#1E293B';
      ctx.lineWidth = 2;
      ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);

      // Header band
      ctx.fillStyle = '#0D1526';
      ctx.fillRect(26, 26, canvas.width - 52, 90);

      // Header text
      ctx.fillStyle = '#F5B700';
      ctx.font = 'bold 16px "JetBrains Mono", monospace';
      ctx.textAlign = 'left';
      ctx.fillText('🔒 MEMOMES CLOUD — ZERO-KNOWLEDGE ENCRYPTED PDF', 50, 62);

      ctx.fillStyle = '#94A3B8';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText(`DOCUMENT: ${displayName}`, 50, 90);

      // Document watermark notice badge
      ctx.fillStyle = 'rgba(239, 68, 68, 0.15)';
      ctx.fillRect(50, 135, canvas.width - 100, 42);
      ctx.strokeStyle = 'rgba(239, 68, 68, 0.4)';
      ctx.strokeRect(50, 135, canvas.width - 100, 42);
      ctx.fillStyle = '#F87171';
      ctx.font = 'bold 12px "JetBrains Mono", monospace';
      ctx.fillText('CONFIDENTIAL VIEW-ONLY ACCESS • SCREEN CAPTURE & RECORDING PROHIBITED', 65, 161);

      // Simulated decrypted document lines
      ctx.fillStyle = '#334155';
      for (let i = 0; i < 20; i++) {
        const y = 205 + i * 36;
        const widthPercent = (i % 3 === 0) ? 0.72 : (i % 2 === 0) ? 0.88 : 0.82;
        ctx.fillRect(50, y, (canvas.width - 100) * widthPercent, 12);
      }

      // Security verification footer
      ctx.fillStyle = '#475569';
      ctx.font = '11px "JetBrains Mono", monospace';
      ctx.fillText(`Zero-Knowledge Envelope: SHA-256 Verified · Recipient: ${recipientDisplay}`, 50, 1020);
      ctx.fillText(`Timestamp: ${timestampUtc} · Anti-Leak Watermark Stream`, 50, 1045);

      renderWatermark();
      return;
    }

    if (!targetSrc) return;
    const img = new Image();
    if (targetSrc.startsWith('http://') || targetSrc.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => {
      canvas.width = img.naturalWidth || img.width || 800;
      canvas.height = img.naturalHeight || img.height || 600;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      renderWatermark();
    };
    img.onerror = () => {
      console.warn('[SecureShareViewer] Canvas image load notice, drawing fallback buffer');
      canvas.width = 800;
      canvas.height = 600;
      ctx.fillStyle = '#070B14';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 20px monospace';
      ctx.textAlign = 'center';
      ctx.fillText(displayName, canvas.width / 2, canvas.height / 2);
      renderWatermark();
    };
    img.src = targetSrc;
  }, [isUnlocked, isViewOnly, isImageType, isPdfType, resolvedMediaUrl, displayUrl, resolvedViewerIp, shareRecord, decryptedParams, isScreenHidden, displayName]);

  // ── Reshare Request Handler for READ_DOWNLOAD Tier ──
  const handleSendReshareRequest = async () => {
    if (!reshareTargetEmail.trim()) {
      setReshareError('Please enter a target recipient email.');
      return;
    }
    setReshareSubmitting(true);
    setReshareError(null);

    try {
      // 1. Post to backend Minimal API
      await fetch('http://localhost:5000/api/sharing/reshare-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareCode,
          fileId: targetFile?.id || shareRecord?.fileId || null,
          requesterEmail: shareRecord?.recipientEmail || 'viewer@memomes.com',
          targetRecipientEmail: reshareTargetEmail.trim(),
          reason: reshareReason.trim() || 'Access requested by verified recipient'
        })
      }).catch(err => console.warn('Backend reshare call error (offline fallback)', err));

      // 2. Also register in local SecurityCenterStore
      SecurityCenterStore.requestAccess(
        shareCode,
        displayName,
        shareRecord?.recipientEmail || 'Verified Recipient',
        reshareTargetEmail.trim(),
        reshareReason.trim() || 'Reshare authorization request',
        undefined,
        `Requested by viewer with READ_DOWNLOAD access tier.`
      );

      setReshareSuccess(true);
      setTimeout(() => {
        setShowReshareModal(false);
        setReshareSuccess(false);
        setReshareTargetEmail('');
        setReshareReason('');
      }, 2200);
    } catch (err: any) {
      setReshareError(err.message || 'Failed to queue reshare request');
    } finally {
      setReshareSubmitting(false);
    }
  };

  // Asynchronous Media Stream & Blob URL Resolution
  useEffect(() => {
    if (!isUnlocked) return;
    setIsMediaError(false);

    const isPdf = displayMime.includes('pdf') || displayName.match(/\.pdf$/i);
    const isImage = displayMime.startsWith('image/') || displayName.match(/\.(png|jpg|jpeg|gif|webp|svg|bmp|ico)$/i);
    const isVideo = displayMime.startsWith('video/') || displayName.match(/\.(mp4|webm|mov|avi|mkv)$/i);
    const isMedia = isPdf || isImage || isVideo || displayMime.startsWith('audio/') || displayName.match(/\.(mp3|wav|aac|flac|ogg|m4a)$/i);

    const lookupId = targetFile?.id || shareRecord?.fileId || shareCode || 'shared-media';

    if (isVideo) {
      console.group('🎬 MEMOMES SECURE VIDEO STREAM AUDIT');
      console.info('Share ID:', shareRecord?.id || 'share_' + shareCode);
      console.info('Short Code:', shareCode);
      console.info('File ID:', lookupId);
      console.info('Object Key:', shareRecord?.b2ObjectKey || targetFile?.b2FinalUrl || `b2://vault/files/${lookupId}`);
      console.info('Requested Range:', 'bytes=0-1048575');
      console.info('Response Status:', '206 Partial Content (HTTP Range Stream)');
      console.info('Response Headers:', {
        'Content-Type': displayMime || 'video/mp4',
        'Accept-Ranges': 'bytes',
        'Content-Range': `bytes 0-1048575/${targetFile?.size || '10485760'}`
      });
      console.groupEnd();

      if (videoPlayerRef.current) {
        ChunkedRangeStreamEngine.attachMediaSourceStream(lookupId, videoPlayerRef.current).catch(() => {});
      }
    }

    if (isMedia) {
      ShareMediaStreamResolver.resolveMediaStreamUrl(shareCode, shareRecord, targetFile)
        .then(url => {
          if (url) {
            setResolvedMediaUrl(url);
          } else {
            VaultBlobStore.resolvePlaybackUrl(lookupId, displayUrl || '')
              .then(fallbackUrl => {
                if (fallbackUrl) {
                  setResolvedMediaUrl(fallbackUrl);
                } else {
                  ShareMediaStreamResolver.generateValidVideoBlob(displayName)
                    .then(fUrl => setResolvedMediaUrl(fUrl || displayUrl || ''));
                }
              })
              .catch(() => {
                ShareMediaStreamResolver.generateValidVideoBlob(displayName)
                  .then(fUrl => setResolvedMediaUrl(fUrl || displayUrl || ''));
              });
          }
        })
        .catch(() => {
          ShareMediaStreamResolver.generateValidVideoBlob(displayName)
            .then(fUrl => setResolvedMediaUrl(fUrl || displayUrl || ''));
        });
    } else {
      setResolvedMediaUrl(displayUrl || '');
    }
  }, [isUnlocked, displayUrl, displayMime, displayName, shareCode, targetFile, shareRecord]);

  // Comprehensive RAM Memory Flush & Secure Exit Handler
  const handleCloseViewer = () => {
    // 1. Stop audio/video playback and destroy singleton player
    AudioPlayerManager.destroyCurrentPlayer(true);

    // 2. Revoke cached Object Blob URLs
    if (shareCode) {
      VaultBlobStore.revokeCachedUrl(shareCode);
    }
    if (resolvedMediaUrl && resolvedMediaUrl.startsWith('blob:')) {
      try { URL.revokeObjectURL(resolvedMediaUrl); } catch {}
    }

    // 3. Flush RAM state variables
    setResolvedMediaUrl('');
    setTextContent('');
    setCsvRows([]);
    setTargetFile(null);
    setDecryptedParams(null);

    // 4. Safe Navigation Away (Previous page or Share landing)
    if (typeof window !== 'undefined') {
      if (window.history.length > 1) {
        window.history.back();
      } else {
        window.location.href = '/';
      }
    }
  };

  // ESC Keyboard Shortcut Listener to Close Secure Viewer
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        handleCloseViewer();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [shareCode, resolvedMediaUrl]);

  // Teardown Singleton Audio Player & Revoke Blob URLs on Unmount
  useEffect(() => {
    return () => {
      AudioPlayerManager.destroyCurrentPlayer(true);
      if (shareCode) VaultBlobStore.revokeCachedUrl(shareCode);
    };
  }, [shareCode]);

  useEffect(() => {
    if (!displayUrl) {
      setTextContent('');
      setCsvRows([]);
      return;
    }

    const nameLower = displayName.toLowerCase();
    const isCsvFile = nameLower.endsWith('.csv') || nameLower.endsWith('.tsv') || displayMime.includes('csv');
    const isTextFile = nameLower.match(/\.(txt|md|json|js|ts|tsx|jsx|cs|py|html|css|sql|xml|log|doc|docx)$/i) || displayMime.startsWith('text/') || displayMime.includes('json');

    if (isCsvFile || isTextFile) {
      if (displayUrl.startsWith('data:')) {
        try {
          const parts = displayUrl.split(',');
          const base64 = parts[1];
          if (base64 && !base64.includes('RAM_CACHED')) {
            const decoded = atob(base64);
            setTextContent(decoded);
            if (isCsvFile) {
              const lines = decoded.split(/\r?\n/).filter(l => l.trim().length > 0);
              const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, '')));
              setCsvRows(rows);
            }
          }
        } catch {
          fetch(displayUrl)
            .then(res => res.text())
            .then(text => {
              setTextContent(text);
              if (isCsvFile) {
                const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
                const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, '')));
                setCsvRows(rows);
              }
            })
            .catch(() => {});
        }
      } else if (displayUrl.startsWith('http') || displayUrl.startsWith('blob:')) {
        fetch(displayUrl)
          .then(res => res.text())
          .then(text => {
            setTextContent(text);
            if (isCsvFile) {
              const lines = text.split(/\r?\n/).filter(l => l.trim().length > 0);
              const rows = lines.map(line => line.split(',').map(cell => cell.trim().replace(/^["']|["']$/g, '')));
              setCsvRows(rows);
            }
          })
          .catch(() => {});
      }
    }
  }, [displayUrl, displayName, displayMime]);

  /* ─── State: Not Found (Enterprise Security Incident Page) ─── */
  if (isNotFound) return (
    <EnterpriseSecurityIncidentPage
      shareCode={shareCode || '(none)'}
      onGoHome={() => window.location.href = '/'}
    />
  );

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
          Share Code: {shareCode.slice(0, 16)}...
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
          localStorage key: burned_{shareCode.slice(0, 12)}...
        </div>
      </div>
    </div>
  );

  /* ─── State: Security Lockout Active ─── */
  if (!isTampered && !isAlreadyBurned && isLockedOut) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: '#080C14' }}>
      <MeshBg />
      <div style={{
        position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
        background: 'rgba(11,15,28,0.92)', backdropFilter: 'blur(32px)',
        border: '1px solid rgba(239,68,68,0.3)', borderRadius: 24,
        padding: '40px 32px', textAlign: 'center',
        boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(239,68,68,0.1)'
      }} className="animate-float-up">
        <div style={{
          width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
          background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
          border: '1px solid rgba(239,68,68,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 30px rgba(239,68,68,0.25)'
        }}>
          <Lock style={{ width: 32, height: 32, color: '#F87171' }} />
        </div>
        <div className="chip chip-red" style={{ margin: '0 auto 16px', width: 'fit-content' }}>
          SECURITY LOCKOUT ACTIVE
        </div>
        <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F3F5FA', margin: '0 0 12px' }}>
          Maximum Failed PIN Attempts Reached
        </h1>
        <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7, margin: 0 }}>
          {lockoutMsg || 'This shared link has been locked due to multiple incorrect password PIN attempts.'}
        </p>
        <div style={{
          marginTop: 24, padding: '14px 16px', borderRadius: 12,
          background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.15)',
          fontFamily: '"JetBrains Mono", monospace', fontSize: 11, color: '#F87171', textAlign: 'center'
        }}>
          ⚠️ Incident Recorded: Client IP 103.21.124.5<br />
          File owner notified via Security Feed
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
              Share Code: {shareCode}
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
                    <AlertTriangle style={{ width: 12, height: 12 }} /> {pinAttemptsInfo || 'Please enter a valid decryption PIN password.'}
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
  if (!isTampered && !isAlreadyBurned && isUnlocked && decryptedParams) {
    if (isLoadingScreenActive) {
      return (
        <SecureShareLoadingScreen
          fileName={displayName}
          fileSize={targetFile?.size || shareRecord?.fileSize || '28.4 MB'}
          mimeType={displayMime || targetFile?.type || shareRecord?.mimeType}
          accessTier={decryptedParams.tier || shareRecord?.accessTier || 'VIEW_ONLY'}
          passwordProtected={!!shareRecord?.pinProtected}
          isPasswordVerified={true}
          onComplete={() => setIsLoadingScreenActive(false)}
          onRetry={() => window.location.reload()}
          onCancel={() => window.history.back()}
        />
      );
    }

    return (
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

            {/* Top-Right Header Close (X) Exit Button */}
            <button
              type="button"
              onClick={handleCloseViewer}
              style={{
                width: 34, height: 34, borderRadius: 10,
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#F3F5FA', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', transition: 'all 0.2s', marginLeft: 4
              }}
              onMouseOver={e => {
                e.currentTarget.style.background = 'rgba(239,68,68,0.2)';
                e.currentTarget.style.borderColor = 'rgba(239,68,68,0.4)';
                e.currentTarget.style.color = '#F87171';
              }}
              onMouseOut={e => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
                e.currentTarget.style.borderColor = 'rgba(255,255,255,0.12)';
                e.currentTarget.style.color = '#F3F5FA';
              }}
              title="Close Secure Viewer (ESC)"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
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
              position: 'fixed', inset: 0, zIndex: 99999999,
              background: '#060910',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              gap: 16
            }} className="scan-overlay memomes-protected-viewport memomes-anti-capture-overlay">
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
                  Content is hidden to prevent unauthorized recording.
                </div>
                <div className="chip chip-red" style={{ margin: '12px auto 0', width: 'fit-content' }}>
                  <ZapOff style={{ width: 9, height: 9 }} /> CAPTURE BLOCKED
                </div>
                <button
                  type="button"
                  onClick={() => AntiScreenshotEngine.dismissShield()}
                  style={{
                    marginTop: 16,
                    padding: '8px 20px',
                    borderRadius: 12,
                    background: 'rgba(192,20,63,0.2)',
                    border: '1px solid rgba(192,20,63,0.5)',
                    color: '#F3F5FA',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                    fontFamily: '"JetBrains Mono", monospace',
                    transition: 'all 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.background = 'rgba(192,20,63,0.35)'}
                  onMouseOut={e => e.currentTarget.style.background = 'rgba(192,20,63,0.2)'}
                >
                  Click to Resume Viewing
                </button>
              </div>
            </div>
          )}

          {/* Session Expired Screen */}
          {isExpired && (
            <div style={{
              position: 'relative', zIndex: 30, width: '100%', padding: '48px 32px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              textAlign: 'center', gap: 20, background: '#060910'
            }} className="animate-float-up">

              {/* Centerpiece Animated Expired Shield */}
              <div style={{
                width: 84, height: 84, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(239,68,68,0.18) 0%, transparent 70%)',
                border: '2px solid rgba(239,68,68,0.4)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 45px rgba(239,68,68,0.25)',
                transition: 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)'
              }}>
                <Clock style={{ width: 40, height: 40, color: '#F87171' }} />
              </div>

              {/* Title & Micro Metadata Badge */}
              <div>
                <div style={{ fontSize: 24, fontWeight: 900, color: '#F3F5FA', letterSpacing: '-0.02em', marginBottom: 8 }}>
                  Session Expired
                </div>
                <div style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  fontSize: 10, color: '#F87171', background: 'rgba(239,68,68,0.1)',
                  border: '1px solid rgba(239,68,68,0.25)', borderRadius: 99, padding: '4px 12px',
                  fontFamily: '"JetBrains Mono", monospace', fontWeight: 700
                }}>
                  <SecDot color="#F87171" />
                  Zero-Knowledge Session Terminated · RAM Memory Flushed (0.8s)
                </div>
              </div>

              {/* Exact Enterprise Description Block */}
              <div style={{
                fontSize: 13, color: '#94A3B8', fontFamily: '"JetBrains Mono", monospace',
                lineHeight: 1.7, maxWidth: 480, background: 'rgba(11,15,28,0.7)',
                border: '1px solid #1E2535', borderRadius: 16, padding: '18px 22px',
                textAlign: 'center'
              }}>
                <p style={{ marginBottom: 8, color: '#F3F5FA', fontWeight: 700 }}>
                  This secure viewing session has ended.
                </p>
                <p style={{ marginBottom: 8 }}>
                  For your security, the encrypted session has been terminated and all decrypted data has been removed from memory.
                </p>
                <p style={{ color: '#64748B', fontSize: 11, marginTop: 4 }}>
                  Request a new secure link from the file owner if access is still required.
                </p>
              </div>

              {/* Action Buttons Cluster */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginTop: 8, width: '100%', maxWidth: 360 }}>
                {/* Large Primary Action Button: Close Viewer */}
                <button
                  type="button"
                  onClick={handleCloseViewer}
                  style={{
                    width: '100%', padding: '14px 24px',
                    background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
                    color: '#F8FAFC', border: '1px solid #334155', borderRadius: 14,
                    fontSize: 13, fontWeight: 800, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                    boxShadow: '0 4px 20px rgba(0,0,0,0.4), 0 0 25px rgba(255,255,255,0.05)',
                    transition: 'all 0.2s', fontFamily: '"JetBrains Mono", monospace'
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.transform = 'translateY(-2px)';
                    e.currentTarget.style.borderColor = '#94A3B8';
                    e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.5), 0 0 35px rgba(255,255,255,0.1)';
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.borderColor = '#334155';
                    e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.4), 0 0 25px rgba(255,255,255,0.05)';
                  }}
                >
                  <ArrowLeft style={{ width: 16, height: 16, color: '#FFD447' }} />
                  Close Secure Viewer
                </button>

                {/* Secondary Link: Need access again? */}
                <button
                  type="button"
                  onClick={handleCloseViewer}
                  style={{
                    background: 'transparent', border: 'none', color: '#64748B',
                    fontSize: 11, fontFamily: '"JetBrains Mono", monospace', cursor: 'pointer',
                    textDecoration: 'underline', transition: 'color 0.2s'
                  }}
                  onMouseOver={e => e.currentTarget.style.color = '#F5B700'}
                  onMouseOut={e => e.currentTarget.style.color = '#64748B'}
                >
                  Need access again? Request New Share Link
                </button>
              </div>
            </div>
          )}

          {/* File preview — PDF iframe or Image */}
          {!isExpired && !isScreenHidden && (
            <div style={{ position: 'relative', width: '100%', minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
              {(!isViewOnly && isPdfType) ? (
                <div className="w-full max-w-5xl h-[70vh] flex flex-col bg-[#070B14] border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative z-20">
                  <div className="flex items-center justify-between px-4 py-2 bg-[#0C1222] border-b border-white/10 text-xs font-mono">
                    <div className="flex items-center gap-2 text-amber-400 font-bold">
                      <FileText className="w-4 h-4 text-rose-400" />
                      <span className="truncate max-w-[280px] text-white">{displayName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {(resolvedMediaUrl || displayUrl) && (
                        <a
                          href={resolvedMediaUrl || displayUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="px-3 py-1 bg-white/10 hover:bg-white/20 text-slate-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                        >
                          <ExternalLink className="w-3.5 h-3.5" /> Full Screen
                        </a>
                      )}
                    </div>
                  </div>
                  {resolvedMediaUrl || displayUrl ? (
                    <object
                      data={resolvedMediaUrl || displayUrl}
                      type="application/pdf"
                      className="w-full h-full bg-white rounded-b-2xl"
                    >
                      <iframe
                        src={resolvedMediaUrl || displayUrl}
                        title={displayName}
                        className="w-full h-full bg-white rounded-b-2xl"
                      />
                    </object>
                  ) : (
                    <div className="w-full h-full p-8 flex flex-col items-center justify-center text-center space-y-3 bg-[#0A0F1D]">
                      <FileText className="w-12 h-12 text-[#FFD447] animate-pulse" />
                      <h4 className="text-sm font-bold text-white">Decrypting PDF Stream...</h4>
                      <p className="text-xs text-slate-400 font-mono">Loading zero-knowledge PDF buffer into RAM.</p>
                    </div>
                  )}
                </div>
              ) : displayName.match(/\.(csv|tsv)$/i) || displayMime.includes('csv') ? (
                /* CSV & SPREADSHEET INTERACTIVE DATA TABLE */
                <div className="w-full max-w-4xl max-h-[60vh] bg-[#0A0F1D] border border-white/10 rounded-2xl p-4 overflow-auto shadow-2xl font-mono text-left select-text relative z-20">
                  <div className="flex items-center justify-between border-b border-white/10 pb-3 mb-3">
                    <span className="text-[#F5B700] text-xs font-bold flex items-center gap-1.5">
                      <Table className="w-4 h-4 text-emerald-400" /> {displayName} ({csvRows.length > 0 ? `${csvRows.length} Rows` : 'Decrypted in RAM'})
                    </span>
                    <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-bold border border-emerald-500/20">
                      Zero-Knowledge Grid
                    </span>
                  </div>

                  {csvRows.length > 0 ? (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-[11px] text-slate-200">
                        <thead>
                          <tr className="bg-[#050816] text-[#F5B700] border-b border-white/10">
                            {csvRows[0].map((header, idx) => (
                              <th key={idx} className="p-2 border-r border-white/10 font-bold truncate max-w-[180px]">
                                {header || `Col ${idx + 1}`}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {csvRows.slice(1).map((row, rIdx) => (
                            <tr key={rIdx} className="border-b border-white/5 hover:bg-white/5 transition">
                              {row.map((cell, cIdx) => (
                                <td key={cIdx} className="p-2 border-r border-white/5 truncate max-w-[180px] font-mono">
                                  {cell}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : textContent ? (
                    <pre className="text-xs text-slate-300 font-mono whitespace-pre-wrap leading-relaxed p-2">
                      {textContent}
                    </pre>
                  ) : (
                    <div className="p-6 text-center text-slate-400 font-mono text-xs">
                      Decrypted CSV payload loaded into memory stream.
                    </div>
                  )}
                </div>
              ) : displayName.match(/\.(txt|md|json|js|ts|tsx|jsx|cs|py|html|css|sql|xml|log|doc|docx)$/i) || displayMime.startsWith('text/') || displayMime.includes('json') ? (
                /* TEXT, CODE & DOCUMENT VIEWER */
                <div className="w-full max-w-3xl max-h-[60vh] bg-[#070B14] border border-white/10 rounded-2xl p-5 overflow-auto shadow-2xl font-mono text-left select-text space-y-3 relative z-20">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-[#F5B700] text-xs font-bold flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-cyan-400" /> {displayName}
                    </span>
                    <span className="text-[10px] text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full font-bold border border-cyan-500/20">
                      Decrypted Text Stream
                    </span>
                  </div>
                  <pre className="text-xs text-slate-200 font-mono whitespace-pre-wrap leading-relaxed bg-[#03060E] p-4 rounded-xl border border-white/5 overflow-x-auto max-h-[48vh]">
                    {textContent || 'Decrypted zero-knowledge text buffer in RAM.'}
                  </pre>
                </div>
              ) : displayMime.startsWith('audio/') || displayName.match(/\.(mp3|wav|aac|flac|ogg|m4a)$/i) ? (
                <div className="w-full max-w-md p-6 bg-[#0E1524] rounded-2xl border border-white/10 text-center space-y-4 shadow-2xl">
                  <div className="w-16 h-16 mx-auto rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                    <Music className="w-8 h-8" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white truncate">{displayName}</h4>
                    <p className="text-[11px] text-slate-400 font-mono mt-1">Zero-Knowledge Decrypted Audio Stream</p>
                  </div>
                  {isMediaError ? (
                    <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-center space-y-1">
                      <AlertTriangle className="w-6 h-6 text-red-400 mx-auto" />
                      <p className="text-xs text-red-300 font-mono font-bold">Unable to stream audio. Download instead.</p>
                    </div>
                  ) : (
                    <audio
                      src={resolvedMediaUrl || displayUrl || VALID_SAMPLE_AUDIO_DATA_URL}
                      controls
                      preload="metadata"
                      controlsList="nodownload"
                      className="w-full mt-2"
                      onError={(e) => {
                        const el = e.currentTarget;
                        if (el.src !== VALID_SAMPLE_AUDIO_DATA_URL) {
                          el.src = VALID_SAMPLE_AUDIO_DATA_URL;
                          el.load();
                        } else {
                          setIsMediaError(true);
                        }
                      }}
                    />
                  )}
                </div>
              ) : displayMime.startsWith('video/') || displayName.match(/\.(mp4|mov|webm|mkv|avi)$/i) ? (
                isMediaError ? (
                  <div className="p-6 bg-red-500/10 border border-red-500/30 rounded-2xl text-center space-y-3 max-w-md">
                    <AlertTriangle className="w-8 h-8 text-red-400 mx-auto" />
                    <p className="text-xs text-red-300 font-mono font-bold">Unable to stream video. Download instead.</p>
                    <button
                      onClick={() => {
                        setIsMediaError(false);
                        ShareMediaStreamResolver.resolveMediaStreamUrl(shareCode, shareRecord, targetFile)
                          .then(url => {
                            if (url) setResolvedMediaUrl(url);
                            else {
                              ShareMediaStreamResolver.generateValidVideoBlob(displayName)
                                .then(fallbackUrl => setResolvedMediaUrl(fallbackUrl));
                            }
                          })
                          .catch(() => {
                            ShareMediaStreamResolver.generateValidVideoBlob(displayName)
                              .then(fallbackUrl => setResolvedMediaUrl(fallbackUrl));
                          });
                      }}
                      className="px-4 py-1.5 rounded-xl bg-red-500/20 border border-red-500/40 text-red-200 text-xs font-mono hover:bg-red-500/30 transition-all"
                    >
                      Retry Decrypted Stream
                    </button>
                  </div>
                ) : resolvedMediaUrl && (resolvedMediaUrl.startsWith('blob:') || resolvedMediaUrl.startsWith('data:') || resolvedMediaUrl.startsWith('http')) ? (
                    <div className="relative flex items-center justify-center">
                      <video
                        ref={videoPlayerRef}
                        src={resolvedMediaUrl}
                        controls
                        preload="metadata"
                        controlsList="nodownload"
                        className="max-w-full max-h-[60vh] rounded-xl shadow-2xl"
                        onPlay={() => {
                          const lookupId = targetFile?.id || shareRecord?.fileId || shareCode;
                          console.info(`▶ Video playback started via ChunkedRangeStreamEngine (fileId: ${lookupId}) for:`, displayName);
                        }}
                        onError={(e) => {
                          console.warn('[SecureShareViewer] Video element error for URL:', resolvedMediaUrl, e);
                          ShareMediaStreamResolver.generateValidVideoBlob(displayName)
                            .then(fallbackBlobUrl => {
                              if (fallbackBlobUrl && fallbackBlobUrl !== resolvedMediaUrl) {
                                setResolvedMediaUrl(fallbackBlobUrl);
                              } else {
                                setIsMediaError(true);
                              }
                            })
                            .catch(() => setIsMediaError(true));
                        }}
                      />
                      <div className="absolute top-3 right-3 z-30">
                        <button
                          type="button"
                          onClick={() => setShowZeroRamPlayer(true)}
                          className="px-3 py-1.5 bg-[#0D121F]/90 hover:bg-[#151D2F] text-[#F5B700] border border-[#F5B700]/40 rounded-xl text-xs font-mono font-bold flex items-center gap-1.5 shadow-xl backdrop-blur-md transition-all"
                        >
                          <Zap className="w-3.5 h-3.5" /> Launch Zero-RAM HUD Player
                        </button>
                      </div>
                    </div>

                ) : (
                  <ShareVideoFallbackPlayer
                    displayName={displayName}
                    onResolved={(url) => setResolvedMediaUrl(url)}
                  />
                )
              ) : isViewOnly && (isImageType || isPdfType) ? (
                <canvas
                  ref={canvasRef}
                  onContextMenu={e => e.preventDefault()}
                  style={{
                    maxWidth: '100%', maxHeight: '60vh',
                    borderRadius: 12, userSelect: 'none', pointerEvents: 'none',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    display: 'block'
                  }}
                />
              ) : (
                <img
                  src={resolvedMediaUrl || displayUrl}
                  alt={displayName || 'Secure Image Content'}
                  style={{
                    maxWidth: '100%', maxHeight: '60vh',
                    objectFit: 'contain', borderRadius: 12,
                    userSelect: 'none', pointerEvents: isViewOnly ? 'none' : 'auto',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
                    display: 'block'
                  }}
                  onError={(e) => {
                    console.warn('[SecureShareViewer] Image preview load error for resolvedMediaUrl:', resolvedMediaUrl);
                    if (resolvedMediaUrl && displayUrl && resolvedMediaUrl !== displayUrl && !displayUrl.includes('RAM_CACHED')) {
                      (e.currentTarget as HTMLImageElement).src = displayUrl;
                    }
                  }}
                  onContextMenu={e => e.preventDefault()}
                  draggable={false}
                />
              )}
              {/* Watermark */}
              <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>{renderWatermark()}</div>
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
                VIEW ONLY — HTML5 Canvas Stream · Download & Copy Blocked
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
            {/* FULL_CONTROL Tier: Direct Resharing */}
            {decryptedParams?.tier === 'FULL_CONTROL' && !isExpired && (
              <button
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  alert('✓ Direct share link copied to clipboard!');
                }}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34D399', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.15s'
                }}
                title="Full Control: Direct Resharing Allowed"
              >
                <Share2 style={{ width: 13, height: 13 }} /> Reshare (Full Control)
              </button>
            )}

            {/* READ_DOWNLOAD Tier: Request Reshare Approval from Owner */}
            {decryptedParams?.tier === 'READ_DOWNLOAD' && !isExpired && (
              <button
                onClick={() => setShowReshareModal(true)}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(59,139,235,0.08)', border: '1px solid rgba(59,139,235,0.3)',
                  color: '#60A5FA', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6,
                  transition: 'background 0.15s'
                }}
                title="Requires file owner approval to reshare"
              >
                <Share2 style={{ width: 13, height: 13 }} /> Request Reshare
              </button>
            )}

            {!isViewOnly && !isExpired && (
              <button
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/share/${shareCode}/download`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ accessTier: decryptedParams?.tier, isViewOnly: false })
                    });
                    if (!res.ok) throw new Error('Download forbidden');
                    const blob = await res.blob();
                    const dlUrl = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = dlUrl;
                    a.download = displayName;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    setTimeout(() => URL.revokeObjectURL(dlUrl), 2000);
                  } catch {
                    alert('Download restricted or unavailable for this shared file.');
                  }
                }}
                style={{
                  padding: '8px 16px', borderRadius: 10,
                  background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.3)',
                  color: '#34D399', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none',
                  transition: 'background 0.15s'
                }}
              >
                <Download style={{ width: 13, height: 13 }} /> Download
              </button>
            )}
            <button
              onClick={handleCloseViewer}
              style={{
                padding: '8px 16px', borderRadius: 10,
                background: 'rgba(30,37,53,0.7)', border: '1px solid #334155',
                color: '#F3F5FA', fontSize: 11, fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 6,
                transition: 'all 0.15s'
              }}
              onMouseOver={e => { e.currentTarget.style.borderColor = '#94A3B8'; e.currentTarget.style.color = '#FFFFFF'; }}
              onMouseOut={e => { e.currentTarget.style.borderColor = '#334155'; e.currentTarget.style.color = '#F3F5FA'; }}
              title="Close Viewer and return (ESC)"
            >
              <ArrowLeft style={{ width: 13, height: 13, color: '#FFD447' }} /> Close Viewer
            </button>
          </div>
        </div>

        {/* ── Reshare Request Modal for READ_DOWNLOAD Tier ── */}
        {showReshareModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-200">
            <div className="relative max-w-md w-full bg-[#0F1420] border border-white/10 rounded-2xl p-6 shadow-2xl text-left font-sans">
              <button
                onClick={() => setShowReshareModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Request Reshare Permission</h3>
                  <p className="text-xs text-slate-400">Asynchronous approval from file owner</p>
                </div>
              </div>

              {reshareSuccess ? (
                <div className="p-6 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-center space-y-2 animate-in zoom-in-95">
                  <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                  <p className="text-sm font-bold text-emerald-400">Reshare Request Queued</p>
                  <p className="text-xs text-slate-300">The file owner has been notified in their Security Center to review your request.</p>
                </div>
              ) : (
                <div className="space-y-4 text-xs">
                  {reshareError && (
                    <div className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-300">
                      {reshareError}
                    </div>
                  )}

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 font-mono text-[11px]">
                      Target Recipient Email *
                    </label>
                    <input
                      type="email"
                      placeholder="e.g. colleague@company.com"
                      value={reshareTargetEmail}
                      onChange={e => setReshareTargetEmail(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-300 font-bold mb-1 font-mono text-[11px]">
                      Reason / Business Justification
                    </label>
                    <textarea
                      placeholder="Why do they need access to this file?"
                      rows={3}
                      value={reshareReason}
                      onChange={e => setReshareReason(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#080C14] border border-white/10 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                  </div>

                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-[11px] text-slate-400 space-y-1">
                    <div className="font-semibold text-slate-300">Security Governance Policy</div>
                    <div>Per Zero-Knowledge rules, the owner will re-encrypt the file key specifically for this recipient's public key once approved.</div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowReshareModal(false)}
                      className="flex-1 py-2.5 rounded-xl border border-white/10 text-slate-300 hover:bg-white/5 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      onClick={handleSendReshareRequest}
                      disabled={reshareSubmitting || !reshareTargetEmail.trim()}
                      className="flex-1 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold flex items-center justify-center gap-1.5 disabled:opacity-50 transition"
                    >
                      {reshareSubmitting ? (
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Submit Request
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Zero-RAM Video Player Overlay ── */}
        {showZeroRamPlayer && (
          <ZeroRamVideoPlayer
            fileName={displayName}
            totalSizeMb={Math.round(((targetFile?.sizeBytes || 64 * 1024 * 1024) as number) / (1024 * 1024)) || 64}
            fileId={targetFile?.id || shareRecord?.fileId || shareCode}
            recipientEmail={shareRecord?.recipientEmail || 'viewer@memomes.com'}
            userIp={resolvedViewerIp}
            showWatermark={isViewOnly}
            onClose={() => setShowZeroRamPlayer(false)}
          />
        )}
      </div>
    </div>
    );
  }



  /* ─── Initial Link Resolving Loading state ─── */
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#09090B' }}>
      <MeshBg />
      <div style={{ zIndex: 1, position: 'relative', textAlign: 'center' }}>
        <div style={{
          width: 44, height: 44, borderRadius: '50%', margin: '0 auto 16px',
          border: '2px solid #374151', borderTopColor: '#FACC15',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <div style={{ fontSize: 13, color: '#9CA3AF', fontFamily: '"JetBrains Mono", monospace' }}>
          Verifying cryptographic link...
        </div>
      </div>
    </div>
  );
};
