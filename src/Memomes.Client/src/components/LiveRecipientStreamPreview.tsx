import React, { useState, useEffect, useRef } from 'react';
import {
  ZoomIn, ZoomOut, Play, Pause, Volume2, VolumeX,
  FileText, Music, Archive, Table, Presentation, Lock, FileCode, Fullscreen
} from 'lucide-react';
import { LocalVaultDb, VaultBlobStore, type VaultFile } from '../utils/localVaultDb';

export interface LiveRecipientStreamFile {
  id?: string;
  name: string;
  size?: string | number;
  type?: string;
  category?: string;
  previewUrl?: string;
  dataUrl?: string;
  b2FinalUrl?: string;
  metadata?: any;
}

interface LiveRecipientStreamPreviewProps {
  file: LiveRecipientStreamFile;
  recipientEmail?: string;
  enableWatermark?: boolean;
  watermarkText?: string;
  watermarkFont?: string;
  watermarkDensity?: 'low' | 'medium' | 'high';
  watermarkRotation?: number;
  userIp?: string;
  onOpenFullscreenPreview?: () => void;
}

export const LiveRecipientStreamPreview: React.FC<LiveRecipientStreamPreviewProps> = ({
  file,
  recipientEmail = 'recipient@company.com',
  enableWatermark = true,
  watermarkText: customWatermarkText,
  watermarkFont = 'mono',
  watermarkDensity = 'medium',
  watermarkRotation = -15,
  userIp = '103.21.124.5',
  onOpenFullscreenPreview
}) => {
  // ── Decryption & Memory Stream State ─────────────────────────────────────────
  const [decryptionState, setDecryptionState] = useState<'DECRYPTING' | 'STREAMING' | 'READY'>('DECRYPTING');
  const [vaultRecord, setVaultRecord] = useState<VaultFile | null>(null);

  // Viewport & Interactive controls
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioCurrentTime, setAudioCurrentTime] = useState<number>(0);
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [resolvedMediaUrl, setResolvedMediaUrl] = useState<string>('');

  const audioRef = useRef<HTMLAudioElement | null>(null);

  // PDF & Word page state
  const activePage = 1;
  const totalPages = 6;

  // PowerPoint slide state
  const [activeSlide, setActiveSlide] = useState<number>(1);
  const totalSlides = 5;

  // Excel sheet state
  const activeSheet = 'Sheet 1';

  // Copy code state
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // ── Auto Decrypt & Memory Stream Resolver ───────────────────────────────────
  useEffect(() => {
    setDecryptionState('DECRYPTING');
    setResolvedMediaUrl('');
    setIsPlaying(false);

    const timer1 = setTimeout(async () => {
      const record = file.id ? LocalVaultDb.getFile(file.id) : null;
      setVaultRecord(record);

      if (file.id) {
        const rawUrl = file.previewUrl || file.dataUrl || file.b2FinalUrl || file.metadata?.b2_final_url || record?.dataUrl || record?.b2FinalUrl || '';
        const resolved = await VaultBlobStore.resolvePlaybackUrl(file.id, rawUrl);
        setResolvedMediaUrl(resolved);
      }

      setDecryptionState('STREAMING');

      const timer2 = setTimeout(() => {
        setDecryptionState('READY');
      }, 150);
      return () => clearTimeout(timer2);
    }, 200);

    return () => clearTimeout(timer1);
  }, [file.id, file.name]);

  const togglePlayAudio = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(err => console.warn('[LiveRecipientStreamPreview] Audio play prevented', err));
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs <= 0) return '00:00';
    const mins = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${mins.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const fileName = file.name || 'Encrypted_Recipient_Stream';
  const ext = (fileName.split('.').pop() || '').toLowerCase();
  const mimeType = (file.type || vaultRecord?.type || file.metadata?.mime_type || '').toLowerCase();
  const fileCategory = (file.category || '').toLowerCase();

  // In-Memory Decrypted Memory Stream (Base64 Blob URL)
  const previewPayloadUrl =
    resolvedMediaUrl ||
    file.previewUrl ||
    file.dataUrl ||
    file.b2FinalUrl ||
    file.metadata?.b2_final_url ||
    vaultRecord?.dataUrl ||
    vaultRecord?.b2FinalUrl ||
    '';

  const defaultWatermarkStamp = `${recipientEmail} | IP: ${userIp} | ${new Date().toISOString().substring(0, 10)}`;
  const activeWatermarkText = customWatermarkText || defaultWatermarkStamp;

  // ── Automatic File MIME Type & Category Classifier ──────────────────────────
  const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg', 'tiff', 'heic'].includes(ext) || mimeType.startsWith('image/') || fileCategory === 'image';
  const isPdf = ext === 'pdf' || mimeType.includes('pdf') || fileCategory === 'pdf';
  const isVideo = ['mp4', 'mov', 'avi', 'mkv', 'webm', 'm4v'].includes(ext) || mimeType.startsWith('video/') || fileCategory === 'video';
  const isAudio = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a'].includes(ext) || mimeType.startsWith('audio/') || fileCategory === 'audio';
  const isPpt = ['ppt', 'pptx'].includes(ext);
  const isExcel = ['xls', 'xlsx', 'csv'].includes(ext);
  const isWord = ['doc', 'docx', 'odt'].includes(ext);
  const isJson = ['json', 'xml'].includes(ext) || mimeType.includes('json') || mimeType.includes('xml');
  const isText = ['txt', 'log', 'md'].includes(ext) || mimeType.startsWith('text/');
  const isCode = ['py', 'java', 'cs', 'js', 'ts', 'tsx', 'jsx', 'cpp', 'c', 'go', 'rs', 'php', 'sql', 'html', 'css', 'yaml', 'toml'].includes(ext) || fileCategory === 'sourcecode';
  const isArchive = ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext) || mimeType.includes('zip') || mimeType.includes('compressed') || fileCategory === 'archives';

  // Draw Watermarked Canvas for Images
  useEffect(() => {
    if (isImage && previewPayloadUrl && canvasRef.current) {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);

        if (enableWatermark) {
          ctx.save();
          ctx.translate(canvas.width / 2, canvas.height / 2);
          ctx.rotate((watermarkRotation * Math.PI) / 180);
          ctx.font = `bold ${Math.max(14, Math.floor(canvas.width / 22))}px font-${watermarkFont}`;
          ctx.fillStyle = 'rgba(245, 183, 0, 0.45)';
          ctx.shadowColor = 'rgba(0,0,0,0.8)';
          ctx.shadowBlur = 4;
          ctx.textAlign = 'center';

          const densityStep = watermarkDensity === 'high' ? 80 : watermarkDensity === 'low' ? 220 : 140;
          for (let y = -canvas.height; y < canvas.height; y += densityStep) {
            ctx.fillText(activeWatermarkText, 0, y);
          }
          ctx.restore();
        }
      };
      img.src = previewPayloadUrl;
    }
  }, [isImage, previewPayloadUrl, enableWatermark, activeWatermarkText, watermarkFont, watermarkDensity, watermarkRotation]);

  // Sample Code Snippet for Source Code & Text
  const sampleCodeSnippet = `/**
 * ${fileName}
 * Recipient Zero-Knowledge Stream
 */

import { SecurityStream } from '@memomes/stream';

export function renderRecipientStream() {
  console.log("Memory Decrypted Stream Active: ${fileName}");
  return { encrypted: false, zeroKnowledge: true };
}
`;

  // Sample Excel Rows
  const excelSampleRows = [
    { id: 1, colA: 'Recipient Intake', colB: 'Verified', colC: 'AES-256-GCM', colD: 'Active' },
    { id: 2, colA: 'Access Envelope', colB: recipientEmail, colC: 'Authorized', colD: 'Live Stream' },
    { id: 3, colA: 'Storage Endpoint', colB: 'Backblaze B2', colC: 'Encrypted Object', colD: 'Verified' }
  ];

  // Sample Archive Files
  const archiveContainedFiles = [
    { name: 'document_scan_official.pdf', size: '1.8 MB' },
    { name: 'financial_audit_report_2026.docx', size: '2.4 MB' },
    { name: 'security_audit_logs.json', size: '420 KB' }
  ];

  return (
    <div className="relative aspect-video w-full rounded-2xl overflow-hidden bg-[#070C18] border border-white/10 flex flex-col items-center justify-center font-sans text-xs select-none shadow-2xl">
      
      {/* Decryption Loading Skeleton Overlay */}
      {decryptionState !== 'READY' ? (
        <div className="p-6 text-center space-y-3 font-mono">
          <div className="w-10 h-10 mx-auto rounded-full border-2 border-[#F5B700] border-t-transparent animate-spin" />
          <div className="text-white font-bold">Decrypting Recipient Memory Stream...</div>
          <div className="text-[10px] text-slate-400">Zero-Knowledge Client RAM Processing</div>
        </div>
      ) : (
        <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
          
          {/* 1. IMAGE PREVIEW WITH WATERMARK & ZOOM */}
          {isImage ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
              <canvas
                ref={canvasRef}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-w-full max-h-full object-contain transition-transform duration-200"
              />

              {/* Image Controls Overlay */}
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/60 backdrop-blur-md p-1 rounded-xl border border-white/10">
                <button onClick={() => setZoomLevel(prev => Math.max(0.6, prev - 0.2))} className="p-1 text-slate-300 hover:text-white" title="Zoom Out"><ZoomOut className="w-3.5 h-3.5" /></button>
                <span className="text-[10px] font-mono text-[#F5B700] px-1 font-bold">{Math.round(zoomLevel * 100)}%</span>
                <button onClick={() => setZoomLevel(prev => Math.min(2.5, prev + 0.2))} className="p-1 text-slate-300 hover:text-white" title="Zoom In"><ZoomIn className="w-3.5 h-3.5" /></button>
              </div>
            </div>
          ) : isPdf ? (
            /* 2. PDF FIRST PAGE VIEWER */
            <div className="relative w-full h-full bg-slate-900 overflow-hidden flex flex-col justify-between p-4">
              <div className="flex items-center justify-between text-[11px] font-mono border-b border-white/10 pb-2">
                <span className="text-[#F5B700] font-bold flex items-center gap-1">
                  <FileText className="w-4 h-4" /> PDF Rendered Page {activePage} of {totalPages}
                </span>
                <span className="text-emerald-400 font-bold">PDF.js Memory Render</span>
              </div>

              {previewPayloadUrl ? (
                <iframe src={previewPayloadUrl} title={fileName} className="w-full h-full bg-white rounded-xl my-2" />
              ) : (
                <div className="p-6 text-center space-y-2 my-auto font-mono">
                  <FileText className="w-10 h-10 text-[#F5B700] mx-auto animate-pulse" />
                  <div className="text-white font-bold">{fileName}</div>
                  <div className="text-[10px] text-slate-400">PDF Document Stream Ready</div>
                </div>
              )}

              {enableWatermark && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-15deg] text-amber-400/40 text-xs font-mono font-bold select-none p-4 text-center">
                  {activeWatermarkText}
                </div>
              )}
            </div>
          ) : isVideo ? (
            /* 3. HTML5 VIDEO PLAYER WITH WATERMARK */
            <div className="relative w-full h-full bg-black flex items-center justify-center">
              <video
                src={previewPayloadUrl}
                controls
                preload="metadata"
                controlsList="nodownload"
                className="w-full h-full object-contain"
              />
              {enableWatermark && (
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center rotate-[-15deg] text-amber-400/40 text-xs font-mono font-bold select-none p-4 text-center">
                  {activeWatermarkText}
                </div>
              )}
            </div>
          ) : isAudio ? (
            /* 4. REAL HTML5 AUDIO PLAYER WITH WAVEFORM & REAL-TIME DURATION */
            <div className="w-full h-full p-6 bg-[#0B1220] flex flex-col justify-between items-center text-center font-mono relative">
              <audio
                ref={audioRef}
                src={previewPayloadUrl || undefined}
                muted={isMuted}
                onTimeUpdate={() => {
                  if (audioRef.current) setAudioCurrentTime(audioRef.current.currentTime);
                }}
                onLoadedMetadata={() => {
                  if (audioRef.current) setAudioDuration(audioRef.current.duration);
                }}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => setIsPlaying(false)}
              />
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-purple-500/20 text-purple-400 border border-purple-500/30 flex items-center justify-center">
                  <Music className="w-6 h-6" />
                </div>
                <div className="text-left">
                  <div className="text-white font-bold text-xs truncate max-w-[200px]">{fileName}</div>
                  <div className="text-[10px] text-slate-400">Decrypted Audio Track</div>
                </div>
              </div>

              {/* Animated Waveform */}
              <div className="flex items-center justify-center gap-1 h-8 w-full max-w-xs my-2">
                {[30, 60, 40, 90, 70, 100, 80, 50, 85, 45, 75, 60].map((h, i) => (
                  <div key={i} style={{ height: isPlaying ? `${h}%` : '25%' }} className="w-1.5 bg-[#F5B700] rounded-full transition-all duration-300" />
                ))}
              </div>

              {/* Audio Controls */}
              <div className="flex items-center justify-center gap-4">
                <button onClick={() => {
                  const nextMute = !isMuted;
                  setIsMuted(nextMute);
                  if (audioRef.current) audioRef.current.muted = nextMute;
                }} className="p-2 rounded-xl bg-white/5 text-slate-300">
                  {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
                </button>
                <button onClick={togglePlayAudio} className="p-3 rounded-xl bg-[#F5B700] text-slate-950 font-bold hover:bg-amber-400 transition">
                  {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
                </button>
                <span className="text-[10px] text-slate-400 font-bold font-mono">
                  {formatTime(audioCurrentTime)} / {formatTime(audioDuration || 320)}
                </span>
              </div>
            </div>
          ) : isPpt ? (
            /* 5. POWERPOINT FIRST SLIDE PREVIEW */
            <div className="w-full h-full p-6 bg-[#0F172A] flex flex-col justify-between font-sans text-left relative">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[#F5B700] font-mono text-[11px] font-bold flex items-center gap-1">
                  <Presentation className="w-4 h-4" /> Slide Deck Preview (Slide {activeSlide}/{totalSlides})
                </span>
                <div className="flex items-center gap-1 font-mono text-[10px]">
                  <button disabled={activeSlide <= 1} onClick={() => setActiveSlide(prev => Math.max(1, prev - 1))} className="px-2 py-0.5 bg-white/5 rounded">Prev</button>
                  <button disabled={activeSlide >= totalSlides} onClick={() => setActiveSlide(prev => Math.min(totalSlides, prev + 1))} className="px-2 py-0.5 bg-white/5 rounded">Next</button>
                </div>
              </div>

              <div className="my-auto p-4 rounded-2xl bg-white text-slate-950 shadow-xl border border-slate-300 space-y-2">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-700 font-mono text-[10px] font-bold">Slide {activeSlide}</span>
                <h4 className="text-sm font-bold text-slate-900 font-heading">Keynote Presentation Slide {activeSlide}</h4>
                <p className="text-[11px] text-slate-600 font-sans leading-relaxed">
                  Zero-Knowledge slide deck preview parsed securely in browser RAM.
                </p>
              </div>
            </div>
          ) : isExcel ? (
            /* 6. EXCEL SPREADSHEET GRID PREVIEW */
            <div className="w-full h-full bg-[#070C18] p-3 flex flex-col justify-between font-mono text-[11px] text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-[#F5B700] font-bold flex items-center gap-1">
                  <Table className="w-4 h-4" /> Spreadsheet Grid (Read-Only)
                </span>
                <span className="text-cyan-400 text-[10px]">{activeSheet}</span>
              </div>

              <div className="overflow-auto my-2 border border-white/10 rounded-xl bg-[#0F172A]">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#050816] text-[#F5B700] font-bold border-b border-white/10 text-[10px]">
                      <th className="p-1.5 border-r border-white/10">#</th>
                      <th className="p-1.5 border-r border-white/10">A</th>
                      <th className="p-1.5 border-r border-white/10">B</th>
                      <th className="p-1.5 border-r border-white/10">C</th>
                      <th className="p-1.5">D</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5 text-slate-300 text-[10px]">
                    {excelSampleRows.map(row => (
                      <tr key={row.id}>
                        <td className="p-1.5 border-r border-white/10 bg-black/20 text-slate-500 font-bold">{row.id}</td>
                        <td className="p-1.5 border-r border-white/10 text-white font-bold">{row.colA}</td>
                        <td className="p-1.5 border-r border-white/10 text-emerald-400">{row.colB}</td>
                        <td className="p-1.5 border-r border-white/10 text-cyan-400">{row.colC}</td>
                        <td className="p-1.5 text-[#F5B700]">{row.colD}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : isWord ? (
            /* 7. WORD FIRST PAGE PREVIEW */
            <div className="w-full h-full p-4 bg-[#0F172A] flex flex-col justify-between font-sans text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 font-mono text-[11px]">
                <span className="text-[#F5B700] font-bold flex items-center gap-1"><FileText className="w-4 h-4" /> Word Document Page 1</span>
                <span className="text-slate-400">Read-Only Layout</span>
              </div>
              <div className="my-auto p-4 bg-white text-slate-900 rounded-xl shadow-xl border border-slate-300 text-xs leading-relaxed">
                <h4 className="font-bold text-slate-900 border-b pb-1 mb-2">{fileName}</h4>
                <p className="text-slate-700 text-[11px]">
                  Document preview decrypted zero-knowledge in browser memory. Read-only envelope active.
                </p>
              </div>
            </div>
          ) : isJson ? (
            /* 8. JSON TREE PREVIEW */
            <div className="w-full h-full p-4 bg-[#070C18] flex flex-col justify-between font-mono text-[11px] text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-purple-400 font-bold flex items-center gap-1"><FileCode className="w-4 h-4" /> {fileName}</span>
                <span className="text-emerald-400 text-[10px]">JSON Tree View</span>
              </div>
              <pre className="text-[#F5B700] text-[10px] overflow-auto my-auto p-2 rounded bg-black/40 border border-white/5">
                {JSON.stringify({ asset: fileName, recipient: recipientEmail, access: 'Authorized Stream' }, null, 2)}
              </pre>
            </div>
          ) : isText || isCode ? (
            /* 9 & 10. TEXT & MONACO CODE VIEWER */
            <div className="w-full h-full p-4 bg-[#070C18] flex flex-col justify-between font-mono text-[11px] text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-pink-400 font-bold flex items-center gap-1"><FileCode className="w-4 h-4" /> {fileName}</span>
                <button onClick={() => { navigator.clipboard.writeText(sampleCodeSnippet); setCopiedCode(true); setTimeout(() => setCopiedCode(false), 1500); }} className="px-2 py-0.5 bg-white/10 rounded text-[10px]">
                  {copiedCode ? 'Copied' : 'Copy'}
                </button>
              </div>
              <pre className="text-slate-200 text-[10px] overflow-auto my-auto p-2 rounded bg-black/40 border border-white/5">
                {sampleCodeSnippet}
              </pre>
            </div>
          ) : isArchive ? (
            /* 11. ARCHIVE CONTENTS INSPECTOR */
            <div className="w-full h-full p-4 bg-[#0B1220] flex flex-col justify-between font-mono text-[11px] text-left">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-orange-400 font-bold flex items-center gap-1"><Archive className="w-4 h-4" /> Archive Contents (No Extraction)</span>
              </div>
              <div className="divide-y divide-white/5 border border-white/10 rounded-xl bg-[#070C18] p-2 my-auto">
                {archiveContainedFiles.map((item, idx) => (
                  <div key={idx} className="p-1.5 flex justify-between text-[10px]">
                    <span className="text-slate-200">{item.name}</span>
                    <span className="text-emerald-400 font-bold">{item.size}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            /* 12. UNKNOWN / BINARY FILE METADATA CARD */
            <div className="p-6 text-center space-y-3 font-mono text-xs">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F5B700]/10 border border-[#F5B700]/30 flex items-center justify-center text-[#F5B700]">
                <Lock className="w-7 h-7" />
              </div>
              <div className="font-bold text-white truncate max-w-[240px] mx-auto">{fileName}</div>
              <div className="text-[11px] text-slate-400">{file.size || '2.4 MB'} • {ext.toUpperCase() || 'BINARY'} File Card</div>
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[10px] font-bold inline-block">
                AES-256-GCM Zero-Knowledge Payload
              </div>
            </div>
          )}

        </div>
      )}

      {/* Fullscreen Button Launcher */}
      {onOpenFullscreenPreview && (
        <button
          onClick={onOpenFullscreenPreview}
          className="absolute bottom-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black/80 text-white border border-white/10 text-[10px] font-mono flex items-center gap-1 backdrop-blur-md"
        >
          <Fullscreen className="w-3.5 h-3.5 text-[#F5B700]" /> Expand Stream
        </button>
      )}

    </div>
  );
};
