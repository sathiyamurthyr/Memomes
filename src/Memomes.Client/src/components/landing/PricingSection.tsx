import React, { useState } from 'react';
import { Check, Zap, ArrowRight } from 'lucide-react';

export const PricingSection: React.FC<{ onOpenAuth: () => void }> = ({ onOpenAuth }) => {
  const [isYearly, setIsYearly] = useState(true);

  const plans = [
    {
      name: 'Free Vault',
      priceMonthly: '$0',
      priceYearly: '$0',
      period: 'forever',
      desc: 'Ideal for individuals testing zero-knowledge file storage.',
      badge: 'Free Forever',
      isPopular: false,
      features: [
        '5 GB Zero-Knowledge Vault Storage',
        'Client-Side AES-256-GCM Encryption',
        'Standard Encrypted Share Links',
        'Basic AI Search Engine',
        'Community Support'
      ]
    },
    {
      name: 'Personal Pro',
      priceMonthly: '$9',
      priceYearly: '$7',
      period: 'per month',
      desc: 'For power users needing unlimited remote revocations and AI indexing.',
      badge: 'Most Popular',
      isPopular: true,
      features: [
        '500 GB Zero-Knowledge Vault Storage',
        'Unlimited Remote Revocations',
        'Anti-Screenshot & Capture Shield',
        'Burn-on-Read & Timed Expiration',
        'Priority AI Semantic Search',
        'Immutable Version History'
      ]
    },
    {
      name: 'Business Team',
      priceMonthly: '$29',
      priceYearly: '$23',
      period: 'per seat / month',
      desc: 'For teams collaborating with shared workspaces and audit trails.',
      badge: 'For Teams',
      isPopular: false,
      features: [
        '2 TB Shared Workspace Storage',
        'Role-Based Access Control (RBAC)',
        'Compliance Audit Logging Engine',
        'Duplicate Detection Engine',
        'Access Approval Request Workflow',
        '24/7 Priority Support'
      ]
    },
    {
      name: 'Enterprise Custom',
      priceMonthly: 'Custom',
      priceYearly: 'Custom',
      period: 'tailored billing',
      desc: 'Dedicated tenant isolation, custom SLAs, and developer APIs.',
      badge: 'Enterprise',
      isPopular: false,
      features: [
        'Unlimited Workspace & User IDs',
        'Dedicated Tenant Hierarchy Isolation',
        'SAML 2.0 / OpenID Connect SSO',
        'Custom Storage Endpoints (B2 / S3)',
        'REST & GraphQL Developer APIs',
        'Dedicated Account Executive & SLA'
      ]
    }
  ];

  return (
    <section id="pricing" className="relative z-10 py-20 px-6 max-w-7xl mx-auto font-sans select-none">
      
      <div className="text-center space-y-4 mb-12">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-[#F5B700] text-xs font-mono font-bold uppercase">
          <Zap className="w-3.5 h-3.5 text-[#F5B700]" />
          <span>Transparent Pricing</span>
        </div>
        <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight font-heading">
          Simple, Predictable Plans
        </h2>
        <p className="text-sm text-slate-300 max-w-xl mx-auto leading-relaxed">
          Start for free with 5GB. Upgrade as your zero-knowledge storage needs grow.
        </p>

        {/* Monthly / Yearly Toggle Switch */}
        <div className="flex items-center justify-center gap-3 pt-4">
          <span className={`text-xs font-mono font-bold ${!isYearly ? 'text-[#F5B700]' : 'text-slate-400'}`}>Monthly</span>
          <button
            onClick={() => setIsYearly(!isYearly)}
            className="w-14 h-8 rounded-full bg-[#0F172A] border border-white/20 p-1 relative transition-colors cursor-pointer"
          >
            <div className={`w-6 h-6 rounded-full bg-[#F5B700] transition-transform ${isYearly ? 'translate-x-6' : 'translate-x-0'}`} />
          </button>
          <span className={`text-xs font-mono font-bold flex items-center gap-1.5 ${isYearly ? 'text-[#F5B700]' : 'text-slate-400'}`}>
            <span>Yearly</span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30">
              Save 20%
            </span>
          </span>
        </div>
      </div>

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((p, idx) => (
          <div
            key={idx}
            className={`p-7 rounded-3xl border transition-all duration-300 flex flex-col justify-between space-y-6 relative ${
              p.isPopular
                ? 'bg-gradient-to-b from-amber-500/15 via-[#0F172A] to-amber-600/10 border-amber-500/50 shadow-[0_0_35px_rgba(245,183,0,0.25)] scale-105 z-10'
                : 'bg-[#0F172A]/80 border-white/10 hover:border-white/20'
            }`}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-slate-400 uppercase">{p.name}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-mono font-bold ${
                  p.isPopular ? 'bg-[#F5B700] text-slate-950' : 'bg-white/10 text-slate-300'
                }`}>
                  {p.badge}
                </span>
              </div>

              <div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-black text-white font-mono">{isYearly ? p.priceYearly : p.priceMonthly}</span>
                  <span className="text-xs text-slate-400 font-mono">/ {p.period}</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed font-sans">{p.desc}</p>
              </div>

              <div className="space-y-2.5 pt-4 border-t border-white/10 text-xs">
                {p.features.map(f => (
                  <div key={f} className="flex items-start gap-2 text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </div>
                ))}
              </div>
            </div>

            <button
              onClick={onOpenAuth}
              className={`w-full py-3 rounded-2xl text-xs font-mono font-bold transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer ${
                p.isPopular
                  ? 'bg-gradient-to-r from-[#F5B700] to-amber-500 text-slate-950 hover:brightness-110'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/10'
              }`}
            >
              <span>Get Started</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

    </section>
  );
};
