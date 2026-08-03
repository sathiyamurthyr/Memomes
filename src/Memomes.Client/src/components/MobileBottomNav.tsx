import React from 'react';
import { 
  Home, 
  FolderKey, 
  Plus, 
  Sparkles, 
  Share2,
  User 
} from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenUpload: () => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenUpload
}) => {
  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 md:hidden bg-[#070B14]/95 backdrop-blur-2xl border-t border-white/10 px-4 py-2 flex items-center justify-around shadow-2xl">
      {/* Home Tab */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center gap-1 transition-all ${
          activeTab === 'dashboard' ? 'text-[#F5B700]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span className="text-[10px] font-medium">Home</span>
      </button>

      {/* Files Tab */}
      <button
        onClick={() => onSelectTab('files')}
        className={`flex flex-col items-center gap-1 transition-all ${
          activeTab === 'files' ? 'text-[#F5B700]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <FolderKey className="w-5 h-5" />
        <span className="text-[10px] font-medium">Files</span>
      </button>

      {/* Center Floating Action Button (+) */}
      <button
        onClick={onOpenUpload}
        className="w-12 h-12 -mt-5 rounded-2xl bg-gradient-to-tr from-[#F5B700] to-amber-400 text-slate-950 flex items-center justify-center shadow-[0_0_20px_rgba(245,183,0,0.5)] border-2 border-[#070B14] active:scale-95 transition-transform"
      >
        <Plus className="w-6 h-6 stroke-[3]" />
      </button>

      {/* AI Tab */}
      <button
        onClick={() => onSelectTab('ai-intelligence')}
        className={`flex flex-col items-center gap-1 transition-all ${
          activeTab === 'ai-intelligence' ? 'text-[#F5B700]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Sparkles className="w-5 h-5" />
        <span className="text-[10px] font-medium">AI</span>
      </button>

      {/* Share Control Hub Tab */}
      <button
        onClick={() => onSelectTab('share-management')}
        className={`flex flex-col items-center gap-1 transition-all ${
          activeTab === 'share-management' ? 'text-[#F5B700]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <Share2 className="w-5 h-5" />
        <span className="text-[10px] font-medium">Share</span>
      </button>

      {/* Profile Tab */}
      <button
        onClick={() => onSelectTab('settings')}
        className={`flex flex-col items-center gap-1 transition-all ${
          activeTab === 'settings' ? 'text-[#F5B700]' : 'text-slate-400 hover:text-slate-200'
        }`}
      >
        <User className="w-5 h-5" />
        <span className="text-[10px] font-medium">Profile</span>
      </button>
    </div>
  );
};
