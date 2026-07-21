import { useState } from 'react';
import { AuthScreen } from './components/AuthScreen';
import { Dashboard } from './components/Dashboard';

function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; masterKey: CryptoKey; shards: any } | null>(null);

  const handleLoginSuccess = (user: { email: string; masterKey: CryptoKey; shards: any }) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    // Flush local RAM keys
    setCurrentUser(null);
  };

  return (
    <div className="min-h-screen bg-surface selection:bg-primary selection:text-white">
      {currentUser ? (
        <Dashboard userEmail={currentUser.email} onLogout={handleLogout} />
      ) : (
        <AuthScreen onLoginSuccess={handleLoginSuccess} />
      )}
    </div>
  );
}

export default App;
