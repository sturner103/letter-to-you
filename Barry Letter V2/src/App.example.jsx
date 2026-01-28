// Example integration for App.jsx
// This shows how to incorporate auth, future letter, and check-in features
// Adapt this to your existing App.jsx structure

import { useState } from 'react';
import { AuthProvider, useAuth } from './hooks/useAuth';
import AuthModal from './components/Auth/AuthModal';
import FutureLetterForm from './components/FutureLetter/FutureLetterForm';
import WeeklyCheckin from './components/Checkin/WeeklyCheckin';
import CheckinHistory from './components/Checkin/CheckinHistory';
import './styles.css';
import './styles-additions.css'; // Import the new styles

// Main App wrapper with AuthProvider
function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

// App content with access to auth context
function AppContent() {
  const { user, loading, signOut, isAuthenticated } = useAuth();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [currentView, setCurrentView] = useState('home'); // 'home', 'checkin', 'history', 'future-letter'
  
  // Letter state (from your existing code)
  const [generatedLetter, setGeneratedLetter] = useState(null);
  const [letterQuestions, setLetterQuestions] = useState([]);
  const [letterMode, setLetterMode] = useState('general');
  const [letterTone, setLetterTone] = useState('warm');

  const openAuth = (mode = 'login') => {
    setAuthMode(mode);
    setShowAuthModal(true);
  };

  // User menu component
  const UserMenu = () => {
    if (loading) return null;

    if (!isAuthenticated) {
      return (
        <div className="auth-buttons">
          <button onClick={() => openAuth('login')} className="btn-secondary">
            Sign In
          </button>
          <button onClick={() => openAuth('signup')} className="btn-primary">
            Create Account
          </button>
        </div>
      );
    }

    return (
      <div className="user-menu">
        <span className="user-email">{user?.email}</span>
        <nav className="user-nav">
          <button onClick={() => setCurrentView('home')}>Write Letter</button>
          <button onClick={() => setCurrentView('checkin')}>Weekly Check-in</button>
          <button onClick={() => setCurrentView('history')}>My Progress</button>
        </nav>
        <button onClick={signOut} className="btn-secondary">
          Sign Out
        </button>
      </div>
    );
  };

  // Render based on current view
  const renderContent = () => {
    switch (currentView) {
      case 'checkin':
        if (!isAuthenticated) {
          return (
            <div className="auth-required">
              <h2>Weekly Check-in</h2>
              <p>Sign in to track your progress over time.</p>
              <button onClick={() => openAuth('signup')} className="btn-primary">
                Create Free Account
              </button>
            </div>
          );
        }
        return <WeeklyCheckin onComplete={() => setCurrentView('history')} />;

      case 'history':
        if (!isAuthenticated) {
          return (
            <div className="auth-required">
              <h2>Your Progress</h2>
              <p>Sign in to see your check-in history and trends.</p>
              <button onClick={() => openAuth('signup')} className="btn-primary">
                Create Free Account
              </button>
            </div>
          );
        }
        return <CheckinHistory />;

      case 'future-letter':
        if (!isAuthenticated) {
          return (
            <div className="auth-required">
              <h2>Letter to Future Self</h2>
              <p>Create an account to schedule letters for future delivery.</p>
              <button onClick={() => openAuth('signup')} className="btn-primary">
                Create Free Account
              </button>
            </div>
          );
        }
        return (
          <FutureLetterForm
            letterContent={generatedLetter}
            questions={letterQuestions}
            mode={letterMode}
            tone={letterTone}
            onComplete={() => {
              setGeneratedLetter(null);
              setCurrentView('home');
            }}
          />
        );

      default:
        // Your existing letter generation UI goes here
        return (
          <div className="letter-generator">
            {/* Your existing question flow and letter generation */}
            
            {/* After letter is generated, show option to send to future self */}
            {generatedLetter && (
              <div className="letter-actions">
                <h3>Your Letter is Ready!</h3>
                
                {/* Existing actions */}
                <button className="btn-primary">
                  Download Letter
                </button>
                
                {/* New: Send to Future Self */}
                <div className="future-self-cta">
                  <p>Want to receive this letter in the future?</p>
                  {isAuthenticated ? (
                    <button 
                      onClick={() => setCurrentView('future-letter')}
                      className="btn-secondary"
                    >
                      📮 Send to Future Self
                    </button>
                  ) : (
                    <button 
                      onClick={() => openAuth('signup')}
                      className="btn-secondary"
                    >
                      Sign up to schedule delivery
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="app">
      <header className="app-header">
        <h1 onClick={() => setCurrentView('home')} style={{ cursor: 'pointer' }}>
          Letter to You
        </h1>
        <UserMenu />
      </header>

      <main className="app-main">
        {renderContent()}
      </main>

      {/* Auth Modal */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialMode={authMode}
      />
    </div>
  );
}

export default App;
