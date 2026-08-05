import React, { useState } from 'react';
import { User, GraduationCap, Briefcase, Building2, Stethoscope, Scale, Landmark, BookOpen, ArrowRight } from 'lucide-react';

export const UseCasesSection: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const [activeTab, setActiveTab] = useState('personal');

  const useCases = [
    { id: 'personal', label: 'Personal', icon: User, title: 'Personal Vault & Family Privacy', desc: 'Store passport scans, birth certificates, medical history, and personal photos with 100% zero-knowledge privacy.' },
    { id: 'students', label: 'Students', icon: GraduationCap, title: 'Academic Research & Transcripts', desc: 'Encrypt thesis drafts, transcripts, research papers, and lab notebooks with single-use share links.' },
    { id: 'freelancers', label: 'Freelancers', icon: Briefcase, title: 'Client Portfolios & Contracts', desc: 'Share draft work and design assets with remote revocation and anti-screenshot capture protection.' },
    { id: 'business', label: 'Business', icon: Building2, title: 'Team Collaboration & Assets', desc: 'Manage team files with role-based access control, automated version history, and duplicate detection.' },
    { id: 'enterprise', label: 'Enterprise', icon: Building2, title: 'Multi-Tenant Sovereignty', desc: 'Deploy dedicated tenant storage hierarchies, SSO integration, compliance audit logs, and custom domain endpoints.' },
    { id: 'healthcare', label: 'Healthcare', icon: Stethoscope, title: 'HIPAA Compliant Patient Records', desc: 'Protect patient records and diagnostic imaging with AES-256-GCM client encryption.' },
    { id: 'legal', label: 'Legal', icon: Scale, title: 'Confidential Case Discovery', desc: 'Share evidence files and deposition transcripts with self-destructing burn links and watermarks.' },
    { id: 'finance', label: 'Finance', icon: Landmark, title: 'Tax & Financial Audit Archives', desc: 'Secure tax forms, audit reports, and banking credentials with PBKDF2 100k iteration key derivation.' },
    { id: 'education', label: 'Education', icon: BookOpen, title: 'Institutional Research Vaults', desc: 'Protect institutional intellectual property, grant applications, and student record databases.' }
  ];

  const currentCase = useCases.find(uc => uc.id === activeTab) || useCases[0];
  const CaseIcon = currentCase.icon;

  return (
    <section id="use-cases" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#F5B700] text-xs font-mono font-bold uppercase">
          <span>Tailored Solutions</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          Designed For Every Industry & Use Case
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto">
          Explore how Memomes Cloud adapts to individuals, professionals, and enterprise organizations.
        </p>
      </div>

      {/* Tabs Row */}
      <div className="flex items-center gap-2 overflow-x-auto pb-3 mb-8 scrollbar-none">
        {useCases.map(uc => {
          const Icon = uc.icon;
          const isActive = activeTab === uc.id;
          return (
            <button
              key={uc.id}
              onClick={() => setActiveTab(uc.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-mono font-bold flex items-center gap-2 transition-all shrink-0 cursor-pointer ${
                isActive
                  ? 'bg-[#F5B700] text-slate-950 shadow-lg scale-105'
                  : 'bg-[#0F172A] border border-white/10 text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{uc.label}</span>
            </button>
          );
        })}
      </div>

      {/* Active Tab Detail Display Card */}
      <div className="rounded-3xl bg-[#0F172A] border border-white/15 p-8 shadow-2xl space-y-6">
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#F5B700]">
              <CaseIcon className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white font-heading">{currentCase.title}</h3>
              <p className="text-xs text-slate-400 font-mono">Industry Solution Tier</p>
            </div>
          </div>

          <button
            onClick={onOpenAuth}
            className="btn-gold !h-9 !px-4 !text-xs font-mono font-bold"
          >
            <span>Start Free</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-sm text-slate-300 leading-relaxed font-sans max-w-3xl">
          {currentCase.desc}
        </p>
      </div>

    </section>
  );
};
