import React from 'react';
import { 
  ShieldCheck, 
  Lock, 
  Eye, 
  Smartphone, 
  CheckCircle2, 
  KeyRound,
  ExternalLink
} from 'lucide-react';

interface SecurityStatusWidgetProps {
  onOpenControlCenter?: () => void;
}

export const SecurityStatusWidget: React.FC<SecurityStatusWidgetProps> = ({
  onOpenControlCenter
}) => {
  const securityItems = [
    {
      title: 'AES-256 Encryption',
      status: 'Active',
      desc: 'Client-side hardware accelerated payload encryption.',
      icon: Lock,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10'
    },
    {
      title: 'Zero-Knowledge Vault',
      status: 'Enforced',
      desc: 'Sharded key architecture. No server key persistence.',
      icon: KeyRound,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10'
    },
    {
      title: 'Protected Share Links',
      status: '12 Links Active',
      desc: 'Burn-on-read & dynamic watermark overlay enforced.',
      icon: Eye,
      color: 'text-blue-400',
      bg: 'bg-blue-500/10'
    },
    {
      title: 'Device & IP Logins',
      status: '2 Sessions Verified',
      desc: 'Trusted location verification active.',
      icon: Smartphone,
      color: 'text-purple-400',
      bg: 'bg-purple-500/10'
    }
  ];

  return (
    <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-5 md:p-6 shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <span>Security & Trust Center</span>
              <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full font-mono">
                Optimal
              </span>
            </h3>
            <p className="text-xs text-slate-400">End-to-end protection for all active storage & shared assets.</p>
          </div>
        </div>

        <button
          onClick={onOpenControlCenter}
          className="text-xs text-[#F5B700] hover:underline font-semibold flex items-center gap-1"
        >
          <span>Manage Rules</span>
          <ExternalLink className="w-3 h-3" />
        </button>
      </div>

      {/* Grid of Security Highlights */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {securityItems.map((item, index) => {
          const Icon = item.icon;
          return (
            <div
              key={index}
              className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/5 hover:border-white/15 transition-all flex items-start gap-3"
            >
              <div className={`p-2 rounded-xl ${item.bg} ${item.color} shrink-0 mt-0.5`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="text-xs font-semibold text-white">{item.title}</h4>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> {item.status}
                  </span>
                </div>
                <p className="text-[11px] text-slate-400 leading-tight">
                  {item.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
