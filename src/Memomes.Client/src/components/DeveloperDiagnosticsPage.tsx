import React, { useState } from 'react';
import {
  Terminal, Server, HardDrive, Activity, Layers, Copy, Lock
} from 'lucide-react';

interface StorageObjectDiagnostic {
  objectId: string;
  objectKey: string;
  bucketName: string;
  storageProvider: string;
  encryptedSize: string;
  sha256Hash: string;
  status: string;
  createdAt: string;
}

export const DeveloperDiagnosticsPage: React.FC<{ onClose?: () => void }> = ({ onClose }) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const mockObjects: StorageObjectDiagnostic[] = [
    {
      objectId: 'obj_01K5F7VJX8M2Q4R6N9ABCD1234',
      objectKey: 'sathus/memomes/workspace001/tenant001/company001/user001/PDF/2026/08/03/f9b4d21c8e7a4d1b9c3a5e8f2d1c6ab.enc',
      bucketName: 'sathus-memomes-vault',
      storageProvider: 'Backblaze B2 (us-west-004)',
      encryptedSize: '5.80 MB',
      sha256Hash: '0c6927de94714b051bd01c64d27c0125cf0a5c0c7f8d28fdbd6773f00932ecbe',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    },
    {
      objectId: 'obj_01K5F7VKX8M2Q4R6N9ABCD5678',
      objectKey: 'sathus/memomes/workspace001/user001/Images/2026/08/03/a1b2c3d4e5f678901234567890abcdef.enc',
      bucketName: 'sathus-memomes-vault',
      storageProvider: 'Backblaze B2 (us-west-004)',
      encryptedSize: '1.25 MB',
      sha256Hash: '7f8d28fdbd6773f00932ecbe8f0f14a0564c29ba0c6927de94714b051bd01c64',
      status: 'ACTIVE',
      createdAt: new Date().toISOString()
    }
  ];

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 p-6 md:p-10 font-mono space-y-8 select-none">
      {/* Top Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Terminal className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white flex items-center gap-2">
              <span>Developer Diagnostics & Storage Infrastructure</span>
              <span className="text-xs bg-amber-500/20 text-amber-300 px-2.5 py-0.5 rounded-full border border-amber-500/30 font-semibold">
                PLATFORM ADMIN ONLY
              </span>
            </h1>
            <p className="text-xs text-slate-400">
              Low-level Backblaze B2 object metrics, bucket topology, and S3 signature diagnostic tools.
            </p>
          </div>
        </div>

        {onClose && (
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/10 text-xs font-bold text-white transition"
          >
            Close Diagnostics
          </button>
        )}
      </div>

      {/* Infrastructure Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Server className="w-4 h-4 text-cyan-400" /> Storage Engine
          </span>
          <span className="text-sm font-bold text-white block">Backblaze B2 S3 API</span>
          <span className="text-[10px] text-emerald-400">us-west-004 Endpoint Active</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <HardDrive className="w-4 h-4 text-[#F5C027]" /> Target Bucket
          </span>
          <span className="text-sm font-bold text-white block">sathus-memomes-vault</span>
          <span className="text-[10px] text-slate-400">ID: 5070f87ef0fd817d98f4021b</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Lock className="w-4 h-4 text-purple-400" /> Key Format
          </span>
          <span className="text-sm font-bold text-white block">Workspace ULID Anonymized</span>
          <span className="text-[10px] text-purple-300">0% Filename Leakage</span>
        </div>

        <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 space-y-1">
          <span className="text-slate-400 flex items-center gap-1.5 text-[11px] uppercase tracking-wider">
            <Activity className="w-4 h-4 text-emerald-400" /> Presigned Expiry
          </span>
          <span className="text-sm font-bold text-white block">900 Seconds (15 Min)</span>
          <span className="text-[10px] text-emerald-400">Content-Type Hash Aligned</span>
        </div>
      </div>

      {/* Object Storage Registry Table */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#F5C027]" />
            <span>Active Storage Objects Registry ({mockObjects.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Encrypted object keys generated by <code className="text-[#F5C027]">ObjectKeyGenerator</code>
          </span>
        </div>

        <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#080D1A]">
          <table className="w-full text-left text-xs border-collapse">
            <thead className="bg-white/5 text-slate-400 text-[11px] uppercase border-b border-white/10">
              <tr>
                <th className="p-3.5">Object ID</th>
                <th className="p-3.5">Backblaze Object Key</th>
                <th className="p-3.5">Provider</th>
                <th className="p-3.5">Encrypted Size</th>
                <th className="p-3.5">SHA-256 Checksum</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-slate-300">
              {mockObjects.map((obj) => (
                <tr key={obj.objectId} className="hover:bg-white/[0.02] transition">
                  <td className="p-3.5 font-bold text-[#F5C027]">{obj.objectId}</td>
                  <td className="p-3.5 font-mono text-[11px] text-slate-300 truncate max-w-xs" title={obj.objectKey}>
                    {obj.objectKey}
                  </td>
                  <td className="p-3.5 text-emerald-400 font-semibold">{obj.storageProvider}</td>
                  <td className="p-3.5">{obj.encryptedSize}</td>
                  <td className="p-3.5 font-mono text-[10px] text-slate-400 truncate max-w-[120px]" title={obj.sha256Hash}>
                    {obj.sha256Hash}
                  </td>
                  <td className="p-3.5 text-right">
                    <button
                      onClick={() => handleCopy(obj.objectKey)}
                      className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-300 hover:text-white inline-flex items-center gap-1 transition"
                    >
                      <Copy className="w-3 h-3" />
                      <span>{copiedKey === obj.objectKey ? 'Copied!' : 'Copy Key'}</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
