import React, { useState } from 'react';
import { X, ShieldCheck, Download, Share2, ZoomIn, ZoomOut, Film, FileText, Lock, Sparkles } from 'lucide-react';
import type { FileItem } from './DashboardV2';

interface FilePreviewLightboxModalProps {
  file: FileItem;
  userEmail?: string;
  onClose: () => void;
  onOpenShare?: (file: FileItem) => void;
}

export const FilePreviewLightboxModal: React.FC<FilePreviewLightboxModalProps> = ({
  file,
  userEmail: _userEmail,
  onClose,
  onOpenShare
}) => {
  const [isZoomed, setIsZoomed] = useState(false);

  const isVideo = file.category === 'video' || file.type?.startsWith('video/') || /\.(mp4|mov|mkv|avi|webm|m4v)$/i.test(file.name);
  const isImage = file.category === 'image' || file.type?.startsWith('image/') || /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(file.name);
  const isPdf = file.name.endsWith('.pdf') || file.type?.includes('pdf');

  const handleDownload = () => {
    if (file.previewUrl) {
      const a = document.createElement('a');
      a.href = file.previewUrl;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/90 backdrop-blur-xl flex flex-col items-center justify-between p-4 md:p-6 animate-fade-in text-white font-sans select-none"
      onClick={onClose}
    >
      {/* ── TOP NAVBAR / HEADER ──────────────────────────────────────────────── */}
      <div
        className="w-full max-w-6xl flex items-center justify-between gap-4 bg-[#0E1524]/80 border border-white/10 p-4 rounded-2xl backdrop-blur-md shadow-2xl z-10"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#F5C027]/15 border border-[#F5C027]/30 text-[#F5C027] flex items-center justify-center font-bold text-xs shrink-0">
            {file.badgeType || (isVideo ? 'MP4' : isImage ? 'IMG' : 'DOC')}
          </div>
          <div className="overflow-hidden">
            <h3 className="text-sm md:text-base font-bold text-white truncate max-w-md">{file.name}</h3>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
              <span>{file.size}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Zero-Knowledge AES-256
              </span>
              {file.b2Synced && (
                <>
                  <span>•</span>
                  <span className="text-[#F5C027]">✔ B2 Cloud Vault</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Header Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {isImage && file.previewUrl && (
            <button
              onClick={() => setIsZoomed(!isZoomed)}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 hover:text-white transition flex items-center gap-1 text-xs font-semibold"
              title={isZoomed ? 'Reset Zoom' : 'Zoom Image'}
            >
              {isZoomed ? <ZoomOut className="w-4 h-4" /> : <ZoomIn className="w-4 h-4" />}
              <span className="hidden sm:inline">{isZoomed ? 'Fit Screen' : '100% Zoom'}</span>
            </button>
          )}

          {onOpenShare && (
            <button
              onClick={() => {
                onClose();
                onOpenShare(file);
              }}
              className="px-3 py-2 rounded-xl bg-[#F5C027]/15 border border-[#F5C027]/40 hover:bg-[#F5C027]/25 text-[#F5C027] transition flex items-center gap-1.5 text-xs font-bold"
            >
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share Link</span>
            </button>
          )}

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
            title="Close Preview (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ── MAIN MEDIA DISPLAY AREA ─────────────────────────────────────────── */}
      <div
        className="flex-1 w-full max-w-6xl flex items-center justify-center p-2 md:p-6 overflow-hidden my-4 relative"
        onClick={e => e.stopPropagation()}
      >
        {/* IMAGE PREVIEW */}
        {isImage && file.previewUrl ? (
          <div className={`relative max-w-full max-h-[75vh] flex items-center justify-center overflow-auto transition-all duration-300 ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}>
            <img
              src={file.previewUrl}
              alt={file.name}
              onClick={() => setIsZoomed(!isZoomed)}
              className={`rounded-2xl shadow-2xl border border-white/10 object-contain transition-all duration-300 ${
                isZoomed
                  ? 'max-w-none max-h-none scale-125'
                  : 'max-w-full max-h-[75vh]'
              }`}
            />
          </div>
        ) : isVideo && file.previewUrl ? (
          /* VIDEO PLAYER */
          <div className="w-full max-w-4xl max-h-[75vh] bg-black/60 rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative flex items-center justify-center">
            <video
              src={file.previewUrl}
              controls
              autoPlay
              preload="auto"
              controlsList="nodownload"
              onContextMenu={e => e.preventDefault()}
              className="w-full max-h-[75vh] rounded-3xl object-contain"
            />
          </div>
        ) : isPdf && file.previewUrl ? (
          /* PDF DOCUMENT VIEWER */
          <div className="w-full max-w-5xl h-[75vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative">
            <iframe
              src={file.previewUrl}
              title={file.name}
              className="w-full h-full rounded-3xl bg-white/95"
            />
          </div>
        ) : (
          /* DOCUMENT / OTHER FILE PREVIEW CARD */
          <div className="w-full max-w-lg bg-[#0E1524] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-[#F5C027]/10 border border-[#F5C027]/30 flex items-center justify-center text-[#F5C027]">
              {isVideo ? <Film className="w-10 h-10" /> : isPdf ? <FileText className="w-10 h-10" /> : <Lock className="w-10 h-10" />}
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-bold text-white break-all">{file.name}</h4>
              <p className="text-xs text-slate-400 font-mono">
                {file.size} • {file.type || 'Encrypted File'}
              </p>
              <div className="inline-flex items-center gap-1.5 text-xs text-[#F5C027] bg-[#F5C027]/10 px-3 py-1 rounded-full border border-[#F5C027]/20 mt-2 font-mono">
                <Sparkles className="w-3.5 h-3.5" /> End-to-End Encrypted Payload
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/5 text-left text-xs font-mono space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">Storage Location:</span>
                <span className="text-slate-200">{file.b2Synced ? 'Backblaze B2 Vault' : 'Local AES Vault'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Encryption Standard:</span>
                <span className="text-emerald-400 font-bold">AES-GCM 256-bit</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Access Control:</span>
                <span className="text-[#F5C027]">Owner Full Access</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── BOTTOM FOOTER CONTROLS ───────────────────────────────────────────── */}
      <div
        className="w-full max-w-6xl flex items-center justify-between gap-4 bg-[#0E1524]/80 border border-white/10 p-3.5 rounded-2xl backdrop-blur-md z-10 text-xs"
        onClick={e => e.stopPropagation()}
      >
        <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
          Memomes Secure Vault • Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">Esc</kbd> to exit preview
        </span>

        <div className="flex items-center gap-3 ml-auto">
          {file.previewUrl && (
            <button
              onClick={handleDownload}
              className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center gap-2"
            >
              <Download className="w-4 h-4" /> Download File
            </button>
          )}

          {onOpenShare && (
            <button
              onClick={() => {
                onClose();
                onOpenShare(file);
              }}
              className="btn-gold !h-9 !px-5 !text-xs"
            >
              <Share2 className="w-4 h-4" /> Share Access
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
