
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './components/LandingPage';
import JournalPage from './components/JournalPage';
import LoadingScreen from './components/LoadingScreen';
import { User, Theme } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// A mock user for demonstration purposes
const MOCK_USER: User = {
  id: 'mock-user-123',
  name: 'Thanos Subramaniyam',
  email: 'thanos.subm@example.com',
  avatar: 'https://i.pravatar.cc/150?u=alexrider'
};

const AuthWrapper = () => {
  const [user, setUser] = useState<User | null>(null);
  const [viewMode, setViewMode] = useState<'app' | 'journal'>('app');
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(false);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  const handleTransition = (callback: () => void) => {
      setIsLoading(true);
      setTimeout(() => {
          callback();
          setIsLoading(false);
      }, 1000);
  };

  const handleLogin = () => {
    handleTransition(() => {
        setUser(MOCK_USER);
        setViewMode('app');
    });
  };

  const handleOpenJournal = () => {
      handleTransition(() => {
          if (!user) setUser(MOCK_USER); // Auto-login if coming from landing
          setViewMode('journal');
      });
  };

  const handleLogout = () => {
    handleTransition(() => {
        setUser(null);
        setViewMode('app');
    });
  };
  
  const handleBackToApp = () => {
      handleTransition(() => {
          setViewMode('app');
      });
  };

  return (
    <>
        {isLoading && <LoadingScreen />}
        {!user ? (
            <LandingPage onLogin={handleLogin} onOpenJournal={handleOpenJournal} />
        ) : viewMode === 'journal' ? (
            <JournalPage 
                user={user} 
                onBack={handleBackToApp} 
                onLogout={handleLogout} 
                theme={theme} 
                setTheme={setTheme} 
            />
        ) : (
            <App 
                user={user} 
                onLogout={handleLogout} 
                theme={theme} 
                setTheme={setTheme} 
            />
        )}
    </>
  );
};

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AuthWrapper />
  </React.StrictMode>
);
