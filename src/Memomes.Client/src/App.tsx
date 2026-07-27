import { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DashboardV2 } from './components/DashboardV2';
import { SecureShareViewerPage } from './pages/SecureShareViewerPage';

function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; masterKey: CryptoKey; shards: any } | null>(null);

  const handleLoginSuccess = (user: { email: string; masterKey: CryptoKey; shards: any }) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  const isShareLink = window.location.pathname.startsWith('/s/');

  return (
    <div className="min-h-screen bg-surface selection:bg-primary selection:text-white">
      {isShareLink ? (
        <SecureShareViewerPage />
      ) : currentUser ? (
        <DashboardV2 userEmail={currentUser.email} onLogout={handleLogout} />
      ) : (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
