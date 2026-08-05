import React, { useState, useEffect } from 'react';
import {
  Upload, Lock, Search, Share2, Flame, Play, Pause, ShieldCheck, Sparkles, ArrowRight
} from 'lucide-react';

export const InteractiveDemoSection: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const steps = [
    {
      id: 'upload',
      title: '1. Drag & Drop Upload',
      subtitle: 'Instant Client-Side Intake',
      icon: Upload,
      color: 'text-amber-400',
      description: 'Files are read in browser RAM. File payloads never touch remote servers unencrypted.',
      codeSnippet: `const payload = await file.arrayBuffer();\nconst nonce = window.crypto.getRandomValues(new Uint8Array(12));`
    },
    {
      id: 'encrypt',
      title: '2. AES-256-GCM Encryption',
      subtitle: 'Zero-Knowledge Cryptography',
      icon: Lock,
      color: 'text-emerald-400',
      description: 'Master keys derive 256-bit encryption keys using PBKDF2 with 100,000+ iterations locally.',
      codeSnippet: `const encryptedBuffer = await crypto.subtle.encrypt(\n  { name: 'AES-GCM', iv: nonce }, masterKey, payload\n);`
    },
    {
      id: 'ai-index',
      title: '3. AI Vector Semantic Indexing',
      subtitle: 'Privacy-Preserving AI',
      icon: Search,
      color: 'text-[#3B82F6]',
      description: 'Local vector embeddings index document contents for instant semantic AI queries without leaking text.',
      codeSnippet: `const embeddings = await aiEngine.embedVector(metadata);\nLocalSearchIndex.insert(fileId, embeddings);`
    },
    {
      id: 'share',
      title: '4. Encrypted Share Links',
      subtitle: 'Time & Access Restricted',
      icon: Share2,
      color: 'text-purple-400',
      description: 'Share zero-knowledge links with custom PIN access, view counters, and timed expiration.',
      codeSnippet: `const shareUrl = await SecureShare.createLink(fileId, {\n  expiryHours: 24, maxViews: 3, pinRequired: true\n});`
    },
    {
      id: 'revoke',
      title: '5. Instant Remote Revocation',
      subtitle: 'Complete Ownership Control',
      icon: Flame,
      color: 'text-rose-400',
      description: 'Revoke access anytime. Clears recipient RAM key buffers and destroys share link authorization.',
      codeSnippet: `await RemoteControl.revokeShareLink(shareId);\n// Purges recipient RAM keys instantly!`
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setActiveStep(prev => (prev + 1) % steps.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying, steps.length]);

  const currentStepData = steps[activeStep];
  const StepIcon = currentStepData.icon;

  return (
    <section id="demo" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      {/* Section Header */}
      <div className="text-center space-y-4 mb-14">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#F5B700] text-xs font-mono font-bold uppercase">
          <Sparkles className="w-3.5 h-3.5 text-[#F5B700]" />
          <span>Interactive Product Simulator</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          See Zero-Knowledge Storage In Action
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Watch how Memomes Cloud protects your files through every stage of the file lifecycle.
        </p>
      </div>

      {/* Step Buttons Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          const isActive = activeStep === idx;
          return (
            <button
              key={step.id}
              onClick={() => { setActiveStep(idx); setIsPlaying(false); }}
              className={`p-4 rounded-2xl border transition-all text-left flex flex-col justify-between cursor-pointer ${
                isActive
                  ? 'bg-amber-500/15 border-amber-500/50 shadow-[0_0_20px_rgba(245,183,0,0.2)]'
                  : 'bg-[#0F172A]/70 border-white/10 hover:border-white/20 text-slate-400'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-mono font-bold ${isActive ? 'text-[#F5B700]' : 'text-slate-500'}`}>
                  0{idx + 1}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? step.color : 'text-slate-500'}`} />
              </div>
              <div>
                <h4 className={`text-xs font-bold font-mono ${isActive ? 'text-white' : 'text-slate-300'}`}>
                  {step.title.split('. ')[1]}
                </h4>
                <p className="text-[10px] text-slate-400 truncate">{step.subtitle}</p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Interactive Display Card */}
      <div className="rounded-3xl bg-[#0F172A] border border-white/15 p-6 md:p-8 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-2xl bg-white/5 border border-white/10 ${currentStepData.color}`}>
              <StepIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">{currentStepData.title}</h3>
              <p className="text-xs text-slate-400 font-mono">{currentStepData.subtitle}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 flex items-center gap-2"
            >
              {isPlaying ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isPlaying ? 'Pause Auto Play' : 'Play Simulation'}</span>
            </button>

            <button
              onClick={onOpenAuth}
              className="btn-gold !h-8 !px-4 !text-xs font-mono font-bold"
            >
              <span>Test Live</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Content & Code Snippet */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
          <div className="md:col-span-6 space-y-4 text-left">
            <p className="text-sm text-slate-300 leading-relaxed font-sans">
              {currentStepData.description}
            </p>
            <div className="p-4 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2 text-xs font-mono">
              <div className="flex items-center gap-2 text-emerald-400 font-bold">
                <ShieldCheck className="w-4 h-4" /> Cryptographic Guarantee
              </div>
              <p className="text-slate-400 text-[11px]">
                Zero plaintext leakage. Plaintext files exist ONLY in client RAM during processing.
              </p>
            </div>
          </div>

          <div className="md:col-span-6">
            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 font-mono text-xs text-amber-300 space-y-2 overflow-x-auto shadow-inner">
              <div className="flex items-center justify-between text-[10px] text-slate-500 border-b border-white/5 pb-2">
                <span>MEMOMES_ENGINE_CORE.ts</span>
                <span className="text-emerald-400 font-bold">● EXECUTING</span>
              </div>
              <pre className="text-[11px] leading-relaxed text-slate-200">
                <code>{currentStepData.codeSnippet}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

    </section>
  );
};
