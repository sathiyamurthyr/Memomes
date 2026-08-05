import React, { useState } from 'react';
import { 
  User, 
  ShieldCheck, 
  HardDrive, 
  Key, 
  Download, 
  CheckCircle2, 
  Zap,
  Volume2,
  Vibrate,
  Sparkles,
  Eye,
  Sliders,
  Terminal
} from 'lucide-react';
import { FeedbackEngine, type FeedbackSettings } from '../utils/feedbackEngine';
import { DevelopmentResetCenter } from '../components/DevelopmentResetCenter';

interface ProfileSettingsPageProps {
  userEmail?: string;
  onResetComplete?: () => void;
}

export const ProfileSettingsPage: React.FC<ProfileSettingsPageProps> = ({
  userEmail = 'user@memomes.com',
  onResetComplete
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'sensory' | 'security' | 'storage' | 'plan' | 'devtools'>('profile');
  const [feedbackConfig, setFeedbackConfig] = useState<FeedbackSettings>(FeedbackEngine.getSettings());

  const handleToggle = (key: keyof FeedbackSettings) => {
    const updated = { ...feedbackConfig, [key]: !feedbackConfig[key] };
    setFeedbackConfig(updated);
    FeedbackEngine.saveSettings(updated);

    if (key === 'soundEnabled' && updated.soundEnabled) {
      FeedbackEngine.trigger('level1_subtle');
    } else if (key === 'hapticsEnabled' && updated.hapticsEnabled) {
      FeedbackEngine.triggerHaptic(30);
    }
  };

  const testFeedback = (level: any) => {
    FeedbackEngine.trigger(level);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-2 md:p-4 font-sans text-slate-100">
      {/* Title */}
      <div className="border-b border-white/10 pb-4">
        <h1 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
          <User className="w-6 h-6 text-[#F5B700]" /> Account & System Settings
        </h1>
        <p className="text-xs text-slate-400">Manage your profile, multi-sensory feedback preferences, zero-knowledge keys, storage plan, and developer tools.</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
        {[
          { id: 'profile', label: 'Account Profile', icon: User },
          { id: 'sensory', label: 'Multi-Sensory Feedback', icon: Sliders },
          { id: 'security', label: 'Security & Keys', icon: ShieldCheck },
          { id: 'storage', label: 'Storage & Backup', icon: HardDrive },
          { id: 'plan', label: 'Subscription Plan', icon: Zap },
          { id: 'devtools', label: 'Developer Tools', icon: Terminal }
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

      {/* Developer Tools / Development Reset Center Tab */}
      {activeTab === 'devtools' && (
        <DevelopmentResetCenter
          userRole="Platform Administrator"
          userEmail={userEmail}
          onResetComplete={onResetComplete}
        />
      )}

      {/* Sensory Feedback Settings Tab */}
      {activeTab === 'sensory' && (
        <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-6 shadow-xl space-y-6 font-sans">
          <div className="border-b border-white/10 pb-4">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sliders className="w-5 h-5 text-[#F5C027]" /> Multi-Sensory Feedback Preferences
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Customize tactile haptics, synthesized audio chimes, and celebration particle animations.
            </p>
          </div>

          <div className="space-y-4">
            {/* Sound Effects Toggle */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-cyan-400" /> Audio Chimes & Sound Effects
                </span>
                <p className="text-[11px] text-slate-400">Play soft synthesized Web Audio chimes for button clicks and upload events.</p>
              </div>
              <button
                onClick={() => handleToggle('soundEnabled')}
                className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                  feedbackConfig.soundEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Haptic Vibration Toggle */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Vibrate className="w-4 h-4 text-purple-400" /> Native Mobile Haptic Vibrations
                </span>
                <p className="text-[11px] text-slate-400">Trigger subtle haptic motor pulses on supported mobile & touchscreen devices.</p>
              </div>
              <button
                onClick={() => handleToggle('hapticsEnabled')}
                className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                  feedbackConfig.hapticsEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Celebration Animations Toggle */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F5C027]" /> Golden Celebration Particles
                </span>
                <p className="text-[11px] text-slate-400">Display luxury gold particle confetti when uploads complete successfully.</p>
              </div>
              <button
                onClick={() => handleToggle('celebrationsEnabled')}
                className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                  feedbackConfig.celebrationsEnabled ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Reduced Motion Toggle */}
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/10 flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <Eye className="w-4 h-4 text-emerald-400" /> Reduced Motion & Accessibility
                </span>
                <p className="text-[11px] text-slate-400">Minimize heavy layout animations and respect operating system accessibility rules.</p>
              </div>
              <button
                onClick={() => handleToggle('reducedMotion')}
                className={`w-12 h-6 rounded-full transition-colors p-1 flex items-center ${
                  feedbackConfig.reducedMotion ? 'bg-emerald-500 justify-end' : 'bg-slate-700 justify-start'
                }`}
              >
                <span className="w-4 h-4 rounded-full bg-white shadow-md" />
              </button>
            </div>

            {/* Interactive Feedback Level Preview Buttons */}
            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 space-y-3 pt-4">
              <span className="text-xs font-bold text-slate-300 block font-mono">Test Feedback Levels Live:</span>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 font-mono text-[11px]">
                <button onClick={() => testFeedback('level1_subtle')} className="py-2 px-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-slate-300 font-bold">
                  Level 1: Subtle
                </button>
                <button onClick={() => testFeedback('level2_success')} className="py-2 px-2 bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-bold">
                  Level 2: Success
                </button>
                <button onClick={() => testFeedback('level3_major')} className="py-2 px-2 bg-[#F5C027]/15 border border-[#F5C027]/30 text-[#F5C027] font-bold">
                  Level 3: Major
                </button>
                <button onClick={() => testFeedback('level4_warning')} className="py-2 px-2 bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold">
                  Level 4: Warning
                </button>
                <button onClick={() => testFeedback('level5_critical')} className="py-2 px-2 bg-red-500/15 border border-red-500/30 text-red-400 font-bold">
                  Level 5: Critical
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
