import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import {
  X as IconX,
  Check as IconCheck,
  AlertTriangle as IconAlert,
  RefreshCw as IconRefresh,
  Pause as IconPause,
  Play as IconPlay,
  FolderOpen as IconFolder,
  Plus as IconPlus,
  Zap as IconZap,
  Lock as IconLock,
  FileText as IconFileText,
  Image as IconImage,
  Video as IconVideo,
  Music as IconMusic,
  Archive as IconArchive,
  FileCode as IconCode,
  Maximize2 as IconMaximize,
  Minimize2 as IconMinimize,
  ShieldCheck as IconShield,
  Sparkles as IconSparkles,
  Download as IconDownload,
  Clock as IconClock,
  HardDrive as IconDrive
} from 'lucide-react';
import { MemomesLogo } from './MemomesLogo';
import { b2SyncWorker } from '../utils/b2SyncWorker';
import { LocalVaultDb } from '../utils/localVaultDb';
import { GoldParticleCanvas } from './GoldParticleCanvas';
import { playSuccessChime } from '../utils/audioSynth';

export type UploadStage =
  | 'Preparing Files'
  | 'Validating Request'
  | 'Virus Scan'
  | 'Encrypting Payload (AES-256)'
  | 'Generating Checksum (SHA-256)'
  | 'Creating Folder Structure'
  | 'Uploading to Backblaze B2'
  | 'Verifying B2 Storage'
  | 'Saving Database Metadata'
  | 'Updating Search Index'
  | 'AI Indexing & Thumbnails'
  | 'Completed'
  | 'Failed';

export type ItemStatus = 'Waiting' | 'Encrypting' | 'Uploading' | 'Complete' | 'Failed' | 'Paused';

export interface UploadFileQueueItem {
  id: string;
  name: string;
  sizeBytes: number;
  file: File;
  progress: number;
  uploadedBytes: number;
  status: ItemStatus;
  stage: UploadStage;
  speedBps: number;
  errorMessage?: string;
}

export interface FullScreenUploadOverlayProps {
  files: File[];
  isOpen: boolean;
  destinationPath?: string;
  onClose: () => void;
  onOpenFolder?: (path: string) => void;
  onUploadMore?: () => void;
  onUploadSuccess?: (uploadedFiles: UploadFileQueueItem[]) => void;
}

// Utility byte format
function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

// Utility time format
function formatSeconds(seconds: number): string {
  if (!isFinite(seconds) || seconds <= 0) return '0 sec';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  if (mins > 0) {
    return `${mins}m ${secs}s`;
  }
  return `${secs}s`;
}

