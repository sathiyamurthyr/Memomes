import { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { DashboardV2 } from './components/DashboardV2';

function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; masterKey: CryptoKey; shards: any } | null>(null);

  const handleLoginSuccess = (user: { email: string; masterKey: CryptoKey; shards: any }) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary selection:text-white">
      {currentUser ? (
        <DashboardV2 userEmail={currentUser.email} onLogout={handleLogout} />
      ) : (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
