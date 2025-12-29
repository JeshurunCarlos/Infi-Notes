
import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import LandingPage from './components/LandingPage';
import JournalPage from './components/JournalPage';
import WidgetPage from './components/WidgetPage';
import LoadingScreen from './components/LoadingScreen';
import ThemeSelectionPage from './components/ThemeSelectionPage';
import LoginPage from './components/LoginPage';
import { User, Theme } from './types';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const DEFAULT_USER: User = {
    id: 'mock-user-123',
    name: 'Jeshurun',
    email: 'jeshurun@example.com',
    avatar: 'https://i.pravatar.cc/150?u=alexrider'
};

const AuthWrapper = () => {
  const [user, setUser] = useState<User | null>(DEFAULT_USER);
  const [viewMode, setViewMode] = useState<'theme-selection' | 'landing' | 'login' | 'app' | 'journal' | 'widgets'>('landing');
  const [theme, setTheme] = useState<Theme>('light');
  const [isLoading, setIsLoading] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'modern' | 'classic'>('modern');
  
  const [startWithDashboard, setStartWithDashboard] = useState(true);
  const [hasSelectedTheme, setHasSelectedTheme] = useState(true);
  const [pendingView, setPendingView] = useState<'app' | 'journal' | 'widgets' | null>(null);

  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);

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
      setHasSelectedTheme(true);
      handleTransition(() => {
          setViewMode(pendingView || 'app');
          setPendingView(null);
      });
  };

  const attemptNavigation = (targetView: 'app' | 'journal' | 'widgets') => {
      if (hasSelectedTheme) {
          handleTransition(() => {
              setViewMode(targetView);
          });
      } else {
          setPendingView(targetView);
          handleTransition(() => {
              setViewMode('theme-selection');
          });
      }
  };

  const handleGoToLogin = () => {
      handleTransition(() => {
          setViewMode('login');
      });
  };

  const handleLoginSuccess = (selectedUser: User) => {
      setUser(selectedUser);
      attemptNavigation('app');
  };

  const handleOpenJournal = () => attemptNavigation('journal');
  const handleOpenWidgets = () => attemptNavigation('widgets');

  const handleLaunchWorkspace = () => {
      setStartWithDashboard(false);
      if (user) {
          attemptNavigation('app');
      } else {
          handleGoToLogin();
      }
  };

  const handleOpenDashboard = () => {
      setStartWithDashboard(true);
      if (user) {
          attemptNavigation('app');
      } else {
          handleGoToLogin();
      }
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

  const handleBackFromWidgets = () => {
      handleTransition(() => {
          if (user) {
              setViewMode('app');
          } else {
              setViewMode('landing');
          }
      });
  };

  const handleNavigate = (view: any) => {
      handleTransition(() => {
          setViewMode(view);
      });
  };

  return (
    <>
        {isLoading && <LoadingScreen theme={theme} />}
        
        {viewMode === 'theme-selection' ? (
            <ThemeSelectionPage 
                currentTheme={theme}
                onPreviewTheme={handleThemePreview} 
                onContinue={handleThemeConfirm}
                layoutMode={layoutMode}
                onLayoutChange={setLayoutMode}
            />
        ) : (!user && viewMode === 'login') ? (
            <LoginPage 
                onSelectUser={handleLoginSuccess}
                onBack={handleBackToLanding}
            />
        ) : (!user || viewMode === 'landing') ? (
            <LandingPage 
                onLogin={handleLaunchWorkspace} 
                onOpenDashboard={handleOpenDashboard}
                onOpenJournal={handleOpenJournal} 
                onOpenWidgets={handleOpenWidgets} 
                onOpenThemeSelection={() => handleNavigate('theme-selection')}
                user={user}
                currentTheme={theme}
                onSetTheme={setTheme}
            />
        ) : viewMode === 'journal' ? (
            <JournalPage 
                user={user!} 
                onBack={handleBackToLanding} 
                onLogout={handleLogout} 
                theme={theme} 
                setTheme={setTheme} 
                onGoHome={handleBackToLanding}
            />
        ) : viewMode === 'widgets' ? (
            <WidgetPage 
                onBack={handleBackFromWidgets} 
                theme={theme} 
                setTheme={setTheme} 
                onGoHome={handleBackToLanding}
            />
        ) : (
            <App 
                key={`app-view-${startWithDashboard}`} // Fix: key forces remount when preference changes
                user={user as User} // Fix: Guaranteed non-null at this branch by previous conditions
                onLogout={handleLogout} 
                theme={theme} 
                setTheme={setTheme} 
                onOpenWidgets={handleOpenWidgets}
                onOpenJournal={handleOpenJournal}
                onGoHome={handleBackToLanding}
                onUpdateUser={(updatedUser) => setUser(updatedUser)}
                initialShowDashboard={startWithDashboard}
                layoutMode={layoutMode}
                onLayoutChange={setLayoutMode}
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
