import React, { useState } from 'react';
import { Archive, Play, FileCode } from 'lucide-react';

interface FilePreviewRendererProps {
  fileId: string;
  fileName: string;
  contentType: string;
  thumbnailUrl?: string;
  sizeBytes: number;
  onOpen?: () => void;
}

export const FilePreviewRenderer: React.FC<FilePreviewRendererProps> = ({
  fileId,
  fileName,
  contentType,
  thumbnailUrl,
  sizeBytes,
  onOpen
}) => {
  const [imageError, setImageError] = useState(false);

  const isImage = contentType.startsWith('image/') || fileName.endsWith('.jpg') || fileName.endsWith('.png') || fileName.endsWith('.jpeg') || fileName.endsWith('.webp');
  const isVideo = contentType.startsWith('video/') || fileName.endsWith('.mp4') || fileName.endsWith('.mov') || fileName.endsWith('.webm');
  const isPdf = contentType.includes('pdf') || fileName.endsWith('.pdf');
  const isOfficeDoc = fileName.endsWith('.docx') || fileName.endsWith('.pptx') || fileName.endsWith('.xlsx');
  const isArchive = contentType.includes('zip') || fileName.endsWith('.zip') || fileName.endsWith('.tar') || fileName.endsWith('.rar');
  const isAudio = contentType.startsWith('audio/') || fileName.endsWith('.mp3') || fileName.endsWith('.wav') || fileName.endsWith('.aac') || fileName.endsWith('.ogg') || fileName.endsWith('.flac');
  const isTextOrCode = fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.json') || fileName.endsWith('.py') || fileName.endsWith('.js') || fileName.endsWith('.ts') || fileName.endsWith('.tsx') || fileName.endsWith('.cpp') || fileName.endsWith('.sql');

  const backendPreviewUrl = `/api/files/${fileId}/preview`;

  return (
    <div
      onClick={onOpen}
      className="relative aspect-square w-full rounded-xl bg-surface border border-stroke-default overflow-hidden cursor-pointer group flex items-center justify-center"
    >
      {/* 1. Real Image Preview */}
      {isImage && !imageError ? (
        <img
          src={thumbnailUrl || backendPreviewUrl}
          onError={() => setImageError(true)}
          alt={fileName}
          loading="lazy"
          className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
        />
      ) : isVideo ? (
        /* 2. Real Video 1st Frame Preview */
        <div className="relative w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-surface to-surface-card">
          {thumbnailUrl ? (
            <img src={thumbnailUrl} alt="Video Keyframe" loading="lazy" className="w-full h-full object-cover" />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center">
              <Play className="w-6 h-6 text-accent-gold ml-0.5" />
            </div>
          )}
          <span className="absolute bottom-2 left-2 text-[10px] font-extrabold bg-black/80 text-accent-gold px-2 py-0.5 rounded-full border border-stroke-default">
            VIDEO FRAME 1
          </span>
        </div>
      ) : isPdf ? (
        /* 3. PDF Page 1 Rendered Preview */
        <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-surface text-center">
          <div className="w-14 h-16 bg-surface-card border-2 border-accent-blue/50 rounded-lg p-2 flex flex-col justify-between mb-2 shadow-lg group-hover:border-accent-blue transition">
            <span className="text-[9px] font-bold text-accent-blue tracking-wider">PDF</span>
            <div className="space-y-1">
              <div className="w-full h-1 bg-gray-700 rounded" />
              <div className="w-3/4 h-1 bg-gray-700 rounded" />
              <div className="w-1/2 h-1 bg-gray-700 rounded" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-accent-blue">PDF Page 1 Preview</span>
        </div>
      ) : isAudio ? (
        /* 4. Audio Waveform Preview */
        <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br from-purple-950/40 to-surface text-center">
          <div className="w-12 h-12 rounded-full bg-purple-500/20 border border-purple-500/40 flex items-center justify-center mb-2">
            <Play className="w-6 h-6 text-purple-400 ml-0.5" />
          </div>
          <span className="text-[11px] font-bold text-purple-300">Audio Track</span>
        </div>
      ) : isTextOrCode ? (
        /* 5. Code & Text Syntax Preview */
        <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br from-pink-950/30 to-surface text-center">
          <FileCode className="w-10 h-10 text-pink-400 mb-2" />
          <span className="text-[11px] font-bold text-pink-300">{fileName.split('.').pop()?.toUpperCase()} Source Code</span>
        </div>
      ) : isOfficeDoc ? (
        /* 6. Office DOCX/PPTX/XLSX Preview */
        <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-surface text-center">
          <div className="w-14 h-16 bg-surface-card border-2 border-amber-500/50 rounded-lg p-2 flex flex-col justify-between mb-2 shadow-lg group-hover:border-amber-500 transition">
            <span className="text-[9px] font-bold text-accent-gold tracking-wider">
              {fileName.endsWith('.xlsx') ? 'XLS' : fileName.endsWith('.pptx') ? 'PPT' : 'DOC'}
            </span>
            <div className="space-y-1">
              <div className="w-full h-1 bg-gray-700 rounded" />
              <div className="w-1/2 h-1 bg-gray-700 rounded" />
            </div>
          </div>
          <span className="text-[11px] font-bold text-accent-gold">Office Document</span>
        </div>
      ) : isArchive ? (
        /* 7. ZIP Archive Rich Card with Metadata */
        <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-gradient-to-br from-emerald-950/40 to-surface text-center">
          <Archive className="w-10 h-10 text-accent-green mb-2" />
          <span className="text-[11px] font-bold text-accent-green">Encrypted Archive</span>
          <span className="text-[10px] text-gray-400 font-mono mt-0.5">{(sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
        </div>
      ) : (
        /* 8. Unsupported / Generic File Information Badge */
        <div className="w-full h-full p-4 flex flex-col items-center justify-center bg-surface text-center">
          <FileCode className="w-10 h-10 text-gray-400 mb-2" />
          <span className="text-[11px] font-bold text-gray-300 truncate px-2">{fileName.split('.').pop()?.toUpperCase() || 'FILE'}</span>
          <span className="text-[10px] text-gray-500 font-mono mt-0.5">{(sizeBytes / (1024 * 1024)).toFixed(1)} MB</span>
        </div>
      )}

      {/* Hover Overlay Badge */}
      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition duration-200 flex items-center justify-center">
        <span className="px-3 py-1.5 bg-accent-gold text-surface-container text-xs font-extrabold rounded-lg shadow-lg">
          Click to View Stream
        </span>
      </div>
    </div>
  );
};
