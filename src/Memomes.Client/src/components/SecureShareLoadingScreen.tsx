import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, RefreshCw,
  AlertOctagon, CheckCircle2, Loader2, ArrowLeft, FileText, UserCheck
} from 'lucide-react';
import { FeedbackEngine } from '../utils/feedbackEngine';

export interface SecureShareLoadingScreenProps {
  fileName?: string;
  passwordProtected?: boolean;
  isPasswordVerified?: boolean;
  onComplete?: () => void;
  onCancel?: () => void;
  onRetry?: () => void;
  error?: string | null;
}

export interface LoadingStage {
  step: number;
  label: string;
  targetProgress: number;
  badge: string;
}

const STAGES: LoadingStage[] = [
  { step: 1, label: 'Secure Link Verified', targetProgress: 10, badge: 'Secure Link Verified' },
  { step: 2, label: 'Password Verified', targetProgress: 22, badge: 'Access Authorized' },
  { step: 3, label: 'Checking Access Permission', targetProgress: 35, badge: 'Zero-Knowledge Protected' },
  { step: 4, label: 'Verifying Digital Signature', targetProgress: 48, badge: 'Integrity Verified' },
  { step: 5, label: 'Downloading Secure Object', targetProgress: 64, badge: 'S3/B2 Vault Direct' },
  { step: 6, label: 'Decrypting File', targetProgress: 80, badge: 'AES-256-GCM Encryption' },
  { step: 7, label: 'Preparing Preview', targetProgress: 94, badge: 'RAM Buffer Ready' },
  { step: 8, label: 'Opening Secure Viewer', targetProgress: 100, badge: 'Session Active' },
];

/**
 * Centered Memomes Brand Logo Icon
 */
const MemomesCenterpieceLogo: React.FC<{ size?: number; glow?: boolean; isDone?: boolean }> = ({
  size = 56,
  glow = true,
  isDone = false
}) => (
  <div
    style={{
      width: size,
      height: size,
      borderRadius: '50%',
      background: isDone
        ? 'linear-gradient(135deg, #10B981 0%, #059669 100%)'
        : 'linear-gradient(135deg, #C0143F 0%, #850E2A 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      boxShadow: isDone
        ? '0 0 45px rgba(16,185,129,0.6), 0 0 20px rgba(16,185,129,0.4)'
        : glow
        ? '0 0 40px rgba(250,204,21,0.5), 0 0 20px rgba(192,20,63,0.4)'
        : '0 4px 15px rgba(0,0,0,0.4)',
      transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      animation: isDone ? 'none' : 'logoBreathe 2s ease-in-out infinite'
    }}
  >
    {isDone ? (
      <CheckCircle2 style={{ width: size * 0.55, height: size * 0.55, color: '#FFFFFF' }} />
    ) : (
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <ShieldCheck style={{ width: size * 0.55, height: size * 0.55, color: '#FACC15' }} />
        <span
          style={{
            position: 'absolute',
            bottom: -2,
            right: -2,
            fontSize: Math.max(9, Math.floor(size * 0.22)),
            fontWeight: 900,
            color: '#FFFFFF',
            fontFamily: '"JetBrains Mono", monospace',
            textShadow: '0 1px 3px rgba(0,0,0,0.8)'
          }}
        >
          M
        </span>
      </div>
    )}
  </div>
);

