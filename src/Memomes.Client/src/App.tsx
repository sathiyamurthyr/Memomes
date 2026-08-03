import { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DashboardV2 } from './components/DashboardV2';
import { SecureShareViewerPage } from './pages/SecureShareViewerPage';
import { LandingPage } from './pages/LandingPage';

function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; masterKey?: CryptoKey; shards?: any } | null>(null);
  const [showAuthScreen, setShowAuthScreen] = useState(false);

  const handleLoginSuccess = (user: { email: string; masterKey: CryptoKey; shards: any }) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
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

export default App;