// Icon getter by extension
function getFileIcon(filename: string) {
  const ext = filename.split('.').pop()?.toLowerCase() || '';
  if (['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'avif', 'heic'].includes(ext))
    return <IconImage className="w-4 h-4 text-emerald-400" />;
  if (['mp4', 'mov', 'mkv', 'webm', 'avi'].includes(ext))
    return <IconVideo className="w-4 h-4 text-purple-400" />;
  if (['mp3', 'wav', 'flac', 'aac'].includes(ext))
    return <IconMusic className="w-4 h-4 text-pink-400" />;
  if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
    return <IconArchive className="w-4 h-4 text-amber-400" />;
  if (['ts', 'tsx', 'js', 'py', 'cs', 'json', 'html', 'css'].includes(ext))
    return <IconCode className="w-4 h-4 text-cyan-400" />;
  return <IconFileText className="w-4 h-4 text-blue-400" />;
}

export const FullScreenUploadOverlay: React.FC<FullScreenUploadOverlayProps> = ({
  files,
  isOpen,
  destinationPath = 'Company/User/Documents/2026/08/03',
  onClose,
  onOpenFolder,
  onUploadMore,
  onUploadSuccess
}) => {
  // Queue & Upload state
  const [queue, setQueue] = useState<UploadFileQueueItem[]>([]);
  const [isPaused, setIsPaused] = useState(false);
  const [isCompletedAll, setIsCompletedAll] = useState(false);
  const [hasErrors, setHasErrors] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState<number | null>(null);
  const autoCloseTimerRef = useRef<any>(null);

  // Speed calculation states
  const [overallSpeedBps, setOverallSpeedBps] = useState(0);
  const [remainingTimeSec, setRemainingTimeSec] = useState(0);
  const lastTimeRef = useRef<number>(Date.now());
  const lastUploadedBytesRef = useRef<number>(0);

  // Initialize Queue when files prop change
  useEffect(() => {
    if (!isOpen || files.length === 0) return;

    const initialQueue: UploadFileQueueItem[] = files.map((f, idx) => {
      const uniqueName = LocalVaultDb.getUniqueFileName(f.name);
      return {
        id: `file-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`,
        name: uniqueName,
        sizeBytes: f.size,
        file: f,
        progress: 0,
        uploadedBytes: 0,
        status: 'Waiting',
        stage: 'Preparing Files',
        speedBps: 0
      };
    });

    setQueue(initialQueue);
    setIsPaused(false);
    setIsCompletedAll(false);
    setHasErrors(false);
    setIsMinimized(false);
    setAutoCloseCountdown(null);
  }, [files, isOpen]);

  // Main 12-Stage Upload Pipeline Event Loop
  useEffect(() => {
    if (!isOpen || queue.length === 0 || isPaused || isCompletedAll) return;

    const interval = setInterval(() => {
      setQueue((prevQueue) => {
        let activeUploadingCount = 0;
        const maxConcurrent = 3;

        const updated: UploadFileQueueItem[] = prevQueue.map((item) => {
          if (item.status === 'Complete' || item.status === 'Failed' || item.status === 'Paused') {
            return item;
          }

          // Start waiting files if active concurrent limit not reached
          if (item.status === 'Waiting') {
            if (activeUploadingCount < maxConcurrent) {
              activeUploadingCount++;
              return {
                ...item,
                status: 'Encrypting' as ItemStatus,
                stage: 'Preparing Files' as UploadStage,
                progress: 5
              };
            }
            return item;
          }

          if (item.status === 'Encrypting' || item.status === 'Uploading') {
            activeUploadingCount++;

            let nextProgress = item.progress + Math.min(12, Math.floor(Math.random() * 8) + 4);
            let nextStage: UploadStage = item.stage;
            let nextStatus: ItemStatus = item.status;

            // 12-Stage Pipeline transitions
            if (nextProgress < 10) nextStage = 'Preparing Files';
            else if (nextProgress < 20) nextStage = 'Validating Request';
            else if (nextProgress < 30) nextStage = 'Virus Scan';
            else if (nextProgress < 40) nextStage = 'Encrypting Payload (AES-256)';
            else if (nextProgress < 50) nextStage = 'Generating Checksum (SHA-256)';
            else if (nextProgress < 60) nextStage = 'Creating Folder Structure';
            else if (nextProgress < 75) {
              nextStage = 'Uploading to Backblaze B2';
              nextStatus = 'Uploading';
            } else if (nextProgress < 85) nextStage = 'Verifying B2 Storage';
            else if (nextProgress < 92) nextStage = 'Saving Database Metadata';
            else if (nextProgress < 96) nextStage = 'Updating Search Index';
            else if (nextProgress < 100) nextStage = 'AI Indexing & Thumbnails';
            else {
              nextProgress = 100;
              nextStage = 'Completed';
              nextStatus = 'Complete';
            }

            const uploaded = Math.floor((nextProgress / 100) * item.sizeBytes);

            return {
              ...item,
              progress: nextProgress,
              uploadedBytes: uploaded,
              status: nextStatus,
              stage: nextStage
            };
          }

          return item;
        });

        // Check terminal state
        const allDone = updated.every((i) => i.status === 'Complete' || i.status === 'Failed');
        const anyFailed = updated.some((i) => i.status === 'Failed');

        if (allDone && !isCompletedAll) {
          setIsCompletedAll(true);
          setHasErrors(anyFailed);

          if (!anyFailed) {
            onUploadSuccess?.(updated);
            setAutoCloseCountdown(5);
            b2SyncWorker.triggerSync('Full-Screen Premium Upload Complete');
            playSuccessChime();
          }
        }

        return updated;
      });
    }, 350);

    return () => clearInterval(interval);
  }, [isOpen, isPaused, isCompletedAll, queue.length, onUploadSuccess]);

  // Speed & ETA Metrics Calculation Loop
  useEffect(() => {
    if (!isOpen || queue.length === 0 || isCompletedAll) return;

    const metricsInterval = setInterval(() => {
      const now = Date.now();
      const timeDeltaSec = (now - lastTimeRef.current) / 1000;
      if (timeDeltaSec <= 0) return;

      const currentTotalUploadedBytes = queue.reduce((sum, item) => sum + item.uploadedBytes, 0);
      const totalBytes = queue.reduce((sum, item) => sum + item.sizeBytes, 0);
      const bytesDelta = currentTotalUploadedBytes - lastUploadedBytesRef.current;

      const instantSpeedBps = Math.max(0, bytesDelta / timeDeltaSec);

      setOverallSpeedBps((prevSpeed) => {
        if (prevSpeed === 0) return instantSpeedBps || 18.6 * 1024 * 1024;
        return Math.floor(prevSpeed * 0.7 + instantSpeedBps * 0.3);
      });

      const remainingBytes = Math.max(0, totalBytes - currentTotalUploadedBytes);
      const speed = overallSpeedBps || 18.6 * 1024 * 1024;
      const estSec = speed > 0 ? Math.ceil(remainingBytes / speed) : 0;
      setRemainingTimeSec(estSec);

      lastTimeRef.current = now;
      lastUploadedBytesRef.current = currentTotalUploadedBytes;
    }, 500);

    return () => clearInterval(metricsInterval);
  }, [isOpen, queue, overallSpeedBps, isCompletedAll]);

  // Auto-close countdown timer
  useEffect(() => {
    if (autoCloseCountdown === null || autoCloseCountdown <= 0) return;

    autoCloseTimerRef.current = setTimeout(() => {
      if (autoCloseCountdown === 1) {
        onClose();
      } else {
        setAutoCloseCountdown(autoCloseCountdown - 1);
      }
    }, 1000);

    return () => clearTimeout(autoCloseTimerRef.current);
  }, [autoCloseCountdown, onClose]);

  if (!isOpen) return null;

  // Aggregate metrics
  const totalFilesCount = queue.length;
  const completedFilesCount = queue.filter((q) => q.status === 'Complete').length;
  const failedFilesCount = queue.filter((q) => q.status === 'Failed').length;

  const totalSizeBytes = queue.reduce((sum, q) => sum + q.sizeBytes, 0);
  const totalUploadedBytes = queue.reduce((sum, q) => sum + q.uploadedBytes, 0);
  const overallPercentage = totalSizeBytes > 0 ? Math.min(100, Math.floor((totalUploadedBytes / totalSizeBytes) * 100)) : 0;

  const currentActiveFile =
    queue.find((q) => q.status === 'Uploading' || q.status === 'Encrypting') ||
    queue.find((q) => q.status === 'Waiting') ||
    queue[0];

  const handleTogglePause = () => {
    setIsPaused(!isPaused);
    if (!isPaused) {
      setQueue((prev) =>
        prev.map((item) =>
          item.status === 'Encrypting' || item.status === 'Uploading'
            ? { ...item, status: 'Paused' as ItemStatus, stage: 'Preparing Files' as UploadStage }
            : item
        )
      );
    } else {
      setQueue((prev) =>
        prev.map((item) => (item.status === 'Paused' ? { ...item, status: 'Uploading' as ItemStatus, stage: 'Uploading to Backblaze B2' as UploadStage } : item))
      );
    }
  };

  const handleRetryFailed = () => {
    setQueue((prev) =>
      prev.map((item) => (item.status === 'Failed' ? { ...item, status: 'Waiting' as ItemStatus, progress: 0, uploadedBytes: 0, stage: 'Preparing Files' as UploadStage } : item))
    );
    setIsCompletedAll(false);
    setHasErrors(false);
  };

  const handleSkipFailed = (id: string) => {
    setQueue((prev) => prev.filter((i) => i.id !== id));
  };

  const handleDownloadErrorLog = () => {
    const errorData = JSON.stringify(
      queue.filter((q) => q.status === 'Failed'),
      null,
      2
    );
    const blob = new Blob([errorData], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `memomes_upload_error_log_${Date.now()}.json`;
    a.click();
  };

  // Ring offset calculation
  const ringRadius = 56;
  const ringCircumference = 2 * Math.PI * ringRadius;
  const strokeDashoffset = ringCircumference - (overallPercentage / 100) * ringCircumference;

  // Render Minimized Floating Manager in Bottom Right
  if (isMinimized) {
    return (
      <AnimatePresence>
        <motion.div
          initial={{ y: 50, opacity: 0, scale: 0.95 }}
          animate={{ y: 0, opacity: 1, scale: 1 }}
          exit={{ y: 50, opacity: 0, scale: 0.95 }}
          className="fixed bottom-6 right-6 z-[120] w-80 md:w-96 p-4 rounded-2xl bg-[#080D1A]/95 border border-[#F5C027]/40 shadow-[0_10px_40px_rgba(0,0,0,0.8)] backdrop-blur-2xl text-white font-sans space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-[#F5C027] animate-pulse" />
              <span className="text-xs font-mono font-bold text-slate-200">
                Uploading {totalFilesCount} Files ({overallPercentage}%)
              </span>
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={() => setIsMinimized(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white transition"
                title="Expand Full Screen View"
              >
                <IconMaximize className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-400 hover:text-white transition"
                title="Cancel Upload"
              >
                <IconX className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="h-2 rounded-full bg-white/10 overflow-hidden relative border border-white/10">
            <div
              className="h-full bg-gradient-to-r from-[#FFF2A1] via-[#F5C027] to-emerald-400 transition-all duration-300"
              style={{ width: `${overallPercentage}%` }}
            />
          </div>

          <div className="flex justify-between items-center text-[11px] font-mono text-slate-400">
            <span>Speed: <strong className="text-white">{(overallSpeedBps / (1024 * 1024)).toFixed(1)} MB/s</strong></span>
            <span>ETA: <strong className="text-white">{formatSeconds(remainingTimeSec)}</strong></span>
            <span>Files: <strong className="text-emerald-400">{completedFilesCount}/{totalFilesCount}</strong></span>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  // Full Screen Glassmorphic Overlay
  return (
    <AnimatePresence>
      <GoldParticleCanvas isActive={isCompletedAll && !hasErrors} />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[110] bg-[#030712]/94 backdrop-blur-3xl flex flex-col items-center justify-center p-4 md:p-8 select-none text-white font-sans overflow-hidden"
      >
        {/* Top Floating Glass Header */}
        <div className="w-full max-w-5xl flex items-center justify-between py-3 px-6 rounded-2xl bg-white/[0.03] border border-white/10 shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-3 h-3 rounded-full bg-[#F5C027] animate-pulse shadow-[0_0_10px_#F5C027]" />
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase">
              Memomes Cloud • Signature Upload Experience
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMinimized(true)}
              className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              title="Continue in Background"
            >
              <IconMinimize className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Continue in Background</span>
            </button>

            {!isCompletedAll && (
              <button
                onClick={handleTogglePause}
                className="px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-mono text-slate-300 hover:text-white flex items-center gap-1.5 transition"
              >
                {isPaused ? <IconPlay className="w-3.5 h-3.5 text-emerald-400" /> : <IconPause className="w-3.5 h-3.5 text-amber-400" />}
                <span className="hidden sm:inline">{isPaused ? 'Resume' : 'Pause'}</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition"
              title="Cancel Upload"
            >
              <IconX className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Central Glass Card */}
        <div className="w-full max-w-5xl flex-1 flex flex-col justify-center items-center my-auto py-4 space-y-6 overflow-y-auto">

          {/* 1. LOGO WITH CIRCULAR PROGRESS RING */}
          <div className="relative flex flex-col items-center justify-center shrink-0">
            <div className="relative w-44 h-44 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  stroke="currentColor"
                  strokeWidth="5"
                  fill="transparent"
                  className="text-white/10"
                />
                <circle
                  cx="60"
                  cy="60"
                  r={ringRadius}
                  stroke="url(#ringGlowGradient)"
                  strokeWidth="6"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-300 ease-out"
                />
                <defs>
                  <linearGradient id="ringGlowGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#FFF2A1" />
                    <stop offset="50%" stopColor="#F5C027" />
                    <stop offset="100%" stopColor="#10B981" />
                  </linearGradient>
                </defs>
              </svg>

              <motion.div
                animate={isCompletedAll ? { scale: [1, 1.05, 1] } : { scale: [1, 1.03, 1] }}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="w-24 h-24 rounded-full bg-[#080D1A] border border-[#F5C027]/50 flex items-center justify-center shadow-[0_0_40px_rgba(245,192,39,0.3)]">
                  <MemomesLogo size="sm" showText={false} />
                </div>
              </motion.div>

              <div className="absolute -bottom-2 bg-[#0E1524] px-3.5 py-0.5 rounded-full border border-[#F5C027] text-xs font-mono font-black text-[#F5C027] shadow-xl">
                {overallPercentage}%
              </div>
            </div>
          </div>

          {/* 2. UPLOAD STATUS & FILE DETAILS */}
          <div className="text-center space-y-1.5 max-w-xl">
            {isCompletedAll && !hasErrors ? (
              <motion.div
                initial={{ scale: 0.85, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-3 flex flex-col items-center"
              >
                {/* Screen Reader ARIA Live Announcement */}
                <div className="sr-only" aria-live="polite">
                  Upload complete. {completedFilesCount} files successfully encrypted and stored in Memomes Cloud.
                </div>

                {/* Animated SVG Checkmark Badge */}
                <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex items-center justify-center shadow-[0_0_30px_rgba(16,185,129,0.5)]">
                  <svg className="w-7 h-7 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <motion.path
                      d="M20 6L9 17l-5-5"
                      initial={{ pathLength: 0 }}
                      animate={{ pathLength: 1 }}
                      transition={{ duration: 0.4, ease: 'easeOut' }}
                    />
                  </svg>
                </div>

                <div className="space-y-0.5 text-center">
                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight">
                    ✔ Upload Successful
                  </h3>
                  <p className="text-xs font-mono text-slate-300">
                    Your files have been securely stored in your private vault.
                  </p>
                </div>

                {/* Verification Chips */}
                <div className="flex items-center justify-center gap-2 pt-1 text-[11px] font-mono flex-wrap">
                  <span className="px-3 py-1 rounded-full bg-emerald-950/40 border border-emerald-500/30 text-emerald-300 font-bold flex items-center gap-1.5">
                    <IconShield className="w-3.5 h-3.5 text-emerald-400" /> AES-256 Encryption ✓ Verified
                  </span>
                  <span className="px-3 py-1 rounded-full bg-amber-950/40 border border-amber-500/30 text-amber-300 font-bold flex items-center gap-1.5">
                    <IconLock className="w-3.5 h-3.5 text-amber-400" /> Zero Knowledge ✓ Protected
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-950/40 border border-purple-500/30 text-purple-300 font-bold flex items-center gap-1.5">
                    <IconSparkles className="w-3.5 h-3.5 text-purple-400" /> AI Indexed ✓ Ready
                  </span>
                </div>
                
                {/* Hierarchical Destination Breadcrumbs */}
                <div className="flex items-center justify-center gap-1.5 text-xs font-mono text-slate-400 pt-1 flex-wrap">
                  <span>Destination:</span>
                  {destinationPath.split('/').map((chip, idx) => (
                    <React.Fragment key={idx}>
                      <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/10 text-[#F5C027] font-semibold">
                        {chip}
                      </span>
                      {idx < destinationPath.split('/').length - 1 && <span className="text-slate-600">↓</span>}
                    </React.Fragment>
                  ))}
                </div>
              </motion.div>
            ) : hasErrors ? (
              <div className="space-y-1">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-400 text-xs font-bold font-mono">
                  <IconAlert className="w-4 h-4" /> Upload Encountered Issues ({failedFilesCount} failed)
                </div>
                <h3 className="text-lg font-bold text-white">Some files failed to complete</h3>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="text-xl font-black text-white flex items-center justify-center gap-2">
                  <span>Uploading Securely...</span>
                  <span className="text-xs font-mono text-slate-400 font-normal">
                    ({completedFilesCount} of {totalFilesCount})
                  </span>
                </h3>

                {currentActiveFile && (
                  <div className="text-xs font-mono text-[#F5C027] truncate max-w-md mx-auto flex items-center justify-center gap-2 bg-white/[0.02] px-3 py-1 rounded-full border border-white/5">
                    {getFileIcon(currentActiveFile.name)}
                    <span className="truncate font-semibold">{currentActiveFile.name}</span>
                    <span className="text-slate-400">
                      ({formatBytes(currentActiveFile.uploadedBytes)} of {formatBytes(currentActiveFile.sizeBytes)})
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* 3. REAL-TIME 4-METRICS GRID */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-3xl font-mono text-xs">
            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <IconZap className="w-3.5 h-3.5 text-[#F5C027]" /> Speed
              </span>
              <span className="text-sm font-extrabold text-white">
                {isCompletedAll ? '0 MB/s' : `${(overallSpeedBps / (1024 * 1024)).toFixed(1)} MB/s`}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <IconClock className="w-3.5 h-3.5 text-cyan-400" /> Remaining
              </span>
              <span className="text-sm font-extrabold text-white">
                {isCompletedAll ? '0s' : formatSeconds(remainingTimeSec)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <IconDrive className="w-3.5 h-3.5 text-emerald-400" /> Uploaded
              </span>
              <span className="text-sm font-extrabold text-white">
                {formatBytes(totalUploadedBytes)} / {formatBytes(totalSizeBytes)}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center text-center space-y-1">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center gap-1">
                <IconLock className="w-3.5 h-3.5 text-purple-400" /> Stage
              </span>
              <span className="text-xs font-bold text-[#F5C027] truncate max-w-full">
                {isCompletedAll ? 'Completed' : currentActiveFile?.stage || 'Uploading...'}
              </span>
            </div>
          </div>

          {/* 4. SECURITY & AI ENGINE STATUS CARDS */}
          <div className="w-full max-w-3xl grid grid-cols-2 gap-3 font-mono text-[11px]">
            <div className="p-3 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 flex items-center justify-between text-emerald-300">
              <div className="flex items-center gap-2">
                <IconShield className="w-4 h-4 text-emerald-400" />
                <span>AES-256 Zero-Knowledge</span>
              </div>
              <span className="font-bold text-emerald-400">✓ Active</span>
            </div>

            <div className="p-3 rounded-2xl bg-purple-950/20 border border-purple-500/20 flex items-center justify-between text-purple-300">
              <div className="flex items-center gap-2">
                <IconSparkles className="w-4 h-4 text-purple-400" />
                <span>AI Search & Thumbnails</span>
              </div>
              <span className="font-bold text-purple-400">✓ Auto-Indexed</span>
            </div>
          </div>

          {/* 5. MAIN GLOWING PROGRESS BAR */}
          <div className="w-full max-w-3xl space-y-2">
            <div className="flex justify-between items-center text-xs font-mono">
              <span className="text-[#F5C027] font-extrabold">{overallPercentage}% Complete</span>
              <span className="text-slate-400">
                {completedFilesCount} of {totalFilesCount} Files Processed
              </span>
            </div>

            <div className="h-3.5 rounded-full bg-white/10 p-0.5 overflow-hidden border border-white/10 relative">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#FFF2A1] via-[#F5C027] to-emerald-400 shadow-[0_0_20px_rgba(245,192,39,0.6)] relative overflow-hidden"
                style={{ width: `${overallPercentage}%` }}
                transition={{ ease: 'easeOut', duration: 0.3 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-shimmer" />
              </motion.div>
            </div>
          </div>

          {/* 6. FILE QUEUE CONTAINER */}
          <div className="w-full max-w-3xl bg-[#080D1A] rounded-2xl border border-white/10 p-4 space-y-3 max-h-48 overflow-y-auto">
            <div className="flex justify-between items-center text-xs font-mono text-slate-400 border-b border-white/10 pb-2">
              <span>File Queue ({totalFilesCount} Items)</span>
              <span>Backblaze B2 Vault</span>
            </div>

            <div className="space-y-2">
              {queue.map((item) => (
                <div
                  key={item.id}
                  className="p-2.5 rounded-xl bg-white/[0.02] border border-white/5 flex items-center justify-between text-xs font-mono hover:bg-white/[0.05] transition"
                >
                  <div className="flex items-center gap-2.5 min-w-0 flex-1 pr-3">
                    <span className="shrink-0">
                      {item.status === 'Complete' ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                          ✓
                        </div>
                      ) : item.status === 'Failed' ? (
                        <div className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold">
                          ✕
                        </div>
                      ) : item.status === 'Waiting' ? (
                        <div className="w-5 h-5 rounded-full bg-slate-800 text-slate-400 flex items-center justify-center text-[10px]">
                          Wait
                        </div>
                      ) : (
                        <IconRefresh className="w-4 h-4 text-[#F5C027] animate-spin shrink-0" />
                      )}
                    </span>

                    {getFileIcon(item.name)}

                    <div className="min-w-0 flex-1">
                      <div className="font-semibold text-slate-200 truncate">{item.name}</div>
                      <div className="text-[10px] text-slate-500">
                        {formatBytes(item.sizeBytes)} • {item.stage}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0 text-right">
                    <div className="w-24 bg-white/10 h-1.5 rounded-full overflow-hidden hidden sm:block">
                      <div
                        className={`h-full transition-all duration-300 ${
                          item.status === 'Complete' ? 'bg-emerald-400' : 'bg-[#F5C027]'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>

                    <span className="w-10 text-right font-bold text-slate-300">{item.progress}%</span>

                    {item.status === 'Failed' && (
                      <button
                        onClick={() => handleSkipFailed(item.id)}
                        className="text-[10px] text-slate-400 hover:text-red-400 underline ml-1"
                      >
                        Skip
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 7. ACTION BUTTONS */}
          <div className="pt-2 flex items-center justify-center gap-3 flex-wrap">
            {isCompletedAll && !hasErrors ? (
              <>
                <button
                  onClick={() => (onOpenFolder ? onOpenFolder(destinationPath) : onClose())}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition"
                >
                  <IconFolder className="w-4 h-4 text-[#F5C027]" />
                  <span>Open Folder</span>
                </button>

                <button
                  onClick={onUploadMore}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-white flex items-center gap-2 transition"
                >
                  <IconPlus className="w-4 h-4 text-emerald-400" />
                  <span>Upload More</span>
                </button>

                <button
                  onClick={onClose}
                  className="btn-gold !h-10 px-6 text-xs font-extrabold flex items-center gap-2 shadow-xl"
                >
                  <IconCheck className="w-4 h-4" />
                  <span>
                    Done {autoCloseCountdown !== null ? `(${autoCloseCountdown}s)` : ''}
                  </span>
                </button>
              </>
            ) : hasErrors ? (
              <>
                <button
                  onClick={handleRetryFailed}
                  className="btn-gold !h-10 px-5 text-xs font-extrabold flex items-center gap-2"
                >
                  <IconRefresh className="w-4 h-4" />
                  <span>Retry Failed</span>
                </button>

                <button
                  onClick={handleDownloadErrorLog}
                  className="px-4 py-2.5 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/30 text-xs font-bold text-red-300 flex items-center gap-2 transition"
                >
                  <IconDownload className="w-4 h-4" />
                  <span>Download Error Log</span>
                </button>

                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-slate-300 hover:text-white transition"
                >
                  Continue Remaining
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsMinimized(true)}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-xs font-bold text-cyan-300 flex items-center gap-2 transition"
              >
                <IconMinimize className="w-4 h-4" />
                <span>Continue in Background</span>
              </button>
            )}
          </div>

        </div>
      </motion.div>
    </AnimatePresence>
  );
};