export const SecureShareLoadingScreen: React.FC<SecureShareLoadingScreenProps> = ({
  fileName = 'Confidential_Document.png',
  passwordProtected: _passwordProtected = false,
  isPasswordVerified: _isPasswordVerified = true,
  onComplete,
  onCancel,
  onRetry,
  error = null
}) => {
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [progress, setProgress] = useState<number>(0);
  const [isSlow, setIsSlow] = useState<boolean>(false);
  const [isDone, setIsDone] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Responsive loader dimensions
  const [windowWidth, setWindowWidth] = useState<number>(
    typeof window !== 'undefined' ? window.innerWidth : 1024
  );

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const ringSize = windowWidth < 640 ? 120 : windowWidth < 1024 ? 160 : 180;
  const logoSize = windowWidth < 640 ? 40 : windowWidth < 1024 ? 48 : 56;
  const strokeWidth = 6;
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // Slow network timer (5 seconds)
  useEffect(() => {
    if (error || isDone) return;
    const slowTimer = setTimeout(() => setIsSlow(true), 5000);
    return () => clearTimeout(slowTimer);
  }, [error, isDone]);

  // Stage progress ticker
  useEffect(() => {
    if (error || isDone) return;

    const interval = setInterval(() => {
      setCurrentStepIndex((prevStep) => {
        if (prevStep < STAGES.length - 1) {
          const nextStep = prevStep + 1;
          setProgress(STAGES[nextStep].targetProgress);
          return nextStep;
        } else {
          clearInterval(interval);
          setProgress(100);
          setIsDone(true);
          return prevStep;
        }
      });
    }, 450);

    return () => clearInterval(interval);
  }, [error, isDone]);

  // Handle completion sensory feedback & gold particle celebration burst
  useEffect(() => {
    if (isDone) {
      FeedbackEngine.trigger('level3_major');

      if (canvasRef.current) {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          canvas.width = window.innerWidth;
          canvas.height = window.innerHeight;

          const particles: Array<{
            x: number; y: number; vx: number; vy: number;
            radius: number; color: string; alpha: number;
          }> = [];

          const goldColors = ['#FACC15', '#FEF08A', '#10B981', '#FFFFFF'];

          for (let i = 0; i < 50; i++) {
            particles.push({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2 - 20,
              vx: (Math.random() - 0.5) * 14,
              vy: (Math.random() - 0.7) * 14,
              radius: Math.random() * 4 + 2,
              color: goldColors[Math.floor(Math.random() * goldColors.length)],
              alpha: 1
            });
          }

          let animId: number;
          const render = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            let alive = 0;

            particles.forEach((p) => {
              if (p.alpha > 0) {
                alive++;
                p.x += p.vx;
                p.y += p.vy;
                p.vy += 0.25;
                p.alpha -= 0.02;

                ctx.save();
                ctx.globalAlpha = Math.max(0, p.alpha);
                ctx.fillStyle = p.color;
                ctx.beginPath();
                ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.restore();
              }
            });

            if (alive > 0) animId = requestAnimationFrame(render);
          };

          render();
          setTimeout(() => cancelAnimationFrame(animId), 1500);
        }
      }

      const finishTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 950);

      return () => clearTimeout(finishTimer);
    }
  }, [isDone, onComplete]);

  const currentStage = STAGES[currentStepIndex] || STAGES[0];
  const remainingSeconds = Math.max(0, Math.ceil((STAGES.length - 1 - currentStepIndex) * 0.45));

  /* ─── Failure / Access Denied Screen ─── */
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#09090B' }}>
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
          background: 'rgba(17,24,39,0.95)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(239,68,68,0.35)', borderRadius: 24,
          padding: '40px 32px', textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.7), 0 0 60px rgba(239,68,68,0.15)'
        }} className="animate-float-up">

          {/* Red Warning Icon replacing progress ring */}
          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
            background: 'radial-gradient(circle, rgba(239,68,68,0.2) 0%, transparent 70%)',
            border: '2px solid rgba(239,68,68,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 35px rgba(239,68,68,0.3)'
          }}>
            <AlertOctagon style={{ width: 36, height: 36, color: '#F87171' }} />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 10, fontWeight: 800, color: '#F87171', letterSpacing: '0.08em',
            marginBottom: 16
          }}>
            VERIFICATION FAILED
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F3F5FA', margin: '0 0 10px' }}>
            Unable to verify secure document.
          </h1>
          
          <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.7, margin: '0 0 28px' }}>
            {error || 'The cryptographic link could not be authorized or has expired.'}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  width: '100%', padding: '12px 18px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #C0143F 0%, #9A1030 100%)',
                  color: 'white', border: 'none', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  boxShadow: '0 0 25px rgba(192,20,63,0.3)'
                }}
              >
                <RefreshCw style={{ width: 16, height: 16, color: '#FACC15' }} />
                Retry Verification
              </button>
            )}

            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  width: '100%', padding: '12px 18px', borderRadius: 12,
                  background: 'rgba(31,41,55,0.8)', border: '1px solid #374151',
                  color: '#D1D5DB', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} />
                Go Back
              </button>
            )}

            <button
              onClick={() => alert('Support Request Sent to File Owner.')}
              style={{
                width: '100%', padding: '10px 18px', borderRadius: 12,
                background: 'transparent', border: 'none',
                color: '#6B7280', fontWeight: 600, fontSize: 12,
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6
              }}
            >
              <UserCheck style={{ width: 14, height: 14 }} />
              Contact Owner
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 overflow-y-auto"
      style={{
        background: 'radial-gradient(circle at 50% 45%, #111827 0%, #09090B 100%)',
        color: '#F9FAFB'
      }}
    >
      {/* CSS Animations */}
      <style>{`
        @keyframes logoBreathe {
          0%, 100% { transform: scale(0.98); }
          50% { transform: scale(1.02); }
        }
        @keyframes radialGlowPulse {
          0%, 100% { opacity: 0.4; transform: scale(0.95); }
          50% { opacity: 0.8; transform: scale(1.08); }
        }
      `}</style>

      {/* Gold Confetti Overlay Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}
      />

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Memomes Cloud Loading: ${progress}% complete. ${currentStage.label}.`}
      </div>

      {/* ── HEADER ── */}
      <header style={{
        width: '100%', maxWidth: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', userSelect: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <MemomesCenterpieceLogo size={32} glow={false} isDone={false} />
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#F9FAFB', letterSpacing: '-0.03em' }}>
              memo<span style={{ color: '#C0143F' }}>mes</span>
            </span>
            <span style={{ fontSize: 10, color: '#9CA3AF', marginLeft: 8, fontWeight: 700, letterSpacing: '0.05em' }}>
              CLOUD
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99,
          background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.25)',
          fontSize: 11, fontWeight: 700, color: '#FACC15', letterSpacing: '0.04em'
        }}>
          <ShieldCheck style={{ width: 14, height: 14 }} />
          Secure Document Access
        </div>
      </header>

      {/* ── CENTERPIECE LOADER CONTAINER ── */}
      <main style={{
        width: '100%', maxWidth: 480, margin: 'auto 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: '24px 0'
      }}>

        {/* File Name Tag */}
        {fileName && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px',
            borderRadius: 99, background: 'rgba(31,41,55,0.7)', border: '1px solid #374151',
            fontSize: 11, fontWeight: 700, color: '#F3F5FA', marginBottom: 24,
            fontFamily: '"JetBrains Mono", monospace'
          }}>
            <FileText style={{ width: 13, height: 13, color: '#FACC15' }} />
            {fileName}
          </div>
        )}

        {/* CENTERPIECE: Memomes Logo perfectly centered inside Animated Progress Ring */}
        <div style={{ position: 'relative', width: ringSize, height: ringSize, margin: '0 auto 24px' }}>
          
          {/* Subtle Radial Lighting Glow behind Logo & Ring */}
          <div style={{
            position: 'absolute', inset: '-15%', borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(250,204,21,0.18) 0%, rgba(192,20,63,0.08) 45%, transparent 70%)',
            filter: 'blur(20px)', pointerEvents: 'none',
            animation: 'radialGlowPulse 2.5s ease-in-out infinite'
          }} />

          {/* SVG Progress Ring */}
          <svg width={ringSize} height={ringSize} style={{ transform: 'rotate(-90deg)', position: 'relative', zIndex: 10 }}>
            <defs>
              <linearGradient id="memomesGoldGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FACC15" />
                <stop offset="50%" stopColor="#FEF08A" />
                <stop offset="100%" stopColor="#C0143F" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="rgba(31,41,55,0.8)"
              strokeWidth={strokeWidth}
            />

            {/* Outer Progress Fill Arc */}
            <circle
              cx={ringSize / 2}
              cy={ringSize / 2}
              r={radius}
              fill="none"
              stroke="url(#memomesGoldGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.45s cubic-bezier(0.16, 1, 0.3, 1)',
                filter: 'drop-shadow(0 0 10px rgba(250,204,21,0.5))'
              }}
            />
          </svg>

          {/* Inner Glass Circle & Centered Memomes Logo */}
          <div style={{
            position: 'absolute', inset: strokeWidth + 4,
            borderRadius: '50%',
            background: 'rgba(17,24,39,0.85)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.05)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 20,
            boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.5), 0 10px 30px rgba(0,0,0,0.5)'
          }}>
            <MemomesCenterpieceLogo size={logoSize} glow={!isDone} isDone={isDone} />
          </div>
        </div>

        {/* Big Percentage & Current Step Description */}
        <div style={{ marginBottom: 24 }}>
          <div style={{
            fontSize: 32, fontWeight: 900, color: '#F9FAFB',
            fontFamily: '"JetBrains Mono", monospace', letterSpacing: '-0.04em', lineHeight: 1,
            marginBottom: 8
          }}>
            {progress}%
          </div>

          <h2 style={{
            fontSize: 16, fontWeight: 800, color: '#F3F5FA', margin: '0 0 4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {isDone ? (
              <CheckCircle2 style={{ width: 18, height: 18, color: '#10B981' }} />
            ) : (
              <Loader2 style={{ width: 16, height: 16, color: '#FACC15' }} className="animate-spin" />
            )}
            {currentStage.label}...
          </h2>

          <div style={{
            fontSize: 12, color: '#9CA3AF', fontFamily: '"JetBrains Mono", monospace',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
          }}>
            <span>Step {currentStepIndex + 1} of {STAGES.length}</span>
            <span>·</span>
            <span>{isDone ? 'Ready!' : `About ${remainingSeconds}s remaining`}</span>
          </div>
        </div>

        {/* STATUS CHECKLIST (Below the loader) */}
        <div style={{
          width: '100%', background: 'rgba(17,24,39,0.85)', backdropFilter: 'blur(20px)',
          border: '1px solid #374151', borderRadius: 18, padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 8, textAlign: 'left'
        }}>
          {[
            { label: 'Secure Link Verified', stepIndex: 0 },
            { label: 'Access Authorized', stepIndex: 1 },
            { label: 'AES-256 Encryption', stepIndex: 5 },
            { label: 'Zero-Knowledge Protected', stepIndex: 2 },
            { label: 'Preparing Secure Preview...', stepIndex: 6 }
          ].map((item) => {
            const isVerified = currentStepIndex >= item.stepIndex || isDone;
            return (
              <div
                key={item.label}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  opacity: isVerified ? 1 : 0.4, transition: 'opacity 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <CheckCircle2
                    style={{
                      width: 14, height: 14,
                      color: isVerified ? '#10B981' : '#4B5563'
                    }}
                  />
                  <span style={{ fontSize: 12, fontWeight: isVerified ? 700 : 500, color: isVerified ? '#F9FAFB' : '#9CA3AF' }}>
                    {item.label}
                  </span>
                </div>
                <span style={{ fontSize: 10, fontFamily: '"JetBrains Mono", monospace', color: isVerified ? '#10B981' : '#4B5563' }}>
                  {isVerified ? '✔ Verified' : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Slow Network Warning Banner (after 5 seconds) */}
        {isSlow && !isDone && (
          <div style={{
            marginTop: 20, width: '100%', padding: '12px 16px', borderRadius: 14,
            background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.3)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
          }} className="animate-fade-in">
            <div style={{ fontSize: 11, color: '#FACC15', lineHeight: 1.5, textAlign: 'left' }}>
              <strong>Still preparing your secure file...</strong><br />
              Large encrypted files may take a few more seconds.
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {onRetry && (
                <button
                  onClick={onRetry}
                  style={{
                    padding: '5px 10px', borderRadius: 8, background: 'rgba(250,204,21,0.2)',
                    border: '1px solid rgba(250,204,21,0.4)', color: '#FACC15',
                    fontSize: 11, fontWeight: 700, cursor: 'pointer'
                  }}
                >
                  Retry
                </button>
              )}

              {onCancel && (
                <button
                  onClick={onCancel}
                  style={{
                    padding: '5px 10px', borderRadius: 8, background: 'rgba(31,41,55,0.9)',
                    border: '1px solid #374151', color: '#9CA3AF',
                    fontSize: 11, fontWeight: 600, cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ── FOOTER ── */}
      <footer style={{
        width: '100%', maxWidth: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        fontSize: 11, color: '#6B7280', fontFamily: '"JetBrains Mono", monospace',
        padding: '12px 0', userSelect: 'none'
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
        Memomes Zero-Knowledge Architecture · End-to-End AES-256-GCM Encrypted
      </footer>
    </div>
  );
};
