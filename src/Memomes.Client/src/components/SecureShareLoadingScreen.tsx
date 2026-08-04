import React, { useState, useEffect, useRef } from 'react';
import {
  ShieldCheck, Lock, RefreshCw,
  ShieldAlert, CheckCircle2, Loader2, ArrowLeft, FileText
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

  // Slow network timer (5 seconds)
  useEffect(() => {
    if (error || isDone) return;
    const slowTimer = setTimeout(() => {
      setIsSlow(true);
    }, 5000);
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
      // Trigger Web Audio & Haptic vibration
      FeedbackEngine.trigger('level3_major');

      // Trigger Canvas Gold Particles
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

          const goldColors = ['#FFD447', '#F5B700', '#F3F5FA', '#34D399'];

          for (let i = 0; i < 45; i++) {
            particles.push({
              x: window.innerWidth / 2,
              y: window.innerHeight / 2 - 40,
              vx: (Math.random() - 0.5) * 12,
              vy: (Math.random() - 0.7) * 12,
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
                p.vy += 0.25; // gravity
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

            if (alive > 0) {
              animId = requestAnimationFrame(render);
            }
          };

          render();

          setTimeout(() => {
            cancelAnimationFrame(animId);
          }, 1500);
        }
      }

      // Transition to viewer after short delay
      const finishTimer = setTimeout(() => {
        if (onComplete) onComplete();
      }, 900);

      return () => clearTimeout(finishTimer);
    }
  }, [isDone, onComplete]);

  const currentStage = STAGES[currentStepIndex] || STAGES[0];
  const remainingSeconds = Math.max(0, Math.ceil((STAGES.length - 1 - currentStepIndex) * 0.45));

  // Circular progress math
  const size = 180;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  /* ─── Failure / Access Denied State ─── */
  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: '#080C14' }}>
        <div style={{
          position: 'relative', zIndex: 1, width: '100%', maxWidth: 440,
          background: 'rgba(11,15,28,0.95)', backdropFilter: 'blur(32px)',
          border: '1px solid rgba(239,68,68,0.3)', borderRadius: 24,
          padding: '40px 32px', textAlign: 'center',
          boxShadow: '0 32px 80px rgba(0,0,0,0.6), 0 0 60px rgba(239,68,68,0.1)'
        }} className="animate-float-up">

          <div style={{
            width: 72, height: 72, borderRadius: '50%', margin: '0 auto 24px',
            background: 'radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)',
            border: '1px solid rgba(239,68,68,0.4)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 30px rgba(239,68,68,0.25)'
          }}>
            <ShieldAlert style={{ width: 34, height: 34, color: '#F87171' }} />
          </div>

          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 99,
            background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)',
            fontSize: 10, fontWeight: 800, color: '#F87171', letterSpacing: '0.08em',
            marginBottom: 16
          }}>
            ACCESS DENIED
          </div>

          <h1 style={{ fontSize: 20, fontWeight: 800, color: '#F3F5FA', margin: '0 0 10px' }}>
            Verification Failed
          </h1>
          
          <p style={{ fontSize: 13, color: '#8892A4', lineHeight: 1.7, margin: '0 0 24px' }}>
            {error}
          </p>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {onRetry && (
              <button
                onClick={onRetry}
                style={{
                  width: '100%', padding: '12px 18px', borderRadius: 12,
                  background: 'linear-gradient(135deg, #C0143F 0%, #9A1030 100%)',
                  color: 'white', border: 'none', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <RefreshCw style={{ width: 16, height: 16, color: '#FFD447' }} />
                Retry Verification
              </button>
            )}

            {onCancel && (
              <button
                onClick={onCancel}
                style={{
                  width: '100%', padding: '12px 18px', borderRadius: 12,
                  background: 'rgba(30,37,53,0.7)', border: '1px solid #1E2535',
                  color: '#8892A4', fontWeight: 600, fontSize: 13,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
                }}
              >
                <ArrowLeft style={{ width: 16, height: 16 }} />
                Go Back
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-between p-6 overflow-y-auto" style={{ background: '#080C14' }}>
      {/* Gold Confetti Overlay Canvas */}
      <canvas
        ref={canvasRef}
        style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 60 }}
      />

      {/* Screen Reader Live Region */}
      <div className="sr-only" aria-live="polite" aria-atomic="true">
        {`Memomes Document Access Loading: ${progress}% complete. ${currentStage.label}.`}
      </div>

      {/* ── HEADER ── */}
      <header style={{
        width: '100%', maxWidth: 900,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '12px 0', userSelect: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 10,
            background: 'linear-gradient(135deg, #C0143F, #850E2A)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 20px rgba(192,20,63,0.4)'
          }}>
            <ShieldCheck style={{ width: 18, height: 18, color: '#FFD447' }} />
          </div>
          <div>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#F3F5FA', letterSpacing: '-0.03em' }}>
              memo<span style={{ color: '#C0143F' }}>mes</span>
            </span>
            <span style={{ fontSize: 10, color: '#8892A4', marginLeft: 8, fontWeight: 700, letterSpacing: '0.05em' }}>
              CLOUD
            </span>
          </div>
        </div>

        <div style={{
          display: 'flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 99,
          background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.25)',
          fontSize: 11, fontWeight: 700, color: '#34D399', letterSpacing: '0.04em'
        }}>
          <ShieldCheck style={{ width: 14, height: 14 }} />
          Secure Document Access
        </div>
      </header>

      {/* ── CENTER LOADING CONTAINER ── */}
      <main style={{
        width: '100%', maxWidth: 480, margin: 'auto 0',
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        padding: '24px 0'
      }}>
        {fileName && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px',
            borderRadius: 99, background: 'rgba(30,37,53,0.7)', border: '1px solid #1E2535',
            fontSize: 11, fontWeight: 700, color: '#F3F5FA', marginBottom: 16,
            fontFamily: '"JetBrains Mono", monospace'
          }}>
            <FileText style={{ width: 13, height: 13, color: '#FFD447' }} />
            {fileName}
          </div>
        )}

        {/* Circular Progress Ring & Logo Center */}
        <div style={{ position: 'relative', width: size, height: size, margin: '0 auto 28px' }}>
          <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
            <defs>
              <linearGradient id="memomesProgressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#C0143F" />
                <stop offset="50%" stopColor="#FFD447" />
                <stop offset="100%" stopColor="#34D399" />
              </linearGradient>
            </defs>

            {/* Background Track */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="rgba(30,37,53,0.8)"
              strokeWidth={strokeWidth}
            />

            {/* Animated Progress Arc */}
            <circle
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke="url(#memomesProgressGradient)"
              strokeWidth={strokeWidth}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              style={{
                transition: 'stroke-dashoffset 0.45s ease-out',
                filter: 'drop-shadow(0 0 12px rgba(255,212,71,0.35))'
              }}
            />
          </svg>

          {/* Center Vault Logo & Percentage Count */}
          <div style={{
            position: 'absolute', inset: 0,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'
          }}>
            <div style={{
              width: 52, height: 52, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(192,20,63,0.18) 0%, transparent 70%)',
              border: '1px solid rgba(192,20,63,0.4)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              marginBottom: 4,
              boxShadow: '0 0 24px rgba(192,20,63,0.3)'
            }} className="animate-pulse-glow">
              <Lock style={{ width: 22, height: 22, color: '#FFD447' }} />
            </div>

            <div style={{
              fontSize: 28, fontWeight: 900, color: '#F3F5FA',
              fontFamily: '"JetBrains Mono", monospace', letterSpacing: '-0.03em', lineHeight: 1
            }}>
              {progress}%
            </div>
          </div>
        </div>

        {/* Current Step Label & Time Estimate */}
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <h2 style={{
            fontSize: 18, fontWeight: 800, color: '#F3F5FA', margin: '0 0 6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8
          }}>
            {isDone ? (
              <CheckCircle2 style={{ width: 20, height: 20, color: '#34D399' }} />
            ) : (
              <Loader2 style={{ width: 18, height: 18, color: '#FFD447' }} className="animate-spin" />
            )}
            {currentStage.label}...
          </h2>

          <div style={{
            fontSize: 12, color: '#8892A4', fontFamily: '"JetBrains Mono", monospace',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12
          }}>
            <span>Step {currentStepIndex + 1} of {STAGES.length}</span>
            <span>·</span>
            <span>{isDone ? 'Ready!' : `About ${remainingSeconds}s remaining`}</span>
          </div>
        </div>

        {/* Live Security Badges Bar */}
        <div style={{
          display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'center', gap: 8,
          marginBottom: 28
        }}>
          {STAGES.slice(0, currentStepIndex + 1).map((s) => (
            <div
              key={s.step}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px',
                borderRadius: 99, background: 'rgba(13,17,32,0.8)', border: '1px solid #1E2535',
                fontSize: 10, fontWeight: 700, color: '#34D399', fontFamily: '"JetBrains Mono", monospace'
              }}
            >
              <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#34D399', boxShadow: '0 0 6px #34D399' }} />
              {s.badge}
            </div>
          ))}
        </div>

        {/* ── 8-STEPPERS VERIFICATION LIST ── */}
        <div style={{
          width: '100%', background: 'rgba(11,15,28,0.85)', backdropFilter: 'blur(20px)',
          border: '1px solid #1E2535', borderRadius: 18, padding: '16px 20px',
          display: 'flex', flexDirection: 'column', gap: 10
        }}>
          {STAGES.map((s, idx) => {
            const isCompleted = idx < currentStepIndex || isDone;
            const isCurrent = idx === currentStepIndex && !isDone;

            return (
              <div
                key={s.step}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  opacity: isCompleted || isCurrent ? 1 : 0.35,
                  transition: 'opacity 0.25s ease'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: isCompleted ? 'rgba(16,185,129,0.15)' : isCurrent ? 'rgba(255,212,71,0.15)' : 'rgba(30,37,53,0.5)',
                    border: `1px solid ${isCompleted ? '#10B981' : isCurrent ? '#FFD447' : '#1E2535'}`
                  }}>
                    {isCompleted ? (
                      <CheckCircle2 style={{ width: 12, height: 12, color: '#34D399' }} />
                    ) : isCurrent ? (
                      <Loader2 style={{ width: 11, height: 11, color: '#FFD447' }} className="animate-spin" />
                    ) : (
                      <span style={{ fontSize: 9, color: '#4B5670', fontWeight: 700 }}>{s.step}</span>
                    )}
                  </div>

                  <span style={{
                    fontSize: 12, fontWeight: isCurrent ? 700 : 500,
                    color: isCompleted ? '#F3F5FA' : isCurrent ? '#FFD447' : '#8892A4'
                  }}>
                    {s.label}
                  </span>
                </div>

                <span style={{
                  fontSize: 10, fontFamily: '"JetBrains Mono", monospace',
                  color: isCompleted ? '#34D399' : isCurrent ? '#FFD447' : '#4B5670'
                }}>
                  {isCompleted ? '✓' : isCurrent ? `${progress}%` : 'Pending'}
                </span>
              </div>
            );
          })}
        </div>

        {/* Slow Network Warning Banner (after 5 seconds) */}
        {isSlow && !isDone && (
          <div style={{
            marginTop: 20, width: '100%', padding: '12px 16px', borderRadius: 14,
            background: 'rgba(255,212,71,0.06)', border: '1px solid rgba(255,212,71,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12
          }} className="animate-fade-in">
            <div style={{ fontSize: 11, color: '#FFD447', lineHeight: 1.5 }}>
              <strong>Still preparing your secure file...</strong><br />
              Large encrypted files may take a few more seconds.
            </div>

            <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
              {onRetry && (
                <button
                  onClick={onRetry}
                  style={{
                    padding: '5px 10px', borderRadius: 8, background: 'rgba(255,212,71,0.15)',
                    border: '1px solid rgba(255,212,71,0.3)', color: '#FFD447',
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
                    padding: '5px 10px', borderRadius: 8, background: 'rgba(30,37,53,0.8)',
                    border: '1px solid #1E2535', color: '#8892A4',
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
        fontSize: 11, color: '#4B5670', fontFamily: '"JetBrains Mono", monospace',
        padding: '12px 0', userSelect: 'none'
      }}>
        <span style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: '#10B981' }} />
        Memomes Zero-Knowledge Architecture · End-to-End AES-256-GCM Encrypted
      </footer>
    </div>
  );
};
