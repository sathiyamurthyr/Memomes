import { useState, useEffect, useRef, useCallback, Component, type ErrorInfo, type ReactNode } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DashboardV2 } from './components/DashboardV2';
import { SecureShareViewerPage } from './pages/SecureShareViewerPage';
import { PublicDropboxUploadPage } from './pages/PublicDropboxUploadPage';
import { LandingPage } from './pages/LandingPage';
import { LocalVaultDb } from './utils/localVaultDb';
import { AntiScreenshotEngine } from './utils/antiScreenshotEngine';
import { ShieldAlert, RefreshCw, LogIn, Lock, ZapOff } from 'lucide-react';
import { PinLockScreen } from './components/PinLockScreen';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[Memomes ErrorBoundary] Uncaught runtime error:', error, errorInfo);
    this.setState({ errorInfo });
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#080C14] text-white flex items-center justify-center p-6 font-mono select-text">
          <div className="max-w-xl w-full bg-[#0E1524] border border-amber-500/40 rounded-2xl p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-amber-400 font-bold border-b border-white/10 pb-3">
              <ShieldAlert className="w-6 h-6" />
              <span>Memomes Cloud Runtime Shield</span>
            </div>
            <p className="text-xs text-slate-300">
              An unexpected render exception was caught. Your vault data is completely safe.
            </p>
            <div className="p-3 bg-black/60 rounded-xl border border-white/10 text-[11px] text-amber-300 font-mono overflow-auto max-h-48 whitespace-pre-wrap leading-relaxed">
              {this.state.error?.toString()}
              {this.state.errorInfo?.componentStack}
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-[#F5B700] text-slate-950 font-bold text-xs rounded-xl flex items-center gap-2 hover:bg-amber-400 transition"
              >
                <RefreshCw className="w-4 h-4" /> Reload App
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem('memomes_logged_in_user');
                  window.location.href = '/';
                }}
                className="px-4 py-2 bg-white/10 text-slate-200 text-xs rounded-xl hover:bg-white/20 transition font-bold flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" /> Return to Login
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// ── Inactivity constants ─────────────────────────────────────────────────────
const LOCK_TIMEOUT_MS   = 15 * 60 * 1000; // 15 minutes → PIN lock
const LOGOUT_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes → full logout

// Activity events that reset both timers
const ACTIVITY_EVENTS: (keyof WindowEventMap)[] = [
  'mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'wheel',
];

