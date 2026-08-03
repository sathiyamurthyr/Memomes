import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  HardDrive, 
  Key, 
  Download, 
  CheckCircle2, 
  Zap 
} from 'lucide-react';

interface ProfileSettingsPageProps {
  userEmail?: string;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  userEmail = 'user@memomes.com'
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'security' | 'storage' | 'plan'>('profile');

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2 md:p-4">
      {/* Title */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-[#F5B700]" /> Account & Security Settings
        </h1>
        <p className="text-xs text-slate-400">Manage your profile, zero-knowledge encryption keys, storage plan, and devices.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'Account Profile', icon: User },
          { id: 'security', label: 'Security & Keys', icon: ShieldCheck },
          { id: 'storage', label: 'Storage & Backup', icon: HardDrive },
          { id: 'plan', label: 'Subscription Plan', icon: Zap }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2 transition-all shrink-0 ${
                isActive 
                  ? 'bg-[#F5B700] text-slate-950 shadow-md font-bold'
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-6 shadow-xl space-y-6">
          <div className="flex items-center gap-4 border-b border-white/10 pb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#F5B700] to-amber-500 text-slate-950 font-black text-xl flex items-center justify-center shadow-lg">
              {userEmail.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">{userEmail}</h2>
              <p className="text-xs text-amber-400 flex items-center gap-1 mt-0.5 font-mono">
                <ShieldCheck className="w-3.5 h-3.5" /> Pro Enterprise Plan — Active
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Account Email</label>
              <input
                type="email"
                disabled
                value={userEmail}
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/10 text-slate-400 text-xs font-mono"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">Vault Access Key ID</label>
              <input
                type="text"
                disabled
                value="MEMOMES-ZK-9982-KEY-SECURE"
                className="w-full h-10 px-3 rounded-xl bg-slate-900 border border-white/10 text-slate-400 text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-6 shadow-xl space-y-6">
          <div className="flex items-center justify-between border-b border-white/10 pb-4">
            <div className="flex items-center gap-2">
              <Key className="w-5 h-5 text-[#F5B700]" />
              <h2 className="text-base font-bold text-white">Zero-Knowledge Key Sharding</h2>
            </div>
            <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full font-mono">
              3 of 5 Key Shards Verified
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Memomes splits your master encryption key into 5 cryptographic shards using Shamir Secret Sharing. Your files remain completely inaccessible to anyone without your authorization.
          </p>

          <div className="p-4 rounded-2xl bg-slate-900 border border-white/5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Export Emergency Key Recovery File</span>
              <button className="btn-gold !h-8 !px-3 !text-xs">
                <Download className="w-3.5 h-3.5" /> Download Backup Shards
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Tab */}
      {activeTab === 'plan' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white">Standard Plan</h3>
              <span className="text-xs text-slate-400 font-mono">Free</span>
            </div>
            <p className="text-xs text-slate-400">15 GB Storage with basic sharing options.</p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> 15 GB Storage</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-400" /> AES-256 Encryption</li>
            </ul>
          </div>

          <div className="rounded-3xl bg-gradient-to-br from-amber-500/10 to-[#0F172A] border border-amber-500/40 p-6 space-y-4 relative shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#F5B700]" /> Pro Enterprise
              </h3>
              <span className="text-xs font-bold text-[#F5B700] bg-amber-500/10 px-2.5 py-1 rounded-full font-mono">
                Current Active Plan
              </span>
            </div>
            <p className="text-xs text-slate-300">500 GB Storage, Unlimited Zero-Knowledge Sharding, and Custom Watermarks.</p>
            <ul className="space-y-2 text-xs text-slate-200">
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#F5B700]" /> 500 GB Cloud Storage</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#F5B700]" /> Unlimited Zero-Knowledge Shards</li>
              <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-[#F5B700]" /> Custom Watermark & Burn-on-Read</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};
