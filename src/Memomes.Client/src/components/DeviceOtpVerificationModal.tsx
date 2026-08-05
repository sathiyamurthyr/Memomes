import React, { useState } from 'react';
import { ShieldCheck, Lock, ArrowRight, X, AlertOctagon, Mail } from 'lucide-react';

interface DeviceOtpVerificationModalProps {
  userEmail: string;
  deviceName: string;
  ipLocation: string;
  ipAddress: string;
  onVerifySuccess: () => void;
  onCancel: () => void;
  onResendOtp?: () => void;
}

export const DeviceOtpVerificationModal: React.FC<DeviceOtpVerificationModalProps> = ({
  userEmail,
  deviceName,
  ipLocation,
  ipAddress,
  onVerifySuccess,
  onCancel,
  onResendOtp
}) => {
  const [otpValue, setOtpValue] = useState('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [resendSent, setResendSent] = useState(false);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (otpValue.trim().length < 6) {
      setErrorMsg('Please enter a valid 6-digit security code');
      return;
    }

    setIsVerifying(true);
    setErrorMsg(null);

    setTimeout(() => {
      setIsVerifying(false);
      onVerifySuccess();
    }, 600);
  };

  const handleResend = () => {
    setResendSent(true);
    if (onResendOtp) onResendOtp();
    setTimeout(() => setResendSent(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md font-sans text-xs select-none animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-[#0B1120] border border-white/10 rounded-3xl p-6 space-y-5 shadow-[0_0_50px_rgba(245,183,0,0.15)] text-left">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-[#F5B700]/15 border border-[#F5B700]/30 flex items-center justify-center text-[#F5B700] shadow-[0_0_20px_rgba(245,183,0,0.2)]">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white font-mono">Untrusted Device Verification</h3>
              <p className="text-[11px] text-slate-400 font-mono">OTP Verification Required</p>
            </div>
          </div>
          <button onClick={onCancel} className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Untrusted Device Warning Badge */}
        <div className="p-3.5 rounded-2xl bg-[#050816] border border-white/10 space-y-1.5 font-mono text-[11px]">
          <div className="text-amber-400 font-bold flex items-center gap-1.5">
            <AlertOctagon className="w-4 h-4 text-amber-400 shrink-0" /> New Device Detected: {deviceName}
          </div>
          <div className="text-slate-300">
            Location: <span className="text-white font-bold">{ipLocation}</span> • IP: <span className="text-cyan-400 font-bold">{ipAddress}</span>
          </div>
        </div>

        <p className="text-slate-300 leading-relaxed text-xs">
          A 6-digit security code was sent to <strong className="text-white font-mono">{userEmail}</strong>. Enter it below to register this device in your trusted registry.
        </p>

        {/* OTP Input Form */}
        <form onSubmit={handleVerify} className="space-y-4 font-mono">
          <div>
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              6-Digit Security Code (OTP)
            </label>
            <div className="relative">
              <input
                type="text"
                maxLength={6}
                value={otpValue}
                onChange={e => setOtpValue(e.target.value.replace(/\D/g, ''))}
                placeholder="123456"
                className="w-full h-12 px-4 rounded-2xl bg-[#050816] border border-white/10 text-white font-mono text-center text-lg tracking-[0.4em] font-bold focus:border-[#F5B700] focus:outline-none"
                autoFocus
              />
              <Lock className="w-5 h-5 text-slate-500 absolute right-4 top-3.5 pointer-events-none" />
            </div>
            {errorMsg && <p className="text-rose-400 text-[11px] mt-1.5 font-sans font-medium">{errorMsg}</p>}
          </div>

          <div className="flex items-center justify-between text-[11px]">
            <span className="text-slate-400">Didn't receive the code?</span>
            <button
              type="button"
              onClick={handleResend}
              className="text-[#F5B700] hover:underline font-bold flex items-center gap-1"
            >
              <Mail className="w-3.5 h-3.5" /> {resendSent ? 'Code Resent!' : 'Resend Code'}
            </button>
          </div>

          <button
            type="submit"
            disabled={isVerifying || otpValue.length < 6}
            className="w-full h-11 rounded-2xl bg-[#F5B700] hover:bg-amber-300 text-slate-950 font-bold font-sans text-xs transition flex items-center justify-center gap-2 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isVerifying ? (
              <span>Verifying OTP Code...</span>
            ) : (
              <>
                <span>Authorize & Register Device</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

      </div>
    </div>
  );
};
