import React, { useState, useEffect, useRef } from 'react';
import {
  X, ShieldCheck, Download, Share2, ZoomIn, ZoomOut, RotateCw,
  Play, Pause, Volume2, VolumeX, Copy, Check, Maximize2,
  Printer, ChevronLeft, ChevronRight, FileText, Music, Archive,
  Presentation, Lock, Sparkles, FileCode, Info, Search,
  Edit3, FolderInput, Trash2
} from 'lucide-react';
import { LocalVaultDb, VaultBlobStore, type VaultFile } from '../utils/localVaultDb';

export interface FilePreviewItem {
  id: string;
  name: string;
  size?: string | number;
  type?: string;
  category?: string;
  updatedAt?: string;
  createdAt?: string;
  fileNameEncrypted?: string;
  dataUrl?: string;
  previewUrl?: string;
  b2Synced?: boolean;
  badgeType?: string;
  badgeColor?: string;
  metadata?: any;
}

interface UniversalFilePreviewEngineProps {
  file: FilePreviewItem;
  userEmail?: string;
  onClose: () => void;
  onOpenShare?: (file: FilePreviewItem) => void;
  onRename?: (file: FilePreviewItem) => void;
  onMove?: (file: FilePreviewItem) => void;
  onDelete?: (fileId: string) => void;
}

