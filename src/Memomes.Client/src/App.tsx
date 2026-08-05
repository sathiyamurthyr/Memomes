import React, { useState, useEffect, Component, ErrorInfo, ReactNode } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DashboardV2 } from './components/DashboardV2';
import { SecureShareViewerPage } from './pages/SecureShareViewerPage';
import { LandingPage } from './pages/LandingPage';
import { ShieldAlert, RefreshCw, LogIn } from 'lucide-react';

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

function AppContent() {
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

  const handleLoginSuccess = (user: { email: string; masterKey?: CryptoKey; shards?: any }) => {
    localStorage.setItem('memomes_logged_in_user', user.email);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem('memomes_logged_in_user');
    setCurrentUser(null);
    setShowAuthScreen(true);
  };

  const isShareLink = window.location.pathname.startsWith('/s/');

  return (
    <div className="min-h-screen bg-[#080C14] selection:bg-[#C0143F] selection:text-white">
      {isShareLink ? (
        <SecureShareViewerPage />
      ) : currentUser ? (
        <DashboardV2 userEmail={currentUser.email} onLogout={handleLogout} />
      ) : showAuthScreen ? (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      ) : (
        <LandingPage onOpenAuth={() => setShowAuthScreen(true)} />
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
