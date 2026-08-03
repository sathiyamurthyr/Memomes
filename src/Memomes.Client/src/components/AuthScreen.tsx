import React, { useState, useEffect } from 'react';
import { ShieldCheck, ArrowRight, Eye, EyeOff, Sparkles } from 'lucide-react';
import { ZkCrypto } from '../crypto/zkCrypto';
import { ShamirSocialRecovery } from '../crypto/shamir';
import { MemomesLogo } from './MemomesLogo';

interface AuthScreenProps {
  onLoginSuccess: (user: { email: string; masterKey: CryptoKey; shards: any }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('sathiya@memomes.com');
  const [password, setPassword] = useState('SuperSecretMasterKey2026!');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [derivedKeyHex, setDerivedKeyHex] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  /* Animate progress bar while loading */
  useEffect(() => {
    if (!isLoading) { setProgress(0); return; }
    let p = 0;
    const id = setInterval(() => {
      p += Math.random() * 12;
      if (p >= 90) { clearInterval(id); p = 90; }
      setProgress(p);
    }, 120);
    return () => clearInterval(id);
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setIsLoading(true);
    try {
      const masterKey = await ZkCrypto.deriveMasterKey(password, `salt_${email}`);
      const rawHexKey = await ZkCrypto.exportKeyRaw(masterKey);
      setDerivedKeyHex(rawHexKey.substring(0, 16) + '...');
      const shards = ShamirSocialRecovery.splitMasterKey(rawHexKey);
      setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setIsLoading(false);
          onLoginSuccess({ email, masterKey, shards });
        }, 300);
      }, 600);
    } catch (err: any) {
      alert('Authentication error: ' + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4 relative overflow-hidden text-[#FFFFFF]">

      {/* Background Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,192,39,0.14) 0%, transparent 65%)',
          filter: 'blur(70px)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,0.14) 0%, transparent 65%)',
          filter: 'blur(70px)'
        }} />
      </div>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-md space-y-6">

        {/* Brand Logo Header */}
        <div className="text-center">
          <MemomesLogo size="lg" showTagline={true} />
        </div>

        {/* Card */}
        <div className="glass-card p-8 space-y-6 shadow-2xl relative overflow-hidden bg-[#0E1524] border border-white/10 rounded-2xl">
          
          {/* Loading progress bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#070B14] overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#F5C027] to-[#7C3AED] transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex bg-[#070B14] p-1 rounded-2xl border border-white/[0.08]">
            {[
              { id: false, label: 'Sign In to Vault' },
              { id: true, label: 'Create New Vault' }
            ].map(tab => (
              <button
                key={String(tab.id)}
                type="button"
                onClick={() => setIsRegister(tab.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition ${
                  isRegister === tab.id
                    ? 'bg-[#172134] text-[#F5C027] shadow-md border border-[#F5C027]/40'
                    : 'text-[#94A3B8] hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#CBD5E1] mb-1.5 uppercase tracking-wider">
                Vault Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="sathiya@memomes.com"
                className="w-full bg-[#070B14] border border-white/10 focus:border-[#F5C027] rounded-2xl px-4 py-3.5 text-xs text-white placeholder-[#94A3B8] focus:outline-none transition"
              />
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="block text-xs font-bold text-[#CBD5E1] uppercase tracking-wider">
                  Master Password
                </label>
                <span className="text-[10px] text-[#94A3B8]">Key derivation seed</span>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                  placeholder="••••••••••••••••••••"
                  className="w-full bg-[#070B14] border border-white/10 focus:border-[#F5C027] rounded-2xl px-4 py-3.5 text-xs text-white placeholder-[#94A3B8] font-mono focus:outline-none transition pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* ZK Guarantee Badge */}
            <div className="p-3.5 rounded-2xl bg-[#22C55E]/10 border border-[#22C55E]/30 text-xs text-[#22C55E] flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="leading-relaxed text-[11px]">
                <strong>Zero-Knowledge Guarantee:</strong> Master key is derived locally via PBKDF2 (100k+ iterations). Raw keys never touch server sockets.
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <span>Deriving Local Master Key...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>{isRegister ? 'Create Vault & Generate Shards' : 'Decrypt & Enter Vault'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {derivedKeyHex && (
            <div className="p-3 rounded-xl bg-[#070B14] border border-white/10 text-center font-mono text-[10px] text-[#F5C027]">
              ✓ Client Master Key Derived: {derivedKeyHex}
            </div>
          )}
        </div>

        {/* Feature Pills */}
        <div className="flex items-center justify-center gap-3 text-[10px] font-mono text-[#94A3B8]">
          <span className="px-3 py-1 rounded-full bg-[#0E1524] border border-white/10">AES-256-GCM</span>
          <span className="px-3 py-1 rounded-full bg-[#0E1524] border border-white/10">Shamir 3-of-2</span>
          <span className="px-3 py-1 rounded-full bg-[#0E1524] border border-white/10">MinIO S3</span>
        </div>
      </div>
    </div>
  );
};