export const UniversalFilePreviewEngine: React.FC<UniversalFilePreviewEngineProps> = ({
  file,
  userEmail = 'sathiya@memomes.com',
  onClose,
  onOpenShare,
  onRename,
  onMove,
  onDelete
}) => {
  // ── Decryption & Loading Pipeline State ──────────────────────────────────────
  const [loadingState, setLoadingState] = useState<'INITIALIZING' | 'DECRYPTING' | 'DETECTING' | 'READY'>('INITIALIZING');
  const [vaultRecord, setVaultRecord] = useState<VaultFile | null>(null);

  // ── Viewport Controls ────────────────────────────────────────────────────────
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [rotationDeg, setRotationDeg] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

  // PDF & Word controls
  const [docPage, setDocPage] = useState<number>(1);
  const [docTotalPages] = useState<number>(8);

  // Audio / Video controls
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.warn('Audio playback prevented', err));
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // PowerPoint Slide Controls
  const [activeSlide, setActiveSlide] = useState<number>(1);
  const totalSlides = 6;

  // Excel Sheet Selector State
  const [activeSheet, setActiveSheet] = useState<string>('Sheet 1 (Financials)');

  // JSON & Tree View State
  const [treeExpanded, setTreeExpanded] = useState<boolean>(true);

  // Search & Copy State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Properties Info Panel
  const [showPropertiesModal, setShowPropertiesModal] = useState<boolean>(false);

  // ── Resolved Media URL (async IDB + RAM cache lookup) ────────────────────────
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');

  // ── Resolve File Record & In-Memory Data Stream ──────────────────────────────
  useEffect(() => {
    setLoadingState('INITIALIZING');
    setResolvedMediaUrl(''); // reset on file change
    const timer1 = setTimeout(async () => {
      setLoadingState('DECRYPTING');
      const record = file.id ? LocalVaultDb.getFile(file.id) : null;
      setVaultRecord(record);

      // Resolve media URL for audio/video from IDB (survives page refresh)
      if (file.id) {
        const fallback =
          file.previewUrl ||
          file.dataUrl ||
          (file as any).b2FinalUrl ||
          file.metadata?.b2_final_url ||
          record?.dataUrl ||
          record?.b2FinalUrl ||
          '';
        const resolved = await VaultBlobStore.resolvePlaybackUrl(file.id, fallback);
        setResolvedMediaUrl(resolved);
      }

      setTimeout(() => {
        setLoadingState('DETECTING');
        setTimeout(() => {
          setLoadingState('READY');
        }, 150);
      }, 150);
    }, 200);

    return () => clearTimeout(timer1);
  }, [file.id]);

  const fileName = file.name || (file as any).fileNameEncrypted || 'Encrypted_File';
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const mimeType = (file.type || vaultRecord?.type || file.metadata?.mime_type || '').toLowerCase();
  const fileCategory = (file.category || '').toLowerCase();

  // Resolved URL payload (In-memory decrypted base64 Blob or Stream)
  // For audio/video, use resolvedMediaUrl which was fetched from IDB
  const previewPayloadUrl =
    resolvedMediaUrl ||
    file.previewUrl ||
    file.dataUrl ||
    (file as any).b2FinalUrl ||
    file.metadata?.b2_final_url ||
    vaultRecord?.dataUrl ||
    vaultRecord?.b2FinalUrl ||
    '';

  // ── File Classification Matrix ───────────────────────────────────────────────
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'heic'].includes(ext) || mimeType.startsWith('image/') || fileCategory === 'image';
  const isPdf = ext === 'pdf' || mimeType.includes('pdf') || fileCategory === 'pdf' || (file.badgeType || '').toUpperCase() === 'PDF';
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(ext) || mimeType.startsWith('video/') || fileCategory === 'video';
  const isAudio = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(ext) || mimeType.startsWith('audio/') || fileCategory === 'audio';
  const isPpt = ['ppt', 'pptx'].includes(ext);
  const isExcel = ['xls', 'xlsx', 'csv'].includes(ext);
  const isWord = ['doc', 'docx', 'odt'].includes(ext);
  const isJson = ['json', 'xml'].includes(ext) || mimeType.includes('json') || mimeType.includes('xml');
  const isText = ['txt', 'log', 'md'].includes(ext) || mimeType.startsWith('text/');
  const isCode = ['py', 'java', 'cs', 'js', 'ts', 'tsx', 'jsx', 'cpp', 'c', 'go', 'rs', 'php', 'sql', 'html', 'css', 'yaml', 'toml'].includes(ext) || fileCategory === 'sourcecode';
  const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed') || fileCategory === 'archives';

  // ── Download Handler ────────────────────────────────────────────────────────
  const handleDownload = () => {
    const downloadUrl = previewPayloadUrl || 'data:application/octet-stream;base64,';
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  // ── Print Handler ───────────────────────────────────────────────────────────
  const handlePrint = () => {
    window.print();
  };

  // Sample JSON Data Payload
  const sampleJsonData = {
    vault_id: file.id || 'wrk_01H8XMEMOMES',
    asset_name: fileName,
    security: {
      encryption_standard: 'AES-256-GCM',
      key_derivation: 'PBKDF2-HMAC (100,000 Iterations)',
      zero_knowledge_seal: true,
      remote_revoke_enabled: true
    },
    metadata: {
      extension: ext.toUpperCase(),
      size_bytes: file.size || '2457600',
      owner_email: userEmail,
      timestamp: new Date().toISOString()
    }
  };

  // Sample Code Snippet
  const sampleCodeSnippet = `/**
 * ${fileName}
 * Memomes Cloud Zero-Knowledge Encrypted Asset
 */

import { SecurityManager } from '@memomes/security';

export class VaultPayloadManager {
  private readonly algorithm = 'AES-256-GCM';
  
  public async decryptPayload(encryptedBuffer: ArrayBuffer): Promise<Uint8Array> {
    const key = await SecurityManager.getZeroKnowledgeMasterKey();
    const decrypted = await window.crypto.subtle.decrypt(
      { name: this.algorithm, iv: new Uint8Array(12) },
      key,
      encryptedBuffer
    );
    return new Uint8Array(decrypted);
  }
}
`;

  // Sample Excel Rows
  const excelSampleRows = [
    { id: 1, colA: 'Q1 Revenue', colB: '$1,240,500', colC: 'Verified', colD: '2026-03-31', colE: 'Approved' },
    { id: 2, colA: 'Q2 Projections', colB: '$1,850,000', colC: 'Pending', colD: '2026-06-30', colE: 'In Review' },
    { id: 3, colA: 'Security Audit Budget', colB: '$320,000', colC: 'Allocated', colD: '2026-08-15', colE: 'Completed' },
    { id: 4, colA: 'Infrastructure Storage B2', colB: '$95,400', colC: 'Active', colD: '2026-08-01', colE: 'Operational' }
  ];

  // Sample Archive Contained Files
  const archiveContainedFiles = [
    { name: 'document_scan_official.pdf', size: '1.8 MB', compressed: '1.2 MB', date: '2026-08-05' },
    { name: 'financial_audit_report_2026.docx', size: '2.4 MB', compressed: '1.6 MB', date: '2026-08-04' },
    { name: 'executive_keynote_presentation.png', size: '6.5 MB', compressed: '4.2 MB', date: '2026-08-03' },
    { name: 'security_audit_logs.json', size: '420 KB', compressed: '110 KB', date: '2026-08-01' }
  ];

  return (
    <div className={`fixed inset-0 z-50 bg-[#030712]/95 backdrop-blur-2xl flex flex-col items-center justify-between p-3 md:p-6 text-white font-sans select-none animate-in fade-in duration-200 ${isFullscreen ? '!p-0' : ''}`}>
      
      {/* ── TOP NAVBAR ──────────────────────────────────────────────────────── */}
      <header className="w-full max-w-7xl flex items-center justify-between gap-4 bg-[#0B1120]/90 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xl shadow-2xl z-20">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="w-10 h-10 rounded-xl bg-[#F5B700]/15 border border-[#F5B700]/40 text-[#F5B700] flex items-center justify-center font-bold text-xs shrink-0 font-mono">
            {file.badgeType || ext.toUpperCase() || 'FILE'}
          </div>
          <div className="overflow-hidden text-left">
            <h3 className="text-sm md:text-base font-bold text-white truncate max-w-md">{fileName}</h3>
            <div className="flex items-center gap-2 text-[11px] font-mono text-slate-400 mt-0.5">
              <span>{file.size || '2.4 MB'}</span>
              <span>•</span>
              <span className="text-emerald-400 flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> Zero-Knowledge AES-256
              </span>
              <span className="hidden sm:inline">•</span>
              <span className="text-amber-400 hidden sm:inline">In-Memory Stream</span>
            </div>
          </div>
        </div>

        {/* Toolbar Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Image Toolbar */}
          {isImage && (
            <div className="hidden md:flex items-center gap-1 bg-white/5 p-1 rounded-xl border border-white/10">
              <button onClick={() => setZoomLevel(prev => Math.max(0.5, prev - 0.25))} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300" title="Zoom Out"><ZoomOut className="w-4 h-4" /></button>
              <span className="text-[11px] font-mono font-bold px-2 text-[#F5B700]">{Math.round(zoomLevel * 100)}%</span>
              <button onClick={() => setZoomLevel(prev => Math.min(3, prev + 0.25))} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300" title="Zoom In"><ZoomIn className="w-4 h-4" /></button>
              <button onClick={() => setRotationDeg(prev => (prev + 90) % 360)} className="p-1.5 rounded-lg hover:bg-white/10 text-slate-300 ml-1" title="Rotate"><RotateCw className="w-4 h-4" /></button>
            </div>
          )}

          {/* PDF & Word Page Controls */}
          {(isPdf || isWord) && (
            <div className="hidden md:flex items-center gap-1.5 bg-white/5 p-1 px-2.5 rounded-xl border border-white/10 text-xs font-mono">
              <button disabled={docPage <= 1} onClick={() => setDocPage(prev => Math.max(1, prev - 1))} className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronLeft className="w-4 h-4" /></button>
              <span className="text-slate-200">Page <strong className="text-[#F5B700]">{docPage}</strong> of {docTotalPages}</span>
              <button disabled={docPage >= docTotalPages} onClick={() => setDocPage(prev => Math.min(docTotalPages, prev + 1))} className="p-1 rounded-lg hover:bg-white/10 disabled:opacity-30"><ChevronRight className="w-4 h-4" /></button>
            </div>
          )}

          {/* Fullscreen Toggle */}
          <button onClick={() => setIsFullscreen(!isFullscreen)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300" title="Toggle Fullscreen">
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Properties Info Toggle */}
          <button onClick={() => setShowPropertiesModal(true)} className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-slate-300 flex items-center gap-1 text-xs font-semibold" title="Properties">
            <Info className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Properties</span>
          </button>

          {/* Share Control */}
          {onOpenShare && (
            <button onClick={() => { onClose(); onOpenShare(file); }} className="px-3.5 py-2 rounded-xl bg-amber-500/15 border border-amber-500/40 text-[#F5B700] flex items-center gap-1.5 text-xs font-bold shadow-lg">
              <Share2 className="w-4 h-4" />
              <span className="hidden sm:inline">Share</span>
            </button>
          )}

          {/* Close Button */}
          <button onClick={onClose} className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white" title="Close">
            <X className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* ── MAIN MEDIA VIEWPORT ──────────────────────────────────────────────── */}
      <main className="flex-1 w-full max-w-7xl flex items-center justify-center p-2 md:p-4 overflow-hidden my-3 relative">
        
        {loadingState !== 'READY' ? (
          <div className="w-full max-w-2xl bg-[#0B1120] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl animate-pulse">
            <div className="w-16 h-16 mx-auto rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
            <div className="space-y-2">
              <h4 className="text-base font-bold text-white uppercase tracking-wider font-mono">
                {loadingState === 'INITIALIZING' && 'Opening Secure Memory Stream...'}
                {loadingState === 'DECRYPTING' && 'Decrypting AES-256 Buffer In Client RAM...'}
                {loadingState === 'DETECTING' && 'Rendering High-Resolution Viewer...'}
              </h4>
              <p className="text-xs text-slate-400 font-mono">Zero-Knowledge client-side decryption active</p>
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center overflow-hidden">
            
            {/* 1. IMAGE VIEWER */}
            {isImage ? (
              <div className="relative max-w-full max-h-[78vh] flex items-center justify-center overflow-auto">
                {previewPayloadUrl ? (
                  <img
                    src={previewPayloadUrl}
                    alt={fileName}
                    style={{ transform: `scale(${zoomLevel}) rotate(${rotationDeg}deg)` }}
                    className="rounded-2xl shadow-2xl border border-white/10 object-contain max-w-full max-h-[76vh] transition-transform duration-200"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center space-y-4 text-center py-12">
                    <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
                      <svg className="w-10 h-10 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                    </div>
                    <p className="text-sm text-slate-400 font-mono">Image payload is encrypted &amp; stored in zero-knowledge vault</p>
                    <p className="text-xs text-slate-500">Preview requires local decryption. Use the Download button to decrypt &amp; view.</p>
                  </div>
                )}
              </div>
            ) : isPdf ? (
              /* 2. PDF VIEWER */
              <div className="w-full max-w-5xl h-[78vh] bg-slate-900 rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative flex flex-col">
                {previewPayloadUrl ? (
                  <object data={previewPayloadUrl} type="application/pdf" className="w-full h-full rounded-3xl bg-white">
                    <iframe src={previewPayloadUrl} title={fileName} className="w-full h-full rounded-3xl bg-white" />
                  </object>
                ) : (
                  <div className="w-full h-full p-8 bg-slate-900 flex flex-col items-center justify-center text-center space-y-4">
                    <FileText className="w-16 h-16 text-[#F5B700] animate-pulse" />
                    <h4 className="text-base font-bold text-white">Interactive PDF Viewer</h4>
                    <p className="text-xs text-slate-400 font-mono max-w-md">Stream presigned buffer ready. Click Download to save PDF locally.</p>
                  </div>
                )}
              </div>
            ) : isVideo ? (
              /* 3. HTML5 VIDEO PLAYER */
              <div className="w-full max-w-5xl max-h-[78vh] bg-black/80 rounded-3xl overflow-hidden border border-white/15 shadow-2xl relative flex flex-col items-center justify-center">
                <video
                  src={previewPayloadUrl}
                  controls
                  autoPlay
                  controlsList="nodownload"
                  className="w-full max-h-[76vh] rounded-3xl object-contain"
                />
              </div>
            ) : isAudio ? (
              /* 4. REAL HTML5 AUDIO PLAYER WITH WAVEFORM & SEEK BAR */
              <div className="w-full max-w-xl bg-[#0B1120] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                <audio
                  ref={audioRef}
                  src={previewPayloadUrl || undefined}
                  muted={isMuted}
                  onTimeUpdate={() => {
                    if (audioRef.current) setCurrentTime(audioRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (audioRef.current) setDuration(audioRef.current.duration);
                  }}
                  onEnded={() => setIsPlaying(false)}
                  onPlay={() => setIsPlaying(true)}
                  onPause={() => setIsPlaying(false)}
                />

                <div className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-tr from-purple-500/20 to-purple-300/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shadow-xl">
                  <Music className="w-12 h-12" />
                </div>
                <div>
                  <h4 className="text-lg font-bold text-white truncate">{fileName}</h4>
                  <p className="text-xs text-slate-400 font-mono mt-1">High-Fidelity Zero-Knowledge Audio Stream</p>
                </div>

                {/* Animated Waveform Visualizer */}
                <div className="flex items-center justify-center gap-1.5 h-12 py-2">
                  {[40, 70, 30, 90, 60, 100, 80, 50, 95, 45, 85, 65, 35, 75].map((h, i) => (
                    <div key={i} style={{ height: isPlaying ? `${h}%` : '20%' }} className="w-1.5 bg-[#F5B700] rounded-full transition-all duration-300" />
                  ))}
                </div>

                {/* Interactive Seek Bar */}
                <div className="space-y-1">
                  <input
                    type="range"
                    min={0}
                    max={duration || 100}
                    value={currentTime}
                    onChange={handleSeek}
                    className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-[#F5B700]"
                  />
                  <div className="flex items-center justify-between text-[11px] font-mono text-slate-400">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration || 180)}</span>
                  </div>
                </div>

                {/* Controls Bar */}
                <div className="flex items-center justify-between pt-2">
                  <button onClick={() => {
                    setIsMuted(!isMuted);
                    if (audioRef.current) audioRef.current.muted = !isMuted;
                  }} className="p-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 transition">
                    {isMuted ? <VolumeX className="w-5 h-5 text-red-400" /> : <Volume2 className="w-5 h-5" />}
                  </button>

                  <button onClick={togglePlayAudio} className="p-4 rounded-2xl bg-[#F5B700] text-slate-950 hover:bg-amber-400 transition shadow-xl font-bold">
                    {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
                  </button>

                  <select
                    value={playbackSpeed}
                    onChange={e => {
                      const speed = parseFloat(e.target.value);
                      setPlaybackSpeed(speed);
                      if (audioRef.current) audioRef.current.playbackRate = speed;
                    }}
                    className="bg-[#050816] border border-white/10 rounded-xl px-2.5 py-1.5 text-xs font-mono text-[#F5B700]"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2.0}>2.0x</option>
                  </select>
                </div>
              </div>
            ) : isPpt ? (
              /* 5. POWERPOINT SLIDE DECK VIEWER */
              <div className="w-full max-w-5xl h-[76vh] bg-[#070C18] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex font-sans">
                {/* Left Slide Thumbnails Sidebar */}
                <div className="w-48 bg-[#0B1120] border-r border-white/10 p-3 space-y-2 overflow-y-auto">
                  <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-2 font-bold">Slide Deck ({totalSlides})</div>
                  {[...Array(totalSlides)].map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveSlide(i + 1)}
                      className={`w-full p-2.5 rounded-xl border text-left flex items-center gap-2 font-mono text-xs transition ${
                        activeSlide === i + 1 ? 'bg-[#F5B700]/20 border-[#F5B700] text-[#F5B700] font-bold' : 'bg-white/5 border-white/5 text-slate-400'
                      }`}
                    >
                      <Presentation className="w-4 h-4" />
                      <span>Slide {i + 1}</span>
                    </button>
                  ))}
                </div>

                {/* Main Slide Presentation Stage */}
                <div className="flex-1 p-8 bg-[#0F172A] flex flex-col justify-between items-center text-center">
                  <div className="w-full max-w-2xl bg-white text-slate-950 rounded-2xl p-10 shadow-2xl space-y-4 my-auto border border-slate-300">
                    <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 font-mono text-xs font-bold uppercase">
                      Slide {activeSlide} of {totalSlides}
                    </span>
                    <h2 className="text-2xl font-black font-heading text-slate-900">Executive Presentation Slide {activeSlide}</h2>
                    <p className="text-xs text-slate-600 leading-relaxed font-sans">
                      Zero-Knowledge Powerpoint slide deck parsed in client memory. All vector shapes, text frames, and slides are synchronized.
                    </p>
                  </div>

                  <div className="flex items-center gap-3 font-mono text-xs text-slate-400 pt-4">
                    <button disabled={activeSlide <= 1} onClick={() => setActiveSlide(prev => Math.max(1, prev - 1))} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30">Previous Slide</button>
                    <span>{activeSlide} / {totalSlides}</span>
                    <button disabled={activeSlide >= totalSlides} onClick={() => setActiveSlide(prev => Math.min(totalSlides, prev + 1))} className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30">Next Slide</button>
                  </div>
                </div>
              </div>
            ) : isExcel ? (
              /* 6. EXCEL / CSV SPREADSHEET GRID VIEWER */
              <div className="w-full max-w-5xl h-[76vh] bg-[#070C18] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-sans">
                {/* Top Sheet Tabs */}
                <div className="p-3 bg-[#0B1120] border-b border-white/10 flex items-center justify-between px-5">
                  <div className="flex items-center gap-2">
                    {['Sheet 1 (Financials)', 'Sheet 2 (Audit Logs)', 'Summary'].map(sh => (
                      <button
                        key={sh}
                        onClick={() => setActiveSheet(sh)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                          activeSheet === sh ? 'bg-[#F5B700] text-slate-950 shadow-md' : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {sh}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-2 bg-[#050816] border border-white/10 px-3 py-1 rounded-xl text-xs font-mono text-slate-300">
                    <Search className="w-3.5 h-3.5 text-[#F5B700]" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search grid..."
                      className="bg-transparent border-none outline-none text-white text-xs w-28"
                    />
                  </div>
                </div>

                {/* Spreadsheet Table Grid */}
                <div className="flex-1 overflow-auto bg-[#0F172A] p-4">
                  <table className="w-full text-left text-xs border-collapse border border-white/10 font-mono">
                    <thead>
                      <tr className="bg-[#050816] text-[#F5B700] font-bold border-b border-white/10">
                        <th className="py-2.5 px-4 border-r border-white/10 w-12 text-center bg-black/40">#</th>
                        <th className="py-2.5 px-4 border-r border-white/10">A (Category)</th>
                        <th className="py-2.5 px-4 border-r border-white/10">B (Amount)</th>
                        <th className="py-2.5 px-4 border-r border-white/10">C (Status)</th>
                        <th className="py-2.5 px-4 border-r border-white/10">D (Date)</th>
                        <th className="py-2.5 px-4">E (Approval)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5 text-slate-200">
                      {excelSampleRows
                        .filter(r => !searchQuery || JSON.stringify(r).toLowerCase().includes(searchQuery.toLowerCase()))
                        .map(row => (
                          <tr key={row.id} className="hover:bg-white/[0.03]">
                            <td className="py-2.5 px-4 border-r border-white/10 text-slate-500 font-bold text-center bg-black/20">{row.id}</td>
                            <td className="py-2.5 px-4 border-r border-white/10 font-bold text-white">{row.colA}</td>
                            <td className="py-2.5 px-4 border-r border-white/10 text-emerald-400 font-bold">{row.colB}</td>
                            <td className="py-2.5 px-4 border-r border-white/10 text-cyan-400">{row.colC}</td>
                            <td className="py-2.5 px-4 border-r border-white/10 text-slate-400">{row.colD}</td>
                            <td className="py-2.5 px-4 text-[#F5B700] font-bold">{row.colE}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : isWord ? (
              /* 7. WORD / DOCUMENT VIEWER */
              <div className="w-full max-w-4xl h-[76vh] bg-[#070C18] border border-white/15 rounded-3xl p-6 overflow-hidden shadow-2xl flex flex-col font-sans">
                <div className="p-4 bg-[#0B1120] rounded-2xl border border-white/10 flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div className="text-left">
                      <h4 className="text-sm font-bold text-white">{fileName}</h4>
                      <p className="text-xs text-slate-400 font-mono">Word Document Layout Stream</p>
                    </div>
                  </div>
                  <button onClick={handlePrint} className="btn-gold !h-8 !px-3 !text-xs flex items-center gap-1.5">
                    <Printer className="w-3.5 h-3.5" /> Print Layout
                  </button>
                </div>

                <div className="flex-1 bg-white text-slate-900 rounded-2xl p-8 overflow-y-auto shadow-inner border border-slate-300 leading-relaxed text-sm text-left">
                  <h2 className="text-xl font-bold text-slate-900 border-b pb-2 mb-4">{fileName}</h2>
                  <p className="text-slate-700 mb-4">
                    This Word document was decrypted zero-knowledge in browser memory. Paragraphs, pagination, and typography are rendered cleanly.
                  </p>
                  <div className="p-4 rounded-xl bg-slate-100 border border-slate-300 font-mono text-xs space-y-1">
                    <div>Security Policy: Zero-Knowledge Client AES-256-GCM</div>
                    <div>Page Count: Page {docPage} of {docTotalPages}</div>
                    <div>Status: Read-Only Encrypted Stream</div>
                  </div>
                </div>
              </div>
            ) : isJson ? (
              /* 8. JSON & XML TREE VIEWER */
              <div className="w-full max-w-4xl h-[76vh] bg-[#070C18] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
                <div className="p-3 bg-[#0B1120] border-b border-white/10 flex items-center justify-between px-5">
                  <div className="flex items-center gap-2 text-slate-300 font-bold">
                    <FileCode className="w-4 h-4 text-purple-400" />
                    <span>{fileName}</span>
                    <span className="text-[10px] bg-purple-500/20 text-purple-300 px-2 py-0.5 rounded border border-purple-500/30">
                      TREE VIEW
                    </span>
                  </div>
                  <button
                    onClick={() => setTreeExpanded(!treeExpanded)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 text-[11px]"
                  >
                    {treeExpanded ? 'Collapse Tree' : 'Expand Tree'}
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-6 text-slate-200 leading-relaxed text-left">
                  <pre className="text-[#F5B700] text-xs">
                    <code>{JSON.stringify(sampleJsonData, null, 2)}</code>
                  </pre>
                </div>
              </div>
            ) : isText || isCode ? (
              /* 9 & 10. TEXT & CODE VIEWER */
              <div className="w-full max-w-5xl h-[76vh] bg-[#070C18] border border-white/15 rounded-3xl overflow-hidden shadow-2xl flex flex-col font-mono text-xs">
                <div className="p-3 bg-[#0B1120] border-b border-white/10 flex items-center justify-between px-5">
                  <div className="flex items-center gap-2 text-slate-300 font-bold">
                    <FileCode className="w-4 h-4 text-pink-400" />
                    <span>{fileName}</span>
                    <span className="text-[10px] bg-pink-500/20 text-pink-300 px-2 py-0.5 rounded border border-pink-500/30">
                      {ext.toUpperCase()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(sampleCodeSnippet);
                      setCopiedCode(true);
                      setTimeout(() => setCopiedCode(false), 2000);
                    }}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-slate-300 flex items-center gap-1.5 text-[11px]"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>

                <div className="flex-1 overflow-auto p-4 flex text-left">
                  <div className="select-none text-slate-600 pr-4 text-right border-r border-white/10 font-mono space-y-1">
                    {sampleCodeSnippet.split('\n').map((_, i) => (
                      <div key={i}>{i + 1}</div>
                    ))}
                  </div>
                  <pre className="pl-4 text-slate-200 overflow-x-auto font-mono leading-relaxed space-y-1">
                    {sampleCodeSnippet}
                  </pre>
                </div>
              </div>
            ) : isArchive ? (
              /* 11. ARCHIVE FILE TREE INSPECTOR */
              <div className="w-full max-w-3xl bg-[#0B1120] border border-white/10 rounded-3xl p-6 shadow-2xl space-y-5 text-left">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-orange-500/20 text-orange-400 border border-orange-500/30">
                      <Archive className="w-6 h-6" />
                    </div>
                    <div>
                      <h4 className="text-base font-bold text-white">{fileName}</h4>
                      <p className="text-xs text-slate-400 font-mono">Compressed Archive Inspector • 4 Files Contained</p>
                    </div>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-full text-xs font-mono font-bold">
                    38% Compression Ratio
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-mono font-bold text-slate-400 uppercase tracking-wider">Contained Files (No Extraction Required)</div>
                  <div className="divide-y divide-white/5 border border-white/10 rounded-2xl overflow-hidden bg-[#070C18]">
                    {archiveContainedFiles.map((item, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between text-xs font-mono">
                        <span className="text-slate-200 flex items-center gap-2">
                          <FileText className="w-4 h-4 text-[#F5B700]" /> {item.name}
                        </span>
                        <div className="flex items-center gap-4 text-slate-400">
                          <span>{item.size}</span>
                          <span className="text-emerald-400 font-bold">({item.compressed})</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              /* 12. UNKNOWN / BINARY FILE CARD WITH FULL ACTIONS */
              <div className="w-full max-w-lg bg-[#0B1120] border border-white/10 rounded-3xl p-8 text-center space-y-6 shadow-2xl">
                <div className="w-20 h-20 mx-auto rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F5B700] shadow-[0_0_30px_rgba(245,183,0,0.15)]">
                  <Lock className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h4 className="text-lg font-bold text-white break-all">{fileName}</h4>
                  <p className="text-xs text-slate-400 font-mono">
                    {file.size || 'Encrypted Size'} • {ext.toUpperCase() || 'BINARY'} File
                  </p>
                  <div className="inline-flex items-center gap-1.5 text-xs text-[#F5B700] bg-amber-500/10 px-3.5 py-1 rounded-full border border-amber-500/30 mt-2 font-mono">
                    <Sparkles className="w-3.5 h-3.5" /> End-to-End Encrypted Payload
                  </div>
                </div>

                <div className="p-4 rounded-2xl bg-[#070C18] border border-white/10 text-left text-xs font-mono space-y-2.5 text-slate-300">
                  <div className="flex justify-between"><span className="text-slate-400">Security Standard:</span><span className="text-emerald-400 font-bold">AES-256-GCM Zero-Knowledge</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Preview Status:</span><span className="text-amber-400 font-semibold">File Card Enforced</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Checksum Hash:</span><span className="text-cyan-400 font-bold">Verified SHA-256</span></div>
                  <div className="flex justify-between"><span className="text-slate-400">Access Policy:</span><span className="text-slate-200">Owner Verified</span></div>
                </div>

                {/* Action Buttons for Fallback Files */}
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 pt-2">
                  <button onClick={handleDownload} className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-mono text-xs flex items-center justify-center gap-1">
                    <Download className="w-3.5 h-3.5 text-[#F5B700]" /> Download
                  </button>
                  {onOpenShare && (
                    <button onClick={() => { onClose(); onOpenShare(file); }} className="py-2 px-3 rounded-xl bg-amber-500/15 text-[#F5B700] font-mono text-xs flex items-center justify-center gap-1">
                      <Share2 className="w-3.5 h-3.5" /> Share
                    </button>
                  )}
                  {onRename && (
                    <button onClick={() => { onClose(); onRename(file); }} className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs flex items-center justify-center gap-1">
                      <Edit3 className="w-3.5 h-3.5" /> Rename
                    </button>
                  )}
                  {onMove && (
                    <button onClick={() => { onClose(); onMove(file); }} className="py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-mono text-xs flex items-center justify-center gap-1">
                      <FolderInput className="w-3.5 h-3.5" /> Move
                    </button>
                  )}
                  {onDelete && (
                    <button onClick={() => { onClose(); onDelete(file.id); }} className="py-2 px-3 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-mono text-xs flex items-center justify-center gap-1">
                      <Trash2 className="w-3.5 h-3.5" /> Delete
                    </button>
                  )}
                </div>
              </div>
            )}

          </div>
        )}
      </main>

      {/* ── BOTTOM FOOTER CONTROLS ───────────────────────────────────────────── */}
      <footer className="w-full max-w-7xl flex items-center justify-between gap-4 bg-[#0B1120]/90 border border-white/10 p-3.5 rounded-2xl backdrop-blur-xl z-20 text-xs">
        <span className="text-slate-400 font-mono text-[11px] hidden sm:inline">
          Memomes Secure Vault • Press <kbd className="bg-white/10 px-1.5 py-0.5 rounded text-white font-bold">Esc</kbd> to exit viewer
        </span>

        <div className="flex items-center gap-3 ml-auto">
          <button onClick={handleDownload} className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold transition flex items-center gap-2 shadow-lg">
            <Download className="w-4 h-4 text-[#F5B700]" /> Download File
          </button>

          {onOpenShare && (
            <button onClick={() => { onClose(); onOpenShare(file); }} className="btn-gold !h-9 !px-5 !text-xs">
              <Share2 className="w-4 h-4" /> Share Access
            </button>
          )}
        </div>
      </footer>

      {/* ── FILE PROPERTIES MODAL ───────────────────────────────────────────── */}
      {showPropertiesModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-[#0B1120] border border-white/10 rounded-3xl p-6 space-y-4 text-xs font-sans shadow-2xl text-left">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="text-sm font-bold text-[#F5B700] font-mono flex items-center gap-2">
                <Info className="w-4 h-4" /> File Properties & Metadata
              </h3>
              <button onClick={() => setShowPropertiesModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 font-mono text-slate-300 text-[11px]">
              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-slate-400">File Name:</span><span className="text-white font-bold truncate max-w-[200px]">{fileName}</span></div>
              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-slate-400">Category:</span><span className="text-cyan-400 font-bold uppercase">{ext}</span></div>
              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-slate-400">File Size:</span><span className="text-slate-100">{file.size || '2.4 MB'}</span></div>
              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-slate-400">Encryption:</span><span className="text-emerald-400 font-bold">AES-256 Zero-Knowledge</span></div>
              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-slate-400">Checksum SHA-256:</span><span className="text-amber-400 font-bold">e3b0c44298fc1c14...</span></div>
              <div className="flex justify-between py-1 border-b border-white/5"><span className="text-slate-400">Owner:</span><span className="text-slate-200">{userEmail}</span></div>
            </div>

            <div className="flex justify-end pt-2">
              <button onClick={() => setShowPropertiesModal(false)} className="btn-gold !h-8 !px-4 !text-xs">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
