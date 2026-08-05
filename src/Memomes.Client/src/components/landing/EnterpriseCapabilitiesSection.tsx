import React from 'react';
import { Building2, ShieldCheck, Key, Layers, Terminal, Lock, ArrowRight } from 'lucide-react';

export const EnterpriseCapabilitiesSection: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const capabilities = [
    { title: 'Role-Based Access Control (RBAC)', desc: 'Assign granular Platform Admin, Developer, QA, and User permissions with strict attribute scoping.', icon: Key },
    { title: 'Immutable Compliance Audit Logs', desc: 'Log every file upload, download, share event, and remote revocation with developer identity and IP tracking.', icon: ShieldCheck },
    { title: 'Private AI Vector Search', desc: 'Deploy local vector embeddings for semantic document search without leaking data to public LLMs.', icon: Layers },
    { title: 'Unlimited Workspace Partitioning', desc: 'Support millions of isolated workspaceStorageIds (wrk_...) and userStorageIds (usr_...).', icon: Building2 },
    { title: 'Enterprise SSO & MFA Integration', desc: 'Integrate SAML 2.0, OpenID Connect, OAuth2, and hardware FIDO2 security keys seamlessly.', icon: Lock },
    { title: 'REST & GraphQL Developer APIs', desc: 'Automate file ingestion, encryption pipelines, and compliance exports using programmatically generated API keys.', icon: Terminal }
  ];

  return (
    <section id="enterprise" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-16">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#F5B700] text-xs font-mono font-bold uppercase">
          <Building2 className="w-3.5 h-3.5 text-[#F5B700]" />
          <span>Enterprise Scale</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          Enterprise Sovereignty & Security
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Scale to millions of users with dedicated tenant isolation and compliance readiness.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {capabilities.map((cap, idx) => {
          const Icon = cap.icon;
          return (
            <div
              key={idx}
              className="p-7 rounded-3xl bg-[#0F172A] border border-white/10 hover:border-amber-400/40 transition-all duration-300 group hover:scale-[1.02] shadow-xl space-y-4 text-left"
            >
              <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-[#F5B700] w-fit group-hover:scale-110 transition-transform">
                <Icon className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-white font-heading group-hover:text-[#F5B700] transition-colors">{cap.title}</h3>
              <p className="text-xs text-slate-300 leading-relaxed font-sans">{cap.desc}</p>
            </div>
          );
        })}
      </div>

      <div className="mt-12 text-center">
        <button
          onClick={onOpenAuth}
          className="btn-gold !h-12 !px-8 !text-sm font-mono font-bold inline-flex items-center gap-2 shadow-2xl"
        >
          <span>Request Enterprise Demo</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>

    </section>
  );
};
