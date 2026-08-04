import React from 'react';
import { ChevronRight, Home, Shield, Database } from 'lucide-react';

interface BreadcrumbsProps {
  sectionId?: string;
  category?: string;
  subFolder?: string;
  onNavigateHome?: () => void;
  isAdminMode?: boolean;
  rawStoragePath?: string;
  onToggleAdminView?: () => void;
  userRole?: string;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({
  sectionId = 'my-files',
  category,
  subFolder,
  onNavigateHome,
  isAdminMode = false,
  rawStoragePath,
  onToggleAdminView,
  userRole = 'ROLE_USER'
}) => {
  const isEnterpriseAdmin = userRole === 'ROLE_ADMIN' || userRole === 'COMPANY_ADMIN' || userRole === 'PLATFORM_ADMIN';

  const sectionLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'my-files': 'My Files',
    'files': 'My Files',
    'secure-shares': 'Secure Shares',
    'digital-vault': 'Digital Vault',
    'shared-with-me': 'Shared With Me',
    'shared-by-me': 'Shared By Me',
    'favorites': 'Favorites',
    'recent': 'Recent',
    'trash': 'Vault Trash',
    'recycle-bin': 'Recycle Bin',
    'activity': 'Activity Log',
    'ai-search': 'AI Search',
    'nearby-share': 'Nearby Share',
    'settings': 'Settings',
  };

  const categoryLabels: Record<string, string> = {
    'documents': 'Documents',
    'images': 'Images',
    'videos': 'Videos',
    'pdf': 'PDF',
    'audio': 'Audio',
    'spreadsheets': 'Spreadsheets',
    'presentations': 'Presentations',
    'sourcecode': 'Source Code',
    'source-code': 'Source Code',
    'archives': 'Archives',
    'others': 'Others'
  };

  const currentCategoryLabel = category ? (categoryLabels[category.toLowerCase()] || category) : null;
  const currentSectionLabel = sectionLabels[sectionId] || 'My Files';

  return (
    <nav aria-label="Breadcrumb" className="flex items-center justify-between py-2 px-1 text-xs text-slate-400 font-sans select-none mb-3 border-b border-white/5">
      {/* Consumer-Friendly Path: Home > Folder */}
      <div className="flex items-center space-x-2 font-medium">
        <button
          onClick={onNavigateHome}
          className="flex items-center space-x-1.5 text-slate-300 hover:text-white transition-colors"
        >
          <Home className="w-3.5 h-3.5 text-[#F5B700]" />
          <span>Home</span>
        </button>

        <ChevronRight className="w-3.5 h-3.5 text-slate-600" />

        {currentCategoryLabel ? (
          <>
            <span className="text-slate-400">{currentSectionLabel}</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-white font-bold text-slate-100">{currentCategoryLabel}</span>
          </>
        ) : (
          <span className="text-white font-bold text-slate-100">{currentSectionLabel}</span>
        )}

        {subFolder && (
          <>
            <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
            <span className="text-amber-400 font-mono font-semibold">{subFolder}</span>
          </>
        )}
      </div>

      {/* Enterprise Infrastructure Mode Toggle (Only visible to Admin) */}
      {isEnterpriseAdmin && (
        <div className="flex items-center space-x-2">
          {isAdminMode && rawStoragePath && (
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-500/30 truncate max-w-xs" title={rawStoragePath}>
              <Database className="w-3 h-3 inline mr-1" />
              {rawStoragePath}
            </span>
          )}

          <button
            onClick={onToggleAdminView}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition-all ${
              isAdminMode
                ? 'bg-amber-500/20 text-[#F5B700] border border-amber-500/40 shadow-sm'
                : 'bg-white/5 text-slate-400 hover:text-slate-200 border border-white/10'
            }`}
            title="Toggle Enterprise Infrastructure Storage Path View"
          >
            <Shield className="w-3 h-3" />
            <span>{isAdminMode ? 'Admin Infra Mode ON' : 'Infrastructure View'}</span>
          </button>
        </div>
      )}
    </nav>
  );
};
