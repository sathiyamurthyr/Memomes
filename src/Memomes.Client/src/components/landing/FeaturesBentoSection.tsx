import React from 'react';
import {
  Lock, Flame, Search, Share2, History, Copy,
  ShieldCheck, CheckCircle2
} from 'lucide-react';

export const FeaturesBentoSection: React.FC<{ onOpenAuth: () => void }> = () => {

  const features = [
    {
      id: 'encryption',
      title: 'Client-Side AES-256 Encryption',
      subtitle: 'Zero-Knowledge Cryptography',
      icon: Lock,
      color: 'from-amber-500/20 to-amber-600/10',
      borderColor: 'border-amber-500/30',
      iconColor: 'text-[#F5B700]',
      description: 'Your master password derives 256-bit cryptographic keys locally in browser memory using PBKDF2 with 100,000+ iterations. Zero plaintext keys are ever uploaded.',
      metrics: ['AES-256-GCM', 'PBKDF2-HMAC', '0% Server Plaintext']
    },
    {
      id: 'revoke',
      title: 'Remote Self-Destruct & Revoke',
      subtitle: 'Permanent Ownership Control',
      icon: Flame,
      color: 'from-rose-500/20 to-rose-600/10',
      borderColor: 'border-rose-500/30',
      iconColor: 'text-rose-400',
      description: 'Revoke access to shared files at any moment. Instantly purges recipient RAM decryption keys and invalidates presigned Backblaze storage URLs.',
      metrics: ['Instant RAM Purge', 'Link Destruction', 'Real-Time Kill Switch']
    },
    {
      id: 'ai-search',
      title: 'AI Powered Semantic Search',
      subtitle: 'Privacy-Preserving Intelligence',
      icon: Search,
      color: 'from-blue-500/20 to-blue-600/10',
      borderColor: 'border-blue-500/30',
      iconColor: 'text-cyan-400',
      description: 'Locally extract text and search documents, passports, tax forms, or audio recordings by natural language meaning without transmitting unencrypted text.',
      metrics: ['Vector Embeddings', 'OCR Scanner', 'Natural Language']
    },
    {
      id: 'sharing',
      title: 'Secure Zero-Knowledge Sharing',
      subtitle: 'Granular Access Policies',
      icon: Share2,
      color: 'from-purple-500/20 to-purple-600/10',
      borderColor: 'border-purple-500/30',
      iconColor: 'text-purple-400',
      description: 'Share links with custom PIN passwords, maximum view counts, timed expiration dates, and anti-screenshot capture shields.',
      metrics: ['PIN Protection', 'Max View Limits', 'Time Expiration']
    },
    {
      id: 'versioning',
      title: 'Immutable Version History',
      subtitle: 'Instant File Rollbacks',
      icon: History,
      color: 'from-emerald-500/20 to-emerald-600/10',
      borderColor: 'border-emerald-500/30',
      iconColor: 'text-emerald-400',
      description: 'Track complete version timelines for uploaded assets. Restore previous file states or review encrypted checksum diffs with a single click.',
      metrics: ['Version Timeline', 'SHA-256 Checksums', 'Instant Rollback']
    },
    {
      id: 'dedup',
      title: 'Intelligent Duplicate Detection',
      subtitle: 'Storage Optimization',
      icon: Copy,
      color: 'from-amber-400/20 to-[#F5B700]/10',
      borderColor: 'border-amber-400/30',
      iconColor: 'text-[#F5B700]',
      description: 'Automatically detects duplicate file hashes during upload, prompting version creation or storage consolidation to save space.',
      metrics: ['SHA-256 Hash Matching', 'Space Saver', 'Auto Versioning']
    }
  ];

  return (
    <section id="features" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      {/* Section Title */}
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-cyan-400 text-xs font-mono font-bold uppercase">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>Enterprise Feature Suite</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          Built For Absolute Confidentiality & Speed
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Every feature is engineered from the ground up for zero-knowledge privacy and seamless user experience.
        </p>
      </div>

      {/* Bento Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <div
              key={feat.id}
              className={`p-7 rounded-3xl bg-gradient-to-br ${feat.color} border ${feat.borderColor} hover:border-amber-400/50 transition-all duration-300 group hover:scale-[1.02] cursor-pointer shadow-xl flex flex-col justify-between space-y-6 relative overflow-hidden`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className={`p-3.5 rounded-2xl bg-white/10 border border-white/10 ${feat.iconColor} group-hover:scale-110 transition-transform`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase tracking-widest font-bold">
                    0{idx + 1} / FEATURE
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-white font-heading group-hover:text-[#F5B700] transition-colors">
                    {feat.title}
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{feat.subtitle}</p>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {feat.description}
                </p>
              </div>

              {/* Feature Metrics Chips */}
              <div className="pt-4 border-t border-white/10 flex flex-wrap gap-2">
                {feat.metrics.map(m => (
                  <span key={m} className="px-2.5 py-1 rounded-lg bg-black/40 border border-white/10 text-[10px] font-mono text-slate-300 font-bold flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                    <span>{m}</span>
                  </span>
                ))}
              </div>
            </div>
          );
        })}
      </div>

    </section>
  );
};
