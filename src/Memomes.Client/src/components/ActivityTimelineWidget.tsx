import React from 'react';
import { 
  Eye, 
  ShieldAlert, 
  Clock, 
  Upload, 
  Sparkles, 
  ArrowUpRight 
} from 'lucide-react';

interface ActivityTimelineWidgetProps {
  onOpenActivityPage?: () => void;
}

export const ActivityTimelineWidget: React.FC<ActivityTimelineWidgetProps> = ({
  onOpenActivityPage
}) => {
  const events = [
    {
      id: 1,
      type: 'Viewed',
      title: 'Shared link viewed by guest',
      target: 'Q3_Financial_Audit_2025.pdf',
      time: '10 mins ago',
      ip: '198.51.100.42 (US)',
      icon: Eye,
      color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
    },
    {
      id: 2,
      type: 'Blocked',
      title: 'Download attempt blocked',
      target: 'Confidential_Passport_Scan.pdf',
      time: '45 mins ago',
      ip: '203.0.113.19 (DE)',
      icon: ShieldAlert,
      color: 'text-amber-400 bg-amber-500/10 border-amber-500/20'
    },
    {
      id: 3,
      type: 'Uploaded',
      title: 'Encrypted payload stored',
      target: 'Tax_Return_Form_1040_2025.pdf',
      time: '2 hours ago',
      ip: 'Local Vault Sync',
      icon: Upload,
      color: 'text-blue-400 bg-blue-500/10 border-blue-500/20'
    },
    {
      id: 4,
      type: 'AI Search',
      title: 'Zero-Knowledge semantic index queried',
      target: 'Query: "Find tax invoices from 2025"',
      time: '3 hours ago',
      ip: 'Local Device Session',
      icon: Sparkles,
      color: 'text-purple-400 bg-purple-500/10 border-purple-500/20'
    }
  ];

  return (
    <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-5 md:p-6 shadow-xl space-y-4">
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-[#F5B700]" />
          <h3 className="text-sm font-bold text-white">Live Activity & Access Log</h3>
        </div>
        <button 
          onClick={onOpenActivityPage}
          className="text-xs text-[#F5B700] hover:underline font-semibold flex items-center gap-1"
        >
          <span>Full Audit Log</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      </div>

      <div className="space-y-3 relative before:absolute before:left-4 before:top-2 before:bottom-2 before:w-0.5 before:bg-white/10">
        {events.map((evt) => {
          const Icon = evt.icon;
          return (
            <div key={evt.id} className="relative pl-9 flex items-start justify-between text-xs">
              {/* Timeline Marker Icon */}
              <div className={`absolute left-0 top-0.5 p-1.5 rounded-xl border ${evt.color} shadow-sm`}>
                <Icon className="w-3.5 h-3.5" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{evt.title}</span>
                  <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-1.5 py-0.5 rounded border border-white/5">
                    {evt.type}
                  </span>
                </div>
                <p className="text-slate-300 font-mono text-[11px] mt-0.5">{evt.target}</p>
              </div>

              <div className="text-right shrink-0">
                <span className="text-[11px] text-slate-400 font-mono block">{evt.time}</span>
                <span className="text-[10px] text-slate-500 font-mono block">{evt.ip}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
