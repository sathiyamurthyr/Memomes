import React, { useState } from 'react';
import { Lock, KeyRound, ShieldCheck, ArrowRight, ShieldAlert } from 'lucide-react';
import { ZkCrypto } from '../crypto/zkCrypto';
import { ShamirSocialRecovery } from '../crypto/shamir';

interface AuthScreenProps {
  onLoginSuccess: (user: { email: string; masterKey: CryptoKey; shards: any }) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('sathiya@memomes.com');
  const [password, setPassword] = useState('SuperSecretMasterKey2026!');
  const [isLoading, setIsLoading] = useState(false);
  const [derivedKeyHex, setDerivedKeyHex] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;

    setIsLoading(true);

    try {
      // 1. Derive 256-bit AES-GCM Master Key on client device strictly via Web Crypto API
      const masterKey = await ZkCrypto.deriveMasterKey(password, `salt_${email}`);
      const rawHexKey = await ZkCrypto.exportKeyRaw(masterKey);
      setDerivedKeyHex(rawHexKey.substring(0, 16) + '...');

      // 2. Generate 3-of-2 Shamir Social Recovery Shards on client
      const shards = ShamirSocialRecovery.splitMasterKey(rawHexKey);

      setTimeout(() => {
        setIsLoading(false);
        onLoginSuccess({
          email,
          masterKey,
          shards
        });
      }, 600);
    } catch (err: any) {
      alert("Authentication error: " + err.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      {/* Dynamic Glassmorphism Auth Card */}
      <div className="max-w-md w-full glass-card rounded-2xl p-8 border border-stroke-default shadow-2xl relative overflow-hidden">
        {/* Glow accent decoration */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-2xl bg-gradient-to-tr from-primary to-accent-gold p-0.5 shadow-xl shadow-primary/25 flex items-center justify-center">
            <div className="w-full h-full bg-surface-container rounded-[14px] flex items-center justify-center">
              <Lock className="w-7 h-7 text-accent-gold" />
            </div>
          </div>
          <h2 className="text-2xl font-black text-white tracking-tight">Memomes Cloud</h2>
          <p className="text-xs text-amber-200/90 mt-1 font-medium">
            Zero-Knowledge Privacy Storage. Keys never touch backend servers.
          </p>
        </div>

        {/* Tab switcher */}
        <div className="flex bg-surface p-1 rounded-xl border border-stroke-default mb-6">
          <button
            type="button"
            onClick={() => setIsRegister(false)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${!isRegister ? 'bg-surface-card text-accent-gold shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Sign In to Vault
          </button>
          <button
            type="button"
            onClick={() => setIsRegister(true)}
            className={`flex-1 py-2 text-xs font-bold rounded-lg transition ${isRegister ? 'bg-surface-card text-accent-gold shadow-md' : 'text-gray-400 hover:text-white'}`}
          >
            Create New Vault
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Vault Email Address</label>
            <div className="relative">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="user@memomes.com"
                className="w-full bg-surface border border-stroke-default rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-300 mb-1.5">Master Password (Key Derivation Seed)</label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••••••••••"
                className="w-full bg-surface border border-stroke-default rounded-xl px-4 py-3 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-accent-gold font-mono"
              />
            </div>
          </div>

          {/* Zero-Knowledge Guarantee Badge */}
          <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-xl text-[11px] text-emerald-300 flex items-start space-x-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>
              <strong>Zero-Knowledge Assurance:</strong> Your password derives a 256-bit AES-GCM master key locally using PBKDF2 (100,000+ iterations). Raw keys are never sent across network sockets.
            </span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 px-4 bg-gradient-to-r from-primary to-primary-hover hover:from-primary-hover hover:to-primary text-white text-xs font-extrabold rounded-xl shadow-lg shadow-primary/25 border border-red-500/30 transition transform active:scale-95 flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <KeyRound className="w-4 h-4 text-accent-gold animate-spin" />
                <span>Deriving Local Master Key...</span>
              </>
            ) : (
              <>
                <span>{isRegister ? 'Create Vault & Generate Shards' : 'Decrypt & Enter Vault'}</span>
                <ArrowRight className="w-4 h-4 text-amber-300" />
              </>
            )}
          </button>
        </form>

        {derivedKeyHex && (
          <div className="mt-4 p-2.5 bg-surface rounded-lg border border-stroke-default text-[10px] font-mono text-accent-gold text-center">
            Client Master Key Derived: {derivedKeyHex}
          </div>
        )}

        <div className="mt-6 border-t border-stroke-default pt-4 text-center">
          <p className="text-[11px] text-gray-500 flex items-center justify-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-accent-gold" />
            <span>Memomes Cloud Security Architecture v1.0</span>
          </p>
        </div>
      </div>
    </div>
  );
};
