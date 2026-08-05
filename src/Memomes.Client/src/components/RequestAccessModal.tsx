import React, { useState } from 'react';
import {
  Lock, X, CheckCircle2, ShieldAlert, Send, Building, User, Mail, FileText
} from 'lucide-react';
import { SecurityCenterStore } from '../utils/securityCenterStore';

interface RequestAccessModalProps {
  isOpen: boolean;
  shareCode: string;
  fileName: string;
  onClose: () => void;
  onRequestSubmitted?: () => void;
}

export const RequestAccessModal: React.FC<RequestAccessModalProps> = ({
  isOpen,
  shareCode,
  fileName,
  onClose,
  onRequestSubmitted
}) => {
  const [step, setStep] = useState<'RESTRICTED' | 'FORM' | 'SUBMITTED'>('RESTRICTED');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [reason, setReason] = useState('');
  const [message, setMessage] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !reason.trim()) {
      setErrorMsg('Please fill in your Name, Email, and Reason for access.');
      return;
    }

    SecurityCenterStore.submitAccessRequest(
      shareCode,
      fileName,
      name.trim(),
      email.trim(),
      reason.trim(),
      company.trim() || undefined,
      message.trim() || undefined
    );

    setStep('SUBMITTED');
    if (onRequestSubmitted) onRequestSubmitted();
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      <div className="glass-card max-w-md w-full p-6 rounded-3xl border border-cyan-500/30 shadow-[0_0_60px_rgba(6,182,212,0.15)] space-y-5 text-sans text-xs">
        
        {/* ── HEADER ───────────────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-inner">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                Access Restricted
              </h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-[200px]" title={fileName}>
                {fileName}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Close access modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── STEP 1: INITIAL RESTRICTED CARD ──────────────────────────────────── */}
        {step === 'RESTRICTED' && (
          <div className="space-y-4 text-center py-2">
            <div className="p-4 rounded-2xl bg-[#070B14] border border-white/10 space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-400 mx-auto" />
              <div className="text-sm font-bold text-white">Permission Required</div>
              <p className="text-xs text-slate-400 leading-relaxed">
                You do not currently have permission to access this secure file. Submit an access request to the file owner for authorization.
              </p>
            </div>

            <button
              onClick={() => setStep('FORM')}
              className="w-full btn-gold !h-10 !text-xs shadow-lg flex items-center justify-center gap-2 font-bold"
            >
              <Send className="w-4 h-4" /> Request Access
            </button>
          </div>
        )}

        {/* ── STEP 2: REQUEST ACCESS FORM ──────────────────────────────────────── */}
        {step === 'FORM' && (
          <form onSubmit={handleSubmit} className="space-y-3">
            {errorMsg && (
              <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-[11px] font-mono">
                {errorMsg}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Your Name *</label>
              <div className="relative flex items-center">
                <User className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Smith"
                  className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#070B14] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Your Email Address *</label>
              <div className="relative flex items-center">
                <Mail className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@email.com"
                  className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#070B14] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Company (Optional)</label>
              <div className="relative flex items-center">
                <Building className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Acme Corp"
                  className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#070B14] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Reason For Access *</label>
              <div className="relative flex items-center">
                <FileText className="w-3.5 h-3.5 text-slate-500 absolute left-3" />
                <input
                  type="text"
                  required
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Need to review the latest contract report."
                  className="w-full h-9 pl-8 pr-3 rounded-xl bg-[#070B14] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono"
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-mono font-bold text-slate-400 uppercase">Optional Message</label>
              <textarea
                rows={2}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Additional notes for the owner..."
                className="w-full p-2.5 rounded-xl bg-[#070B14] border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 font-mono resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setStep('RESTRICTED')}
                className="flex-1 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition border border-white/10"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 btn-gold !h-9 !text-xs shadow-lg flex items-center justify-center gap-1.5 font-bold"
              >
                <Send className="w-3.5 h-3.5" /> Submit Request
              </button>
            </div>
          </form>
        )}

        {/* ── STEP 3: SUBMITTED CONFIRMATION ───────────────────────────────────── */}
        {step === 'SUBMITTED' && (
          <div className="space-y-4 text-center py-4">
            <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mx-auto">
              <CheckCircle2 className="w-6 h-6 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h4 className="text-sm font-bold text-white">Access Request Submitted!</h4>
              <p className="text-xs text-slate-400 leading-relaxed max-w-xs mx-auto">
                Your request has been dispatched to the file owner. You will receive an alert once your access is approved.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs transition"
            >
              Close
            </button>
          </div>
        )}

      </div>
    </div>
  );
};
