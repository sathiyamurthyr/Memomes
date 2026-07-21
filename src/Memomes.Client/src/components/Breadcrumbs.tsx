import React from 'react';
import { ChevronRight, Home } from 'lucide-react';

interface BreadcrumbsProps {
  sectionId: string;
  onNavigateHome?: () => void;
}

export const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ sectionId, onNavigateHome }) => {
  const sectionLabels: Record<string, string> = {
    'dashboard': 'Dashboard',
    'my-files': 'My Files',
    'secure-shares': 'Secure Shares',
    'digital-vault': 'Digital Vault',
    'shared-with-me': 'Shared With Me',
    'shared-by-me': 'Shared By Me',
    'favorites': 'Favorites',
    'recent': 'Recent',
    'trash': 'Vault Trash',
    'activity': 'Activity Log',
    'ai-search': 'AI Search',
    'nearby-share': 'Nearby Share',
    'settings': 'Settings',
  };

  const currentLabel = sectionLabels[sectionId] || 'Dashboard';

  return (
    <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs text-gray-400 mb-4 font-mono">
      <button
        onClick={onNavigateHome}
        className="flex items-center space-x-1 hover:text-white transition"
      >
        <Home className="w-3.5 h-3.5 text-accent-gold" />
        <span>Vault</span>
      </button>

      <ChevronRight className="w-3.5 h-3.5 text-gray-600" />

      <span className="text-gray-200 font-semibold">{currentLabel}</span>
    </nav>
  );
};
