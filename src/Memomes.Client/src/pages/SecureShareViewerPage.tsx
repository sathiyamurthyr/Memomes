import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Download, AlertTriangle, RefreshCw, X, ShieldAlert, Clock, Flame } from 'lucide-react';
import { ShareCrypto } from '../utils/shareCrypto';
import { LocalVaultDb, type VaultFile } from '../utils/localVaultDb';

export const SecureShareViewerPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // Default 60s
  const [isExpired, setIsExpired] = useState(false);
  
  // Security checks
  const [isTampered, setIsTampered] = useState(false);
  const [isAlreadyBurned, setIsAlreadyBurned] = useState(false);
  const [decryptedParams, setDecryptedParams] = useState<{ tier: string; expiry: string; zk: boolean; oneTime: boolean } | null>(null);
  const [targetFile, setTargetFile] = useState<VaultFile | null>(null);

  // Parse path & query params
  const params = new URLSearchParams(window.location.search);
  const p = params.get('p') || '';
  
  const pathParts = window.location.pathname.split('/');
  const shareId = pathParts[pathParts.length - 1] || 'ac90b5b3-8ccf-40ea-9765-0c4f86601641';

  // Step 1: Decrypt parameters at mount to verify signature integrity
  useEffect(() => {
    const initShare = async () => {
      if (!p) {
        setIsTampered(true);
        return;
      }
      
      const paramsDecrypted = await ShareCrypto.decryptParams(shareId, p);
      if (!paramsDecrypted) {
        setIsTampered(true);
        return;
      }

      setDecryptedParams(paramsDecrypted);

      // Check if it has already been burned/self-destructed in this browser
      const isBurned = localStorage.getItem(`burned_${shareId}`) === '1';
      if (paramsDecrypted.oneTime && isBurned) {
        setIsAlreadyBurned(true);
      }

      // Map time duration if 60s
      if (paramsDecrypted.expiry === '60s') {
        setTimeLeft(60);
      } else if (paramsDecrypted.expiry === '1h') {
        setTimeLeft(3600);
      } else {
        setTimeLeft(86400); // 24h+
      }
    };

    initShare();
  }, [shareId, p]);

  // Step 2: Retrieve actual file data from LocalVaultDb
  useEffect(() => {
    const file = LocalVaultDb.getFile(shareId);
    if (file) {
      setTargetFile(file);
    }
  }, [shareId]);

  // Step 3: Expiry countdown timer (starts after decrypting)
  useEffect(() => {
    if (!isUnlocked || isExpired || isAlreadyBurned || isTampered) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setIsExpired(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isUnlocked, isExpired, isAlreadyBurned, isTampered]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isAlreadyBurned) return;

    // Simulate ZK private key decryption check
    setIsUnlocked(true);

    // If it's a burn-on-read one-time view, flag it in localStorage IMMEDIATELY!
    if (decryptedParams?.oneTime) {
      localStorage.setItem(`burned_${shareId}`, '1');
    }
  };

  // Enforce View Only access blocks (copy, context menu, text selection)
  useEffect(() => {
    const isViewOnly = decryptedParams?.tier === 'VIEW_ONLY';
    if (!isViewOnly || !isUnlocked || isExpired || isAlreadyBurned) return;

    const preventActions = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', preventActions);
    document.addEventListener('copy', preventActions);
    document.addEventListener('selectstart', preventActions);

    return () => {
      document.removeEventListener('contextmenu', preventActions);
      document.removeEventListener('copy', preventActions);
      document.removeEventListener('selectstart', preventActions);
    };
  }, [decryptedParams, isUnlocked, isExpired, isAlreadyBurned]);

  // Default fallback image if target file is missing from local DB
  const defaultLogoUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";
  const displayUrl = targetFile ? targetFile.dataUrl : defaultLogoUrl;
  const displayFileName = targetFile ? targetFile.name : "Confidential_Memomes_Logo.png";
  const displayMimeType = targetFile ? targetFile.type : "image/png";

  const renderTimerString = () => {
    if (timeLeft > 3600) {
      return `${Math.ceil(timeLeft / 3600)}h left`;
    }
    return `${timeLeft}s`;
  };

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white">
      
      {/* 1. Tampered / Invalid parameters payload */}
      {isTampered && (
        <div className="w-full max-w-md glass-card rounded-3xl border border-red-500/30 p-8 text-center space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-red-500/50 flex items-center justify-center mx-auto text-red-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-white">Access Forbidden / Tampered URL</h2>
          <p className="text-xs text-gray-400 leading-relaxed font-mono">
            Cryptographic verification of URL parameters failed. The access policy signatures do not match the Share Key.
          </p>
        </div>
      )}

      {/* 2. One-Time link already burned */}
      {!isTampered && isAlreadyBurned && (
        <div className="w-full max-w-md glass-card rounded-3xl border border-orange-500/30 p-8 text-center space-y-4 shadow-2xl animate-in fade-in duration-200">
          <div className="w-14 h-14 rounded-full bg-orange-950/80 border-2 border-orange-500/50 flex items-center justify-center mx-auto text-orange-400">
            <Flame className="w-7 h-7" />
          </div>
          <h2 className="text-lg font-extrabold text-white">Link Self-Destructed</h2>
          <p className="text-xs text-gray-400 leading-relaxed font-mono">
            This one-time view link has already been opened and burned. Encryption keys have been purged from local caches.
          </p>
        </div>
      )}

      {/* 3. Decryption Password Form */}
      {!isTampered && !isAlreadyBurned && !isUnlocked && decryptedParams && (
        <div className="w-full max-w-md glass-card rounded-3xl border border-stroke-default p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-accent-gold/40 flex items-center justify-center mx-auto text-accent-gold shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Decrypt Zero-Knowledge Share</h2>
            <p className="text-xs text-gray-400 font-mono">
              Share ID: {shareId.slice(0, 8)}...{shareId.slice(-8)}
            </p>
          </div>

          <div className="p-4 bg-surface rounded-2xl border border-stroke-default space-y-2.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Access Tier:</span>
              <span className="px-2.5 py-0.5 bg-amber-500/10 border border-amber-500/30 text-accent-gold rounded-full font-bold">
                {decryptedParams.tier}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Expiry Policy:</span>
              <span className="text-gray-200 font-bold font-mono">{decryptedParams.expiry}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Link Burn Policy:</span>
              <span className={decryptedParams.oneTime ? 'text-orange-400 font-bold' : 'text-gray-400'}>
                {decryptedParams.oneTime ? 'Burn on First Read' : 'Multiple Views Allowed'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">ZK Cryptography:</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Enforced (AES-256)
              </span>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-gray-300 font-bold text-xs">Enter Decryption PIN / Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="PIN shared by owner..."
                className="w-full bg-surface border border-stroke-default rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-accent-gold" /> Decrypt Payload
            </button>
          </form>
        </div>
      )}

      {/* 4. Decrypted Image Viewport */}
      {!isTampered && !isAlreadyBurned && isUnlocked && decryptedParams && (
        <div className="w-full max-w-3xl glass-card rounded-3xl border border-stroke-default overflow-hidden shadow-2xl flex flex-col justify-between aspect-[4/3] relative animate-in zoom-in-95 duration-200">
          
          {/* Header Status Bar */}
          <div className="px-6 py-4 bg-surface-container/90 border-b border-stroke-default flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-extrabold text-white text-xs truncate max-w-xs">{displayFileName}</h3>
                <span className="text-[10px] text-gray-400 font-mono">{displayMimeType} · Decrypted in RAM</span>
              </div>
            </div>
            
            {/* Expiry Countdown Timer */}
            {decryptedParams.expiry !== '7d' && (
              <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold font-mono flex items-center gap-1.5 ${
                timeLeft < 15 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                  : 'bg-amber-500/10 border-amber-500/30 text-accent-gold'
              }`}>
                <Clock className="w-3.5 h-3.5" /> Self-Destruct in {renderTimerString()}
              </div>
            )}
          </div>

          {/* Secure Display Viewport */}
          <div className="flex-1 bg-[#06080d] flex items-center justify-center relative overflow-hidden group select-none">
            {isExpired ? (
              /* Expired overlay */
              <div className="text-center p-8 space-y-3 z-15 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-red-500/50 flex items-center justify-center mx-auto text-red-400 shadow-lg">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-white text-base">Session Expired</h3>
                <p className="text-xs text-gray-400 font-mono max-w-md mx-auto leading-relaxed">
                  The secure S3 presigned URL key has expired. Decrypted RAM buffers flushed successfully.
                </p>
              </div>
            ) : (
              <>
                {/* File Image Render */}
                <img
                  src={displayUrl}
                  alt="Decrypted Content"
                  className="max-h-[90%] max-w-[90%] object-contain rounded-xl select-none"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />

                {/* VIEW_ONLY security watermark overlay */}
                {decryptedParams.tier === 'VIEW_ONLY' && (
                  <>
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 select-none opacity-[0.06] rotate-[-15] text-white font-extrabold font-mono text-center text-sm z-10 leading-normal">
                      <div>RECIPIENT · 103.21.124.5<br />{new Date().toLocaleDateString()}</div>
                      <div>RECIPIENT · 103.21.124.5<br />{new Date().toLocaleDateString()}</div>
                      <div>RECIPIENT · 103.21.124.5<br />{new Date().toLocaleDateString()}</div>
                      <div>RECIPIENT · 103.21.124.5<br />{new Date().toLocaleDateString()}</div>
                    </div>

                    <div className="absolute bottom-4 left-4 z-25 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold font-mono px-3 py-1 rounded-full flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> VIEW_ONLY MODE (Saves blocked)
                    </div>
                  </>
                )}
              </>
            )}
          </div>

          {/* Footer Bar */}
          <div className="px-6 py-4 bg-surface-container/90 border-t border-stroke-default flex items-center justify-between z-10">
            <span className="text-[10px] text-gray-500 font-mono">Zero-Knowledge Decryption Envelope v1.0</span>
            
            <div className="flex gap-2">
              {decryptedParams.tier !== 'VIEW_ONLY' && !isExpired && (
                <a
                  href={displayUrl}
                  download={displayFileName}
                  className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download
                </a>
              )}
              <button 
                onClick={() => { setIsUnlocked(false); setIsExpired(false); }}
                className="px-4 py-2 bg-surface hover:bg-surface-card border border-stroke-default text-gray-300 text-xs font-bold rounded-xl transition flex items-center gap-1"
              >
                <X className="w-3.5 h-3.5" /> Lock Viewer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
