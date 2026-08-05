import React from 'react';
import {
  Layers, X, ArrowRight, RefreshCw, PlusCircle, FileText
} from 'lucide-react';
import type { DuplicateCheckResult } from '../utils/duplicateDetector';

export interface BulkDuplicateSummary {
  totalFiles: number;
  duplicateCount: number;
  duplicatesList: {
    file: File;
    checkResult: DuplicateCheckResult;
  }[];
}

interface BulkDuplicateModalProps {
  isOpen: boolean;
  summary: BulkDuplicateSummary | null;
  onApplyBatchAction: (action: 'SKIP_ALL' | 'REPLACE_ALL' | 'VERSION_ALL' | 'KEEP_ALL' | 'INDIVIDUAL') => void;
  onClose: () => void;
}

export const BulkDuplicateModal: React.FC<BulkDuplicateModalProps> = ({
  isOpen,
  summary,
  onApplyBatchAction,
  onClose
}) => {
  if (!isOpen || !summary || summary.duplicateCount === 0) return null;

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="glass-card max-w-xl w-full p-6 rounded-3xl border border-amber-500/30 shadow-[0_0_60px_rgba(245,183,0,0.15)] space-y-5 text-sans text-xs">
        
        {/* ── HEADER ───────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-[#F5B700] shadow-inner">
              <Layers className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                Batch Duplicate Processing
              </h3>
              <p className="text-xs text-amber-400 font-mono mt-0.5">
                {summary.totalFiles} Files Selected — <span className="font-bold text-white">{summary.duplicateCount} Duplicates Detected</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Close bulk duplicate dialog"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── DUPLICATE LIST SUMMARY ───────────────────────────────────────────── */}
        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {summary.duplicatesList.map((item, idx) => (
            <div
              key={idx}
              className="p-3 rounded-2xl bg-[#070B14] border border-white/10 flex items-center justify-between gap-3 text-xs"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <FileText className="w-4 h-4 text-amber-400 shrink-0" />
                <div className="truncate">
                  <div className="text-white font-bold truncate" title={item.file.name}>{item.file.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    Case: <span className="text-amber-400">{item.checkResult.duplicateCase}</span> · {item.checkResult.description}
                  </div>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 shrink-0">
                100% Match
              </span>
            </div>
          ))}
        </div>

        {/* ── BATCH ACTION BUTTONS ─────────────────────────────────────────────── */}
        <div className="space-y-2 pt-2 border-t border-white/10">
          <div className="text-[10px] text-slate-400 font-mono uppercase tracking-wider mb-1">
            Apply Action To All {summary.duplicateCount} Duplicates:
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => onApplyBatchAction('SKIP_ALL')}
              className="btn-gold !h-10 !text-xs shadow-lg flex items-center justify-center gap-1.5 font-bold"
            >
              <X className="w-4 h-4" /> Skip All Duplicates
            </button>

            <button
              onClick={() => onApplyBatchAction('VERSION_ALL')}
              className="py-2.5 px-3 rounded-xl bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <ArrowRight className="w-4 h-4" /> Create Version For All
            </button>

            <button
              onClick={() => onApplyBatchAction('REPLACE_ALL')}
              className="py-2.5 px-3 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <RefreshCw className="w-4 h-4" /> Replace All Existing
            </button>

            <button
              onClick={() => onApplyBatchAction('KEEP_ALL')}
              className="py-2.5 px-3 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
            >
              <PlusCircle className="w-4 h-4 text-emerald-400" /> Keep All
            </button>
          </div>

          <button
            onClick={() => onApplyBatchAction('INDIVIDUAL')}
            className="w-full py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10 font-bold text-xs transition mt-1"
          >
            Review Each Duplicate Individually
          </button>
        </div>

      </div>
    </div>
  );
};
