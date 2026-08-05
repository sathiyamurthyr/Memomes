import React, { useState } from 'react';
import {
  ShieldCheck, X, CheckCircle2, User, Clock,
  Eye, Sparkles, Ban, Check
} from 'lucide-react';
import { SecurityCenterStore, type AccessRequestRecord } from '../utils/securityCenterStore';

interface AccessApprovalModalProps {
  isOpen: boolean;
  request: AccessRequestRecord | null;
  onClose: () => void;
  onResolved?: () => void;
}

export const AccessApprovalModal: React.FC<AccessApprovalModalProps> = ({
  isOpen,
  request,
  onClose,
  onResolved
}) => {
  const [approvalType, setApprovalType] = useState<'PERMANENT' | 'TEMPORARY' | 'VIEW_ONLY' | 'ONE_TIME'>('VIEW_ONLY');
  const [expiresAt, setExpiresAt] = useState('2026-08-11T23:59');
  const [watermarkText] = useState('CONFIDENTIAL - JOHN SMITH');
  const [maxViews, setMaxViews] = useState(5);
  const [maxDownloads, setMaxDownloads] = useState(1);

  if (!isOpen || !request) return null;

  const handleApprove = () => {
    SecurityCenterStore.resolveAccessRequest(request.id, 'APPROVED', {
      approvalType,
      expiresAt: approvalType === 'TEMPORARY' ? expiresAt : undefined,
      watermarkText: watermarkText.trim() || undefined,
      maxViews,
      maxDownloads
    });

    if (onResolved) onResolved();
    onClose();
  };

  const handleReject = () => {
    SecurityCenterStore.resolveAccessRequest(request.id, 'REJECTED');
    if (onResolved) onResolved();
    onClose();
  };

  const formattedDate = (rawDate?: string) => {
    if (!rawDate) return 'Just now';
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
      <div className="glass-card max-w-lg w-full p-6 rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.15)] space-y-5 text-sans text-xs">
        
        {/* ── HEADER ───────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <ShieldCheck className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
                Access Request Approval
              </h3>
              <p className="text-xs text-slate-400 mt-0.5 font-mono">
                Requested {formattedDate(request.requestedAt)}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Close approval modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── REQUEST DETAILS CARD ─────────────────────────────────────────────── */}
        <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 space-y-2.5">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <div className="flex items-center gap-2 text-white font-bold">
              <User className="w-4 h-4 text-cyan-400" />
              <span>{request.requesterName}</span>
            </div>
            <span className="text-[10px] text-cyan-400 font-mono bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
              {request.requesterEmail}
            </span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Target Asset:</span>
              <span className="text-white font-bold truncate max-w-[200px]" title={request.fileName}>{request.fileName}</span>
            </div>

            {request.requesterCompany && (
              <div className="flex justify-between items-center">
                <span className="text-slate-400">Company:</span>
                <span className="text-slate-300 font-mono">{request.requesterCompany}</span>
              </div>
            )}

            <div className="space-y-1 pt-1 border-t border-white/5">
              <span className="text-slate-400 font-mono text-[10px] uppercase">Reason Provided:</span>
              <div className="p-2.5 rounded-xl bg-slate-900/80 border border-white/5 text-slate-200 font-mono italic text-[11px]">
                "{request.reason}"
              </div>
            </div>
          </div>
        </div>

        {/* ── APPROVAL PERMISSION CONFIGURATION ───────────────────────────────── */}
        <div className="space-y-3 pt-1">
          <div className="text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider">
            Define Approval Access Level:
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setApprovalType('VIEW_ONLY')}
              className={`p-2.5 rounded-xl border transition text-left flex items-center justify-between ${
                approvalType === 'VIEW_ONLY'
                  ? 'bg-cyan-500/20 border-cyan-500/50 text-white font-bold'
                  : 'bg-[#070B14] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-cyan-400" />
                <span>View Only</span>
              </div>
              {approvalType === 'VIEW_ONLY' && <Check className="w-3.5 h-3.5 text-cyan-400" />}
            </button>

            <button
              type="button"
              onClick={() => setApprovalType('TEMPORARY')}
              className={`p-2.5 rounded-xl border transition text-left flex items-center justify-between ${
                approvalType === 'TEMPORARY'
                  ? 'bg-amber-500/20 border-amber-500/50 text-white font-bold'
                  : 'bg-[#070B14] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <span>Until Expiry</span>
              </div>
              {approvalType === 'TEMPORARY' && <Check className="w-3.5 h-3.5 text-amber-400" />}
            </button>

            <button
              type="button"
              onClick={() => setApprovalType('ONE_TIME')}
              className={`p-2.5 rounded-xl border transition text-left flex items-center justify-between ${
                approvalType === 'ONE_TIME'
                  ? 'bg-purple-500/20 border-purple-500/50 text-white font-bold'
                  : 'bg-[#070B14] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>One-Time Access</span>
              </div>
              {approvalType === 'ONE_TIME' && <Check className="w-3.5 h-3.5 text-purple-400" />}
            </button>

            <button
              type="button"
              onClick={() => setApprovalType('PERMANENT')}
              className={`p-2.5 rounded-xl border transition text-left flex items-center justify-between ${
                approvalType === 'PERMANENT'
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-white font-bold'
                  : 'bg-[#070B14] border-white/10 text-slate-400 hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Full Download</span>
              </div>
              {approvalType === 'PERMANENT' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
            </button>
          </div>

          {/* ADVANCED GOVERNANCE CONTROLS */}
          <div className="p-3 rounded-2xl bg-[#070B14] border border-white/10 space-y-2 text-[11px]">
            {approvalType === 'TEMPORARY' && (
              <div className="space-y-1">
                <label className="text-slate-400 font-mono">Expiration Timestamp:</label>
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                  className="w-full h-8 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-amber-400 font-mono"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <label className="text-slate-400 font-mono">Max Views:</label>
                <input
                  type="number"
                  min={1}
                  value={maxViews}
                  onChange={(e) => setMaxViews(parseInt(e.target.value, 10) || 1)}
                  className="w-full h-8 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-400 font-mono">Max Downloads:</label>
                <input
                  type="number"
                  min={0}
                  value={maxDownloads}
                  onChange={(e) => setMaxDownloads(parseInt(e.target.value, 10) || 0)}
                  className="w-full h-8 px-2.5 rounded-xl bg-slate-900 border border-white/10 text-white focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>
          </div>
        </div>

        {/* ── ACTION BUTTONS ───────────────────────────────────────────────────── */}
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <button
            onClick={handleReject}
            className="flex-1 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 font-bold text-xs transition flex items-center justify-center gap-1.5"
          >
            <Ban className="w-4 h-4" /> Decline
          </button>

          <button
            onClick={handleApprove}
            className="flex-1 btn-gold !h-10 !text-xs shadow-lg flex items-center justify-center gap-1.5 font-bold"
          >
            <CheckCircle2 className="w-4 h-4" /> Approve Access
          </button>
        </div>

      </div>
    </div>
  );
};
