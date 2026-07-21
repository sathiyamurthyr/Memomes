import React from 'react';
import { SecurityPanelV2 } from '../components/SecurityPanelV2';
import { RecentActivityTimeline } from '../components/RecentActivityTimeline';
import { SharingAnalytics } from '../components/SharingAnalytics';
import { HardDrive, ShieldCheck, TrendingUp, Link, Upload } from 'lucide-react';
import type { FileItem } from '../components/DashboardV2';

interface DashboardPageProps {
  files: FileItem[];
  onNavigateToMyFiles: () => void;
  onOpenShareModal: (file: FileItem) => void;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({
  files,
  onNavigateToMyFiles,
  onOpenShareModal
}) => {
  const recentUploads = files.slice(0, 3);

  return (
    <div className="space-y-8">
      {/* KPI Summary Header Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Files Stored', value: `${files.length}`, icon: HardDrive, color: 'text-accent-gold' },
          { label: 'Security Score', value: '98/100', icon: ShieldCheck, color: 'text-emerald-400' },
          { label: 'Active Shares', value: '8', icon: Link, color: 'text-accent-blue' },
          { label: 'Storage Used', value: '1.05 GB', icon: TrendingUp, color: 'text-purple-400' },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <div key={i} className="glass-card rounded-2xl p-5 border border-stroke-default">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-gray-400">{kpi.label}</span>
                <Icon className={`w-4 h-4 ${kpi.color}`} />
              </div>
              <span className="text-2xl font-extrabold text-white">{kpi.value}</span>
            </div>
          );
        })}
      </div>

      {/* Storage Allocation & Security Panel */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 glass-card rounded-2xl p-6 border border-stroke-default">
          <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2 mb-4">
            <HardDrive className="w-4 h-4 text-accent-gold" /> Storage Allocation Breakdown
          </h3>
          <div className="text-xs text-gray-400 mb-3">1.05 GB of 100 GB Used (1.05%)</div>
          <div className="w-full h-3.5 bg-surface border border-stroke-default rounded-full overflow-hidden flex mb-5">
            <div className="bg-primary h-full" style={{ width: '15%' }} />
            <div className="bg-accent-gold h-full" style={{ width: '8%' }} />
            <div className="bg-accent-blue h-full" style={{ width: '4%' }} />
            <div className="bg-accent-green h-full" style={{ width: '40%' }} />
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {[
              { label: 'Video (154 MB)', color: 'bg-primary' },
              { label: 'Photo (45 MB)', color: 'bg-accent-gold' },
              { label: 'Docs (4.2 MB)', color: 'bg-accent-blue' },
              { label: 'Archive (850 MB)', color: 'bg-accent-green' },
            ].map((item, i) => (
              <div key={i} className="flex items-center space-x-2 bg-surface p-2 rounded-lg border border-stroke-default">
                <span className={`w-2.5 h-2.5 rounded-full ${item.color}`} />
                <span className="text-gray-300 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <SecurityPanelV2 />
      </div>

      {/* Recent Uploads Summary Widget */}
      <div className="glass-card rounded-2xl p-6 border border-stroke-default">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-gray-100 text-sm flex items-center gap-2">
            <Upload className="w-4 h-4 text-accent-gold" /> Recent Uploads Summary
          </h3>
          <button
            onClick={onNavigateToMyFiles}
            className="text-xs text-accent-gold hover:underline font-bold"
          >
            View All in My Files →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {recentUploads.map(f => (
            <div key={f.id} className="p-3.5 bg-surface rounded-xl border border-stroke-default flex items-center justify-between">
              <div className="truncate pr-2">
                <span className="font-bold text-gray-200 block truncate">{f.fileNameEncrypted}</span>
                <span className="text-[10px] text-gray-400 font-mono">{(f.sizeBytes / 1024 / 1024).toFixed(1)} MB</span>
              </div>
              <button
                onClick={() => onOpenShareModal(f)}
                className="px-2.5 py-1 bg-primary/20 text-accent-gold hover:bg-primary/40 border border-primary/30 font-bold rounded-lg transition shrink-0"
              >
                Share
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Sharing & Activity Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2"><SharingAnalytics /></div>
        <RecentActivityTimeline />
      </div>
    </div>
  );
};
