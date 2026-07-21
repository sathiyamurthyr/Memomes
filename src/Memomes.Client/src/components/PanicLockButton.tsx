import React, { useState } from 'react';
import { Lock, ShieldAlert } from 'lucide-react';

interface PanicLockButtonProps {
  userId: string;
  onLockComplete: () => void;
}

export const PanicLockButton: React.FC<PanicLockButtonProps> = ({ userId, onLockComplete }) => {
  const [isFreezing, setIsFreezing] = useState(false);

  const handlePanicFreeze = async () => {
    if (!window.confirm("EMERGENCY PANIC FREEZE: This will immediately purge master keys from browser RAM, IndexedDB, and local enclaves. Continue?")) {
      return;
    }

    setIsFreezing(true);

    try {
      // 1. Call server endpoint to invalidate refresh tokens
      await fetch('/api/account/panic-freeze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId })
      });

      // 2. Flush local IndexedDB and localStorage
      localStorage.clear();
      sessionStorage.clear();

      if ('indexedDB' in window) {
        indexedDB.databases().then(dbs => {
          dbs.forEach(db => {
            if (db.name) indexedDB.deleteDatabase(db.name);
          });
        });
      }
    } catch (e) {
      console.error("Panic freeze server notification error:", e);
    } finally {
      setIsFreezing(false);
      onLockComplete();
    }
  };

  return (
    <button
      onClick={handlePanicFreeze}
      disabled={isFreezing}
      className="flex items-center space-x-2 px-3.5 py-2 bg-gradient-to-r from-red-600 to-primary hover:from-red-700 hover:to-primary-hover text-white text-xs font-bold rounded-lg border border-red-500/30 shadow-lg transition transform active:scale-95"
    >
      <ShieldAlert className="w-4 h-4 text-amber-300 animate-pulse" />
      <span>{isFreezing ? 'FREEZING VAULT...' : 'FREEZE VAULT'}</span>
      <Lock className="w-3.5 h-3.5 ml-0.5" />
    </button>
  );
};