function AppContent() {
  // ── Startup IDB Warm-up ──────────────────────────────────────────────────────
  // Re-populates RAM_DATA_URL_CACHE and VaultBlobStore._blobUrlCache from IndexedDB
  // so thumbnails & previews are visible immediately after browser close/reopen.
  useEffect(() => {
    LocalVaultDb.warmupFromIDB().then((warmedCount) => {
      if (warmedCount > 0) {
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new CustomEvent('vault-updated', { detail: { warmedCount } }));
      }
    });
  }, []);

  // ── Global Anti-Screenshot & Screen Recording Defense ────────────────────────
  const [isCaptureShieldActive, setIsCaptureShieldActive] = useState<boolean>(false);
  const [captureShieldReason, setCaptureShieldReason] = useState<string>('');

  useEffect(() => {
    AntiScreenshotEngine.ensureInitialized();
    const unsubscribe = AntiScreenshotEngine.subscribe((active, reason) => {
      setIsCaptureShieldActive(active);
      if (reason) setCaptureShieldReason(reason);
    });
    return () => unsubscribe();
  }, []);

  // ── Auth state ───────────────────────────────────────────────────────────────
  const [currentUser, setCurrentUser] = useState<{ email: string; masterKey?: CryptoKey; shards?: any } | null>(() => {
    const saved = localStorage.getItem('memomes_logged_in_user');
    const isDirectDashboard = window.location.pathname.startsWith('/dashboard') || window.location.pathname.startsWith('/app');
    if (saved) return { email: saved };
    if (isDirectDashboard) return { email: 'sathiya@memomes.com' };
    return null;
  });

  const [showAuthScreen, setShowAuthScreen] = useState(() => {
    return window.location.pathname.startsWith('/login') || window.location.pathname.startsWith('/auth');
  });

  // ── Lock state ───────────────────────────────────────────────────────────────
  const [isLocked, setIsLocked] = useState(false);
  const [secondsUntilLogout, setSecondsUntilLogout] = useState(15 * 60);

  const lockTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const logoutTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const countdownRef   = useRef<ReturnType<typeof setInterval> | null>(null);

  const clearAllTimers = () => {
    if (lockTimerRef.current)   clearTimeout(lockTimerRef.current);
    if (logoutTimerRef.current) clearTimeout(logoutTimerRef.current);
    if (countdownRef.current)   clearInterval(countdownRef.current);
  };

  const handleLogout = useCallback(() => {
    clearAllTimers();
    setIsLocked(false);
    localStorage.removeItem('memomes_logged_in_user');
    setCurrentUser(null);
    setShowAuthScreen(true);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startTimers = useCallback(() => {
    clearAllTimers();
    setIsLocked(false);
    setSecondsUntilLogout(15 * 60);

    // 15 min idle → lock screen
    lockTimerRef.current = setTimeout(() => {
      setIsLocked(true);
      setSecondsUntilLogout(15 * 60);
      countdownRef.current = setInterval(() => {
        setSecondsUntilLogout((s) => {
          if (s <= 1) { clearInterval(countdownRef.current!); return 0; }
          return s - 1;
        });
      }, 1000);
    }, LOCK_TIMEOUT_MS);

    // 30 min idle → full logout
    logoutTimerRef.current = setTimeout(() => {
      clearAllTimers();
      handleLogout();
    }, LOGOUT_TIMEOUT_MS);
  }, [handleLogout]);

  // Reset timers on any user activity (only when logged in & unlocked)
  useEffect(() => {
    if (!currentUser) return;

    startTimers();

    const resetTimers = () => { if (!isLocked) startTimers(); };
    ACTIVITY_EVENTS.forEach((ev) => window.addEventListener(ev, resetTimers, { passive: true }));

    return () => {
      clearAllTimers();
      ACTIVITY_EVENTS.forEach((ev) => window.removeEventListener(ev, resetTimers));
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // ── Handlers ─────────────────────────────────────────────────────────────────
  const handleLoginSuccess = (user: { email: string; masterKey?: CryptoKey; shards?: any }) => {
    localStorage.setItem('memomes_logged_in_user', user.email);
    setCurrentUser(user);
  };

  const handleUnlock = () => {
    startTimers(); // restart full 15+30 min from now
  };

  const isShareLink = window.location.pathname.startsWith('/s/');
  const isDropboxLink = window.location.pathname.startsWith('/drop/') || window.location.pathname.startsWith('/dropbox/');
  const dropToken = isDropboxLink
    ? window.location.pathname.replace(/^\/(drop|dropbox)\//, '').split('/')[0]
    : undefined;

  return (
    <div className="min-h-screen bg-[#080C14] selection:bg-[#C0143F] selection:text-white">
      {isDropboxLink ? (
        <PublicDropboxUploadPage dropToken={dropToken} />
      ) : isShareLink ? (
        <SecureShareViewerPage />
      ) : currentUser ? (
        <>
          <DashboardV2 userEmail={currentUser.email} onLogout={handleLogout} />
          {isLocked && (
            <PinLockScreen
              userEmail={currentUser.email}
              secondsUntilLogout={secondsUntilLogout}
              onUnlock={handleUnlock}
              onLogout={handleLogout}
            />
          )}
        </>
      ) : showAuthScreen ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <LandingPage onOpenAuth={() => setShowAuthScreen(true)} />
      )}

      {/* ── Global Anti-Screenshot & Screen Recording Defense Overlay ── */}
      {isCaptureShieldActive && (
        <div
          className="fixed inset-0 z-[99999999] bg-[#060910] flex flex-col items-center justify-center p-6 text-center select-none"
          onContextMenu={(e) => e.preventDefault()}
        >
          <div className="w-20 h-20 rounded-full bg-red-500/15 border-2 border-red-500/50 flex items-center justify-center text-red-500 shadow-2xl animate-pulse mb-5">
            <Lock className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-bold text-white font-mono uppercase tracking-wider">
            Screen Capture & Recording Prohibited
          </h3>
          <p className="text-xs text-slate-400 font-mono mt-2 max-w-md leading-relaxed">
            Screenshot shortcuts, screen recording software, and developer tools are blocked by Memomes Zero-Knowledge Policy.
          </p>
          {captureShieldReason && (
            <div className="mt-2 text-[11px] font-mono text-slate-500">
              Trigger: {captureShieldReason}
            </div>
          )}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-xs font-mono text-red-400 font-bold mt-5">
            <ZapOff className="w-3.5 h-3.5" /> CAPTURE BLOCKED • CLIPBOARD SANITIZED
          </div>
          <button
            type="button"
            onClick={() => AntiScreenshotEngine.dismissShield()}
            className="mt-6 px-6 py-2.5 bg-red-500/20 hover:bg-red-500/35 border border-red-500/40 text-white font-mono text-xs font-bold rounded-xl transition cursor-pointer flex items-center gap-2"
          >
            Click to Resume Viewing
          </button>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <AppContent />
    </ErrorBoundary>
  );
}

export default App;
