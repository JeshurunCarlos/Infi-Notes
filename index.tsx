
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './components/LandingPage';
import JournalPage from './components/JournalPage';
import WidgetPage from './components/WidgetPage';
import LoadingScreen from './components/LoadingScreen';
import ThemeSelectionPage from './components/ThemeSelectionPage';
import { CandyBoxMenu } from './components/CandyBoxMenu';
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
  const [viewMode, setViewMode] = useState<'theme-selection' | 'landing' | 'app' | 'journal' | 'widgets'>('theme-selection');
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(false);

  // Apply theme class to document
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

  // Load saved font preference
  useEffect(() => {
      const savedFont = localStorage.getItem('infi-font-body');
      if (savedFont) {
          document.documentElement.style.setProperty('--font-body', savedFont);
          document.documentElement.style.setProperty('--font-heading', savedFont);
      }
  }, []);

  const handleTransition = (callback: () => void) => {
      setIsLoading(true);
      setTimeout(() => {
          callback();
          setIsLoading(false);
      }, 1000);
  };

  const handleThemePreview = (selectedTheme: Theme) => {
      setTheme(selectedTheme);
  };

  const handleThemeConfirm = () => {
      handleTransition(() => {
          setViewMode('landing');
      });
  };

  const handleLogin = () => {
    handleTransition(() => {
        setUser(MOCK_USER);
        setViewMode('app'); // Go directly to app to avoid "2nd iteration" of landing page
    });
  };

  const handleEnterApp = () => {
      handleTransition(() => {
          setViewMode('app');
      });
  };

  const handleOpenJournal = () => {
      handleTransition(() => {
          if (!user) setUser(MOCK_USER); // Auto-login if coming from landing publicly
          setViewMode('journal');
      });
  };

  const handleOpenWidgets = () => {
      handleTransition(() => {
          if (!user) setUser(MOCK_USER);
          setViewMode('widgets');
      });
  };

  const handleLogout = () => {
    handleTransition(() => {
        setUser(null);
        setViewMode('landing');
    });
  };
  
  const handleBackToLanding = () => {
      handleTransition(() => {
          setViewMode('landing');
      });
  };

  const handleNavigate = (view: any) => {
      handleTransition(() => {
          setViewMode(view);
      });
  };

  return (
    <>
        {isLoading && <LoadingScreen />}
        
        {viewMode === 'theme-selection' ? (
            <ThemeSelectionPage 
                currentTheme={theme}
                onPreviewTheme={handleThemePreview} 
                onContinue={handleThemeConfirm}
            />
        ) : (!user || viewMode === 'landing') ? (
            <LandingPage 
                onLogin={user ? handleEnterApp : handleLogin} // If logged in, enter app. If not, login.
                onOpenJournal={handleOpenJournal} 
                onOpenWidgets={handleOpenWidgets} 
                user={user}
                currentTheme={theme}
                onSetTheme={setTheme}
            />
        ) : viewMode === 'journal' ? (
            <JournalPage 
                user={user} 
                onBack={handleBackToLanding} 
                onLogout={handleLogout} 
                theme={theme} 
                setTheme={setTheme} 
            />
        ) : viewMode === 'widgets' ? (
            <WidgetPage 
                onBack={handleBackToLanding} 
                theme={theme} 
                setTheme={setTheme} 
            />
        ) : (
            <App 
                user={user} 
                onLogout={handleLogout} 
                theme={theme} 
                setTheme={setTheme} 
                onOpenWidgets={handleOpenWidgets}
                onGoHome={handleBackToLanding}
                onUpdateUser={(updatedUser) => setUser(updatedUser)}
            />
        )}

        {/* Global Candy Box Menu - Rendered on all pages except initial theme selection */}
        {viewMode !== 'theme-selection' && !isLoading && (
            <CandyBoxMenu 
                currentView={viewMode}
                onNavigate={handleNavigate}
                theme={theme}
                setTheme={setTheme}
                user={user}
                onLogin={handleLogin}
                onLogout={handleLogout}
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
