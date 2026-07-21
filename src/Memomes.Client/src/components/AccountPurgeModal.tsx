import React, { useState } from 'react';
import { AlertTriangle, Trash2, History, ShieldAlert } from 'lucide-react';

interface AccountPurgeModalProps {
  userId: string;
  onClose: () => void;
  onPurgeComplete: () => void;
}

export const AccountPurgeModal: React.FC<AccountPurgeModalProps> = ({
  userId,
  onClose,
  onPurgeComplete
}) => {
  const [activeTab, setActiveTab] = useState<'dpdp' | 'rollback'>('dpdp');
  const [confirmPin, setConfirmPin] = useState('');
  const [rollbackHours, setRollbackHours] = useState('24');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleDPDPPurge = async () => {
    if (confirmPin !== 'DELETE') {
      alert("Please type 'DELETE' to confirm account purge under India DPDP Act.");
      return;
    }

    setIsProcessing(true);
    setStatusMessage("Cascading metadata deletion and Backblaze B2 DeleteObjects batch purge...");

    try {
      const res = await fetch('/api/account/purge', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, confirmationPin: confirmPin })
      });

      if (res.ok) {
        const data = await res.json();
        alert(data.message || "Account and all encrypted binary blobs destroyed.");
        onPurgeComplete();
      } else {
        alert("Failed to purge account.");
      }
    } catch (e: any) {
      alert("Purge error: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRollback = async () => {
    setIsProcessing(true);
    const rollbackPoint = new Date(Date.now() - parseInt(rollbackHours) * 3600 * 1000).toISOString();

    try {
      const res = await fetch('/api/vault/rollback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, rollbackPointUtc: rollbackPoint })
      });

      if (res.ok) {
        const data = await res.json();
        alert(`Ransomware Rollback Complete! Processed ${data.processedFilesCount} files to state prior to ${rollbackHours}h ago.`);
        onClose();
      }
    } catch (e: any) {
      alert("Rollback error: " + e.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4">
      <div className="relative max-w-lg w-full bg-surface-container border border-stroke-default rounded-2xl p-6 shadow-2xl">
        <div className="flex justify-between items-center mb-4 border-b border-stroke-default pb-3">
          <div className="flex items-center space-x-2">
            <ShieldAlert className="w-5 h-5 text-red-400" />
            <h3 className="font-bold text-gray-100">Compliance & Ransomware Vault Controls</h3>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-white">✕</button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-stroke-default mb-5">
          <button
            onClick={() => setActiveTab('dpdp')}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'dpdp' ? 'border-red-500 text-red-400' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Trash2 className="w-4 h-4" /> India DPDP Account Purge
          </button>
          <button
            onClick={() => setActiveTab('rollback')}
            className={`flex-1 py-2.5 text-xs font-semibold border-b-2 flex items-center justify-center gap-1.5 ${
              activeTab === 'rollback' ? 'border-accent-gold text-accent-gold' : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <History className="w-4 h-4" /> 1-Click Ransomware Rollback
          </button>
        </div>

        {activeTab === 'dpdp' ? (
          <div>
            <div className="p-3 bg-red-950/40 border border-red-500/30 rounded-xl mb-4 text-xs text-red-300">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
                <span>
                  <strong>India Digital Personal Data Protection (DPDP) Act Right to Erasure:</strong> This action will trigger a permanent cascade deletion of PostgreSQL records and issue batch <code>DeleteObjects</code> calls to Backblaze B2. This action is <strong>IRREVERSIBLE</strong>.
                </span>
              </div>
            </div>

            <label className="block text-xs font-medium text-gray-300 mb-2">
              Type <strong>DELETE</strong> below to confirm total data destruction:
            </label>
            <input
              type="text"
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Type DELETE"
              className="w-full bg-surface border border-stroke-default rounded-lg px-3 py-2 text-sm font-mono text-white mb-4 focus:outline-none focus:border-red-500"
            />

            <button
              onClick={handleDPDPPurge}
              disabled={isProcessing || confirmPin !== 'DELETE'}
              className="w-full py-2.5 px-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-800 disabled:text-gray-500 text-white rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              <span>{isProcessing ? 'Purging All Binary Blobs...' : 'Purge Account & Binary Blobs'}</span>
            </button>
          </div>
        ) : (
          <div>
            <div className="p-3 bg-amber-950/40 border border-amber-500/30 rounded-xl mb-4 text-xs text-amber-300">
              <p>
                <strong>Ransomware Rollback:</strong> Instantly revert all files modified or encrypted by malicious ransomware to their pristine historical version prior to your selected timestamp.
              </p>
            </div>

            <label className="block text-xs font-medium text-gray-300 mb-2">Revert Vault State To:</label>
            <select
              value={rollbackHours}
              onChange={(e) => setRollbackHours(e.target.value)}
              className="w-full bg-surface border border-stroke-default rounded-lg px-3 py-2 text-sm text-white mb-4 focus:outline-none focus:border-accent-gold"
            >
              <option value="1">1 Hour Ago</option>
              <option value="6">6 Hours Ago</option>
              <option value="24">24 Hours Ago (1 Day)</option>
              <option value="72">72 Hours Ago (3 Days)</option>
              <option value="168">7 Days Ago</option>
            </select>

            <button
              onClick={handleRollback}
              disabled={isProcessing}
              className="w-full py-2.5 px-4 bg-accent-gold hover:bg-amber-400 text-surface-container rounded-lg text-xs font-bold transition flex items-center justify-center gap-2"
            >
              <History className="w-4 h-4" />
              <span>{isProcessing ? 'Rolling Back Vault...' : `Rollback Vault (${rollbackHours}h ago)`}</span>
            </button>
          </div>
        )}

        {statusMessage && (
          <p className="mt-3 text-xs text-center font-mono text-gray-400">{statusMessage}</p>
        )}
      </div>
    </div>
  );
};
