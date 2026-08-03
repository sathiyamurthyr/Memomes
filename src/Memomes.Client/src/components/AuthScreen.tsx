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
    <div className="min-h-screen bg-[#070B14] flex items-center justify-center p-4 relative overflow-hidden text-white">
      {/* Background Mesh Orbs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div style={{
          position: 'absolute', top: '-20%', left: '-15%',
          width: '60vw', height: '60vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(245,183,0,0.14) 0%, transparent 65%)',
          filter: 'blur(80px)'
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', right: '-10%',
          width: '50vw', height: '50vw', borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(59,130,246,0.12) 0%, transparent 65%)',
          filter: 'blur(80px)'
        }} />
      </div>

      {/* Auth Card Container */}
      <div className="relative z-10 w-full max-w-md space-y-6">
        {/* Brand Logo Header */}
        <div className="text-center flex flex-col items-center">
          <MemomesLogo size="lg" showTagline={true} />
        </div>

        {/* Card */}
        <div className="glass-card p-8 space-y-6 shadow-2xl relative overflow-hidden bg-[#0F172A]/90 border border-white/10 rounded-3xl">
          {/* Loading progress bar */}
          {isLoading && (
            <div className="absolute top-0 left-0 right-0 h-1 bg-[#070B14] overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-[#F5B700] to-amber-500 transition-all duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}

          {/* Tab Switcher */}
          <div className="flex bg-[#070B14] p-1 rounded-2xl border border-white/10">
            {[
              { id: false, label: 'Sign In to Vault' },
              { id: true, label: 'Create New Vault' }
            ].map(tab => (
              <button
                key={String(tab.id)}
                type="button"
                onClick={() => setIsRegister(tab.id)}
                className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isRegister === tab.id
                    ? 'bg-[#F5B700] text-slate-950 shadow-md font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Account Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="name@company.com"
                className="w-full h-11 px-4 rounded-xl bg-[#070B14] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F5B700] transition-colors"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-slate-300">Master Encryption Key</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••••••••••"
                  className="w-full h-11 pl-4 pr-10 rounded-xl bg-[#070B14] border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-[#F5B700] transition-colors font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-gold w-full !h-11 !text-xs font-bold shadow-lg"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 animate-spin" /> Deriving AES-256 Key...
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {isRegister ? 'Initialize Zero-Knowledge Vault' : 'Unlock Encrypted Storage'}
                  <ArrowRight className="w-4 h-4" />
                </span>
              )}
            </button>
          </form>

          {/* Security Badge Footnote */}
          <div className="pt-4 border-t border-white/5 flex items-center justify-center gap-2 text-[11px] text-slate-400 font-mono">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>PBKDF2 SHA-256 • 100,000 Iterations</span>
          </div>
        </div>
      </div>
    </div>
  );
};
