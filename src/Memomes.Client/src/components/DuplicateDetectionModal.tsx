import React, { useState } from 'react';
import {
  AlertTriangle, Copy, FileText,
  RefreshCw, PlusCircle, Eye, X, GitCompare, ArrowRight, FolderInput
} from 'lucide-react';
import type { DuplicateCheckResult, DuplicateActionOptions } from '../utils/duplicateDetector';
import type { VaultFile } from '../utils/localVaultDb';

interface DuplicateDetectionModalProps {
  isOpen: boolean;
  duplicateInfo: DuplicateCheckResult | null;
  onResolve: (option: DuplicateActionOptions) => void;
  onViewExisting?: (file: VaultFile) => void;
  onOpenCompare?: (existingFile: VaultFile) => void;
  onClose: () => void;
}

export const DuplicateDetectionModal: React.FC<DuplicateDetectionModalProps> = ({
  isOpen,
  duplicateInfo,
  onResolve,
  onViewExisting,
  onOpenCompare,
  onClose
}) => {
  const [rememberChoice, setRememberChoice] = useState(false);

  if (!isOpen || !duplicateInfo || !duplicateInfo.isDuplicate || !duplicateInfo.existingFile) {
    return null;
  }

  const { duplicateCase, existingFile, description, matchPercentage } = duplicateInfo;

  const fmtBytes = (bytes?: number | string) => {
    if (!bytes) return '0 B';
    if (typeof bytes === 'string') return bytes;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const formattedDate = (rawDate?: string) => {
    if (!rawDate) return 'Aug 4, 2026';
    try {
      return new Date(rawDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return rawDate;
    }
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="glass-card max-w-xl w-full p-6 rounded-3xl border border-amber-500/30 shadow-[0_0_60px_rgba(245,183,0,0.15)] space-y-5 text-sans text-xs">
        
        {/* ── HEADER ───────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F5B700] shadow-inner">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                {duplicateCase === 'CASE_1' && 'Exact Duplicate Detected'}
                {duplicateCase === 'CASE_2' && 'Filename Conflict'}
                {duplicateCase === 'CASE_3' && 'Duplicate Content Detected'}
                {duplicateCase === 'CASE_4' && 'Duplicate Across Folder'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Close duplicate dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── EXISTING FILE DETAILS CARD ────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 space-y-2">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-[10px] font-bold text-amber-400 uppercase font-mono tracking-wider flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Existing Vault File
            </span>
            {matchPercentage > 0 && (
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold">
                SHA Match: {matchPercentage}%
              </span>
            )}
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">File Name:</span>
              <span className="text-white font-bold truncate max-w-[220px]" title={existingFile.name}>
                {existingFile.name}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Upload Date:</span>
              <span className="text-slate-200 font-mono">
                {formattedDate(existingFile.metadata?.created_at || existingFile.updatedAt)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">File Size:</span>
              <span className="text-emerald-400 font-mono font-bold">
                {fmtBytes(existingFile.size || existingFile.metadata?.file_size)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Folder Location:</span>
              <span className="text-amber-400 font-semibold font-mono">
                {existingFile.metadata?.folder_path || 'Home > Documents'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-slate-400">Version:</span>
              <span className="text-purple-300 font-mono">
                {existingFile.metadata?.version ? `v${existingFile.metadata.version}.0` : 'v1.0 (Latest)'}
              </span>
            </div>
          </div>
        </div>

        {/* ── CASE-SPECIFIC ACTION MATRIX ──────────────────────────────────────── */}
        <div className="space-y-2 pt-1">
          {duplicateCase === 'CASE_1' && (
            /* CASE 1: Same SHA + Same Folder -> Skip (Default), Open, Replace, Create Version, Keep Both, Compare */
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onResolve({ action: 'SKIP' })}
                  className="flex-1 btn-gold !h-10 !text-xs shadow-lg flex items-center justify-center gap-1.5 font-bold"
                >
                  <X className="w-4 h-4" /> Skip Upload (Default)
                </button>
                {onViewExisting && (
                  <button
                    onClick={() => { onViewExisting(existingFile); onClose(); }}
                    className="py-2.5 px-3 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition flex items-center gap-1.5"
                  >
                    <Eye className="w-4 h-4" /> Open Existing
                  </button>
                )}
              </div>

              <div className="grid grid-cols-4 gap-1.5">
                <button
                  onClick={() => onResolve({ action: 'REPLACE' })}
                  className="py-2 px-2.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-[11px] transition flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" /> Replace
                </button>
                <button
                  onClick={() => onResolve({ action: 'CREATE_VERSION' })}
                  className="py-2 px-2.5 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-[11px] transition flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-3 h-3" /> Create Version
                </button>
                <button
                  onClick={() => onResolve({ action: 'KEEP_BOTH' })}
                  className="py-2 px-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-[11px] transition flex items-center justify-center gap-1"
                >
                  <PlusCircle className="w-3 h-3 text-emerald-400" /> Keep Both
                </button>
                {onOpenCompare && (
                  <button
                    onClick={() => { onOpenCompare(existingFile); onClose(); }}
                    className="py-2 px-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold text-[11px] transition flex items-center justify-center gap-1"
                  >
                    <GitCompare className="w-3 h-3 text-cyan-400" /> Compare
                  </button>
                )}
              </div>
            </div>
          )}

          {duplicateCase === 'CASE_2' && (
            /* CASE 2: Same Name + Diff SHA -> Rename Auto, Replace, Create Version, Cancel */
            <div className="space-y-2">
              <button
                onClick={() => onResolve({ action: 'RENAME_AUTO' })}
                className="w-full btn-gold !h-10 !text-xs shadow-lg flex items-center justify-center gap-2 font-bold"
              >
                <Copy className="w-4 h-4" /> Rename Automatically
              </button>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onResolve({ action: 'REPLACE' })}
                  className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center justify-center gap-1"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Replace
                </button>
                <button
                  onClick={() => onResolve({ action: 'CREATE_VERSION' })}
                  className="py-2.5 px-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 border border-purple-500/30 font-bold text-xs transition flex items-center justify-center gap-1"
                >
                  <ArrowRight className="w-3.5 h-3.5" /> Version
                </button>
                <button
                  onClick={() => onResolve({ action: 'CANCEL' })}
                  className="py-2.5 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition border border-white/10"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {duplicateCase === 'CASE_3' && (
            /* CASE 3: Diff Name + Same SHA -> Skip Upload, Open Existing, Keep Both, Compare */
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onResolve({ action: 'SKIP' })}
                  className="flex-1 btn-gold !h-10 !text-xs shadow-lg flex items-center justify-center gap-1.5 font-bold"
                >
                  <X className="w-4 h-4" /> Skip Upload
                </button>
                <button
                  onClick={() => onResolve({ action: 'KEEP_BOTH' })}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" /> Keep Both
                </button>
              </div>

              <div className="flex items-center gap-2">
                {onViewExisting && (
                  <button
                    onClick={() => { onViewExisting(existingFile); onClose(); }}
                    className="flex-1 py-2.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <Eye className="w-4 h-4 text-cyan-400" /> Open Existing
                  </button>
                )}
                {onOpenCompare && (
                  <button
                    onClick={() => { onOpenCompare(existingFile); onClose(); }}
                    className="flex-1 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 font-bold text-xs transition flex items-center justify-center gap-1.5"
                  >
                    <GitCompare className="w-4 h-4 text-cyan-400" /> Compare
                  </button>
                )}
              </div>
            </div>
          )}

          {duplicateCase === 'CASE_4' && (
            /* CASE 4: Same Name + Same SHA + Diff Folder -> Move Existing, Keep Both, Skip Upload */
            <div className="space-y-2">
              <button
                onClick={() => onResolve({ action: 'MOVE_EXISTING' })}
                className="w-full btn-gold !h-10 !text-xs shadow-lg flex items-center justify-center gap-2 font-bold"
              >
                <FolderInput className="w-4 h-4" /> Move Existing To This Folder
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onResolve({ action: 'KEEP_BOTH' })}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <PlusCircle className="w-4 h-4 text-emerald-400" /> Keep Both
                </button>
                <button
                  onClick={() => onResolve({ action: 'SKIP' })}
                  className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs transition flex items-center justify-center gap-1.5"
                >
                  <X className="w-4 h-4" /> Skip Upload
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── REMEMBER CHOICE CHECKBOX ────────────────────────────────────────── */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-slate-400 text-[11px]">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={rememberChoice}
              onChange={(e) => setRememberChoice(e.target.checked)}
              className="rounded bg-slate-900 border-white/20 text-amber-500 focus:ring-0"
            />
            <span>Remember my choice for future duplicate uploads</span>
          </label>
        </div>

      </div>
    </div>
  );
};
