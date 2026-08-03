import React from 'react';
import { 
  HardDrive, 
  ArrowUpRight 
} from 'lucide-react';

interface StorageAnalyticsWidgetProps {
  onUpgradeClick?: () => void;
}

export const StorageAnalyticsWidget: React.FC<StorageAnalyticsWidgetProps> = ({
  onUpgradeClick
}) => {
  const categories = [
    { name: 'Documents & PDFs', size: '64.2 GB', count: '1,240 files', color: 'bg-amber-400', pct: 42 },
    { name: 'High-Res Media', size: '52.8 GB', count: '3,850 items', color: 'bg-blue-400', pct: 35 },
    { name: 'Encrypted Vault', size: '24.0 GB', count: '180 files', color: 'bg-emerald-400', pct: 15 },
    { name: 'Shared Copies', size: '12.0 GB', count: '45 files', color: 'bg-purple-400', pct: 8 },
  ];

  return (
    <div className="rounded-3xl bg-[#0F172A] border border-white/10 p-5 md:p-6 shadow-xl space-y-4">
      {/* Title */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-[#F5B700]" />
          <h3 className="text-sm font-bold text-white">Storage Breakdown</h3>
        </div>
        <span className="text-xs font-mono text-slate-400">153 GB / 500 GB (30%)</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Radial Chart Visual */}
        <div className="relative w-36 h-36 shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-800"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Documents - Amber */}
            <path
              className="text-amber-400"
              strokeDasharray="42, 100"
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Media - Blue */}
            <path
              className="text-blue-400"
              strokeDasharray="35, 100"
              strokeDashoffset="-42"
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            {/* Vault - Emerald */}
            <path
              className="text-emerald-400"
              strokeDasharray="15, 100"
              strokeDashoffset="-77"
              strokeWidth="3.5"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className="text-lg font-black text-white font-mono">153 GB</span>
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-mono">Used</span>
          </div>
        </div>

        {/* Category Details */}
        <div className="flex-1 w-full space-y-2">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex items-center justify-between text-xs p-1.5 rounded-xl hover:bg-slate-900/60 transition-colors">
              <div className="flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${cat.color}`} />
                <span className="text-slate-300 font-medium">{cat.name}</span>
              </div>
              <div className="flex items-center gap-3 font-mono">
                <span className="text-slate-500 text-[11px]">{cat.count}</span>
                <span className="text-white font-bold">{cat.size}</span>
              </div>
            </div>
          ))}

          <button
            onClick={onUpgradeClick}
            className="w-full mt-2 py-2 rounded-xl bg-slate-900 border border-white/10 hover:border-amber-500/40 text-amber-400 font-semibold text-xs transition-all flex items-center justify-center gap-1.5 hover:bg-amber-500/10"
          >
            <span>Expand Storage Limit to 2TB</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
