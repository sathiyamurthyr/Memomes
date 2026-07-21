import React, { useState } from 'react';
import { Lock, ShieldCheck, Key, AlertTriangle, Eye, EyeOff, Fingerprint, Flame } from 'lucide-react';

export const DigitalVaultPage: React.FC = () => {
  const [vaultUnlocked, setVaultUnlocked] = useState(false);
  const [pin, setPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');

  const handleUnlock = () => {
    if (pin === '1234') {
      setVaultUnlocked(true);
      setError('');
    } else {
      setError('Incorrect Vault PIN. Biometric fallback triggered.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-accent-gold p-0.5 shadow-lg">
          <div className="w-full h-full bg-surface-container rounded-[14px] flex items-center justify-center">
            <Lock className="w-5 h-5 text-accent-gold" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-extrabold text-white">Digital Vault</h2>
          <p className="text-xs text-gray-400">Zero-Knowledge Shamir-protected ultra-secure storage.</p>
        </div>
      </div>

      {!vaultUnlocked ? (
        /* Vault Lock Screen */
        <div className="glass-card rounded-2xl border border-stroke-default p-10 max-w-sm mx-auto text-center space-y-5">
          <div className="w-16 h-16 rounded-full bg-primary/20 border-2 border-primary/50 flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-accent-gold" />
          </div>
          <div>
            <h3 className="font-bold text-white text-base mb-1">Vault Locked</h3>
            <p className="text-xs text-gray-400">Enter your Vault PIN or use biometric to access your most sensitive files.</p>
          </div>

          <div className="relative">
            <input
              type={showPin ? 'text' : 'password'}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleUnlock()}
              placeholder="Enter 4-digit Vault PIN"
              maxLength={4}
              className="w-full bg-surface border border-stroke-default rounded-xl px-4 py-2.5 text-center font-mono text-lg tracking-widest text-white focus:outline-none focus:border-accent-gold"
            />
            <button onClick={() => setShowPin(!showPin)} className="absolute right-3 top-3 text-gray-400">
              {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-xs text-red-400 bg-red-950/30 border border-red-500/30 p-2.5 rounded-xl">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleUnlock}
              className="flex-1 py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl transition"
            >
              Unlock Vault
            </button>
            <button
              onClick={() => setVaultUnlocked(true)}
              className="flex-1 py-2.5 bg-surface-card border border-stroke-default text-accent-gold text-xs font-bold rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <Fingerprint className="w-4 h-4" /> Biometric
            </button>
          </div>
          <p className="text-[10px] text-gray-500 font-mono">3-of-2 Shamir Social Recovery available if key is lost.</p>
        </div>
      ) : (
        /* Vault Contents */
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <ShieldCheck className="w-4 h-4" /> Vault Unlocked — End-to-End Encrypted
            </div>
            <button
              onClick={() => setVaultUnlocked(false)}
              className="text-xs text-red-400 hover:text-red-300 font-bold border border-red-500/30 px-3 py-1.5 rounded-lg transition"
            >
              Lock Vault
            </button>
          </div>

          {/* Vault Items */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { label: 'Aadhaar Card (Encrypted)', icon: Key, color: 'text-accent-gold' },
              { label: 'Passport Scan (Encrypted)', icon: Key, color: 'text-accent-blue' },
              { label: 'Will & Testament Draft', icon: Key, color: 'text-purple-400' },
              { label: 'Crypto Seed Phrase', icon: Flame, color: 'text-orange-400' },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="glass-card rounded-xl p-4 border border-stroke-default hover:border-accent-gold/40 transition cursor-pointer">
                  <div className="flex items-center space-x-3">
                    <div className="w-9 h-9 rounded-xl bg-surface flex items-center justify-center border border-stroke-default">
                      <Icon className={`w-4 h-4 ${item.color}`} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-gray-200 block">{item.label}</span>
                      <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
                        <ShieldCheck className="w-3 h-3" /> AES-256-GCM
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
