import React from 'react';
import { Star, Video, FileText } from 'lucide-react';

const favorites = [
  { id: 'f1', name: 'Family_Goa_Vacation_2026.mp4', type: 'video/mp4', size: 154, added: '2026-07-20' },
  { id: 'f2', name: 'Encrypted_Backup_2025.zip', type: 'application/zip', size: 850, added: '2026-07-15' },
];

export const FavoritesPage: React.FC = () => (
  <div className="space-y-6">
    <div>
      <h2 className="text-lg font-extrabold text-white flex items-center gap-2">
        <Star className="w-5 h-5 text-accent-gold fill-accent-gold" /> Favorites
      </h2>
      <p className="text-xs text-gray-400 mt-1">Files you have starred for quick access.</p>
    </div>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
      {favorites.map(f => (
        <div key={f.id} className="glass-card rounded-xl p-4 border border-stroke-default hover:border-accent-gold/40 transition cursor-pointer">
          <div className="aspect-square rounded-lg bg-surface border border-stroke-default flex items-center justify-center mb-3">
            {f.type.includes('video') ? <Video className="w-10 h-10 text-primary" /> : <FileText className="w-10 h-10 text-accent-blue" />}
          </div>
          <div className="flex items-start justify-between gap-1">
            <span className="text-xs font-bold text-gray-200 truncate flex-1">{f.name}</span>
            <Star className="w-3.5 h-3.5 text-accent-gold fill-accent-gold shrink-0" />
          </div>
          <div className="flex justify-between text-[10px] text-gray-500 font-mono mt-1">
            <span>{f.size} MB</span>
            <span>Starred {f.added}</span>
          </div>
        </div>
      ))}
    </div>
  </div>
);
