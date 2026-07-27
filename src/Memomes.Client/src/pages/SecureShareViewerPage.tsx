import React, { useState, useEffect } from 'react';
import { ShieldCheck, Lock, Download, AlertTriangle, RefreshCw, X, ShieldAlert, Clock } from 'lucide-react';

export const SecureShareViewerPage: React.FC = () => {
  const [password, setPassword] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60); // 60s countdown
  const [isExpired, setIsExpired] = useState(false);

  // Parse query parameters
  const params = new URLSearchParams(window.location.search);
  const tier = params.get('tier') || 'VIEW_ONLY';
  const expiry = params.get('expiry') || '60s';
  const isZk = params.get('zk') === '1';

  // Extract shareId from pathname /s/[id]
  const pathParts = window.location.pathname.split('/');
  const shareId = pathParts[pathParts.length - 1] || 'ac90b5b3-8ccf-40ea-9765-0c4f86601641';

  useEffect(() => {
    if (!isUnlocked) return;

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
  }, [isUnlocked]);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate zero-knowledge private key envelope decryption
    setIsUnlocked(true);
  };

  // Prevent right clicks and copy events in VIEW_ONLY mode
  useEffect(() => {
    if (tier !== 'VIEW_ONLY' || !isUnlocked || isExpired) return;

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
  }, [tier, isUnlocked, isExpired]);

  // Fallback logo path
  const logoUrl = "https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=60";

  return (
    <div className="min-h-screen bg-[#0B0F17] text-gray-100 flex flex-col items-center justify-center p-4 selection:bg-primary selection:text-white">
      {/* Decryption Form Card */}
      {!isUnlocked && (
        <div className="w-full max-w-md glass-card rounded-3xl border border-stroke-default p-8 space-y-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
          <div className="text-center space-y-2.5">
            <div className="w-14 h-14 rounded-full bg-primary/20 border-2 border-accent-gold/40 flex items-center justify-center mx-auto text-accent-gold shadow-lg">
              <Lock className="w-7 h-7" />
            </div>
            <h2 className="text-xl font-extrabold text-white">Secure Zero-Knowledge Share</h2>
            <p className="text-xs text-gray-400 font-mono">
              Share ID: {shareId.slice(0, 8)}...{shareId.slice(-8)}
            </p>
          </div>

          <div className="p-4 bg-surface rounded-2xl border border-stroke-default space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Access Tier:</span>
              <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/30 text-accent-gold rounded-full font-bold">
                {tier}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Expiry Policy:</span>
              <span className="text-gray-200 font-bold font-mono">{expiry}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-400 font-medium">Zero-Knowledge (ZK):</span>
              <span className="text-emerald-400 font-bold flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> {isZk ? 'Enabled (AES-256)' : 'Standard'}
              </span>
            </div>
          </div>

          <form onSubmit={handleUnlock} className="space-y-4">
            <div className="space-y-1.5">
              <label className="block text-gray-300 font-bold text-xs">Enter Decryption Password / PIN</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="e.g. user-shared PIN..."
                className="w-full bg-surface border border-stroke-default rounded-xl px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold font-mono text-xs"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-primary hover:bg-primary-hover text-white text-xs font-extrabold rounded-xl transition shadow-lg flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-4 h-4 text-accent-gold animate-spin-slow" /> Decrypt Envelope
            </button>
          </form>
        </div>
      )}

      {/* Unlocked View Center */}
      {isUnlocked && (
        <div className="w-full max-w-3xl glass-card rounded-3xl border border-stroke-default overflow-hidden shadow-2xl flex flex-col justify-between aspect-[4/3] relative">
          
          {/* Header Status Bar */}
          <div className="px-6 py-4 bg-surface-container/90 border-b border-stroke-default flex items-center justify-between z-10">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <h3 className="font-extrabold text-white text-xs">Confidential_Memomes_Logo.png</h3>
                <span className="text-[10px] text-gray-400 font-mono">1.24 MB · decrypted in RAM</span>
              </div>
            </div>
            
            {/* Expiry Countdown Timer */}
            {expiry === '60s' && (
              <div className={`px-3 py-1.5 rounded-full border text-[10px] font-bold font-mono flex items-center gap-1.5 ${
                timeLeft < 15 
                  ? 'bg-red-500/10 border-red-500/30 text-red-400 animate-pulse'
                  : 'bg-amber-500/10 border-amber-500/30 text-accent-gold'
              }`}>
                <Clock className="w-3.5 h-3.5" /> Self-Destruct in {timeLeft}s
              </div>
            )}
          </div>

          {/* Secure Display Canvas / Viewport */}
          <div className="flex-1 bg-[#06080d] flex items-center justify-center relative overflow-hidden group select-none">
            {isExpired ? (
              /* Expired State overlay */
              <div className="text-center p-8 space-y-3 z-15 animate-in fade-in duration-200">
                <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-red-500/50 flex items-center justify-center mx-auto text-red-400 shadow-lg">
                  <ShieldAlert className="w-8 h-8" />
                </div>
                <h3 className="font-extrabold text-white text-base">Access Key Expired</h3>
                <p className="text-xs text-gray-400 font-mono max-w-md mx-auto leading-relaxed">
                  Presigned 60-second S3 session has expired. Unencrypted RAM buffers flusheed successfully to comply with zero-retention rules.
                </p>
              </div>
            ) : (
              <>
                {/* File Render */}
                <img
                  src={logoUrl}
                  alt="Secure Content"
                  className="max-h-[90%] max-w-[90%] object-contain rounded-xl select-none"
                  onContextMenu={(e) => e.preventDefault()}
                  draggable={false}
                />

                {/* VIEW_ONLY mode security guidelines & Dynamic Watermarks */}
                {tier === 'VIEW_ONLY' && (
                  <>
                    {/* Security Watermark Text (diagonal repeat overlay) */}
                    <div className="absolute inset-0 pointer-events-none grid grid-cols-2 grid-rows-2 select-none opacity-[0.06] rotate-[-15] text-white font-extrabold font-mono text-center text-sm z-10 leading-normal">
                      <div>SATHIYA KUMAR · 103.21.124.5<br />{new Date().toLocaleDateString()}</div>
                      <div>SATHIYA KUMAR · 103.21.124.5<br />{new Date().toLocaleDateString()}</div>
                      <div>SATHIYA KUMAR · 103.21.124.5<br />{new Date().toLocaleDateString()}</div>
                      <div>SATHIYA KUMAR · 103.21.124.5<br />{new Date().toLocaleDateString()}</div>
                    </div>

                    {/* Restricted banner */}
                    <div className="absolute bottom-4 left-4 z-25 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-bold font-mono px-3 py-1 rounded-full flex items-center gap-1.5">
                      <AlertTriangle className="w-3.5 h-3.5" /> VIEW_ONLY MODE (Screenshotting is logged)
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
              {tier !== 'VIEW_ONLY' && !isExpired && (
                <button className="px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 text-xs font-bold rounded-xl transition flex items-center gap-1.5">
                  <Download className="w-3.5 h-3.5" /> Download payload
                </button>
              )}
              <button 
                onClick={() => { setIsUnlocked(false); setIsExpired(false); setTimeLeft(60); }}
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
