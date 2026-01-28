// src/components/Auth/AuthModal.jsx
import { useState } from 'react';
import { useAuth } from '../../hooks/useAuth';

export const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState(initialMode); // 'login', 'signup', 'magic-link', 'forgot-password'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  const { signIn, signUp, signInWithMagicLink, signInWithGoogle, resetPassword } = useAuth();

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });
    
    try {
      await signInWithGoogle();
      // Note: This will redirect to Google, so onClose won't be called here
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Failed to sign in with Google.'
      });
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      switch (mode) {
        case 'login':
          await signIn(email, password);
          onClose();
          break;

        case 'signup':
          await signUp(email, password, displayName);
          // Auto sign-in after signup (since email confirmation is disabled)
          try {
            await signIn(email, password);
            onClose();
          } catch {
            // If auto sign-in fails, show success message
            setMessage({
              type: 'success',
              text: 'Account created! You can now sign in.'
            });
            setMode('login');
          }
          break;

        case 'magic-link':
          await signInWithMagicLink(email);
          setMessage({
            type: 'success',
            text: 'Check your email for a magic link to sign in!'
          });
          break;

        case 'forgot-password':
          await resetPassword(email);
          setMessage({
            type: 'success',
            text: 'Check your email for password reset instructions.'
          });
          break;
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error.message || 'Something went wrong. Please try again.'
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEmail('');
    setPassword('');
    setDisplayName('');
    setMessage({ type: '', text: '' });
  };

  const switchMode = (newMode) => {
    setMode(newMode);
    resetForm();
  };

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>
        
        <h2 className="auth-title">
          {mode === 'login' && 'Welcome Back'}
          {mode === 'signup' && 'Create Account'}
          {mode === 'magic-link' && 'Sign In with Email'}
          {mode === 'forgot-password' && 'Reset Password'}
        </h2>

        {message.text && (
          <div className={`auth-message ${message.type}`}>
            {message.text}
          </div>
        )}

        {(mode === 'login' || mode === 'signup') && (
          <>
            <button
              type="button"
              className="google-sign-in-btn"
              onClick={handleGoogleSignIn}
              disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
                <path d="M9.003 18c2.43 0 4.467-.806 5.956-2.18l-2.909-2.26c-.806.54-1.836.86-3.047.86-2.344 0-4.328-1.584-5.036-3.711H.96v2.332C2.44 15.983 5.485 18 9.003 18z" fill="#34A853"/>
                <path d="M3.964 10.712c-.18-.54-.282-1.117-.282-1.71 0-.593.102-1.17.282-1.71V4.96H.957C.347 6.175 0 7.55 0 9.002c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
                <path d="M9.003 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.464.891 11.428 0 9.002 0 5.485 0 2.44 2.017.96 4.958L3.967 7.29c.708-2.127 2.692-3.71 5.036-3.71z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>

            <div className="auth-divider">
              <span>or</span>
            </div>
          </>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          {mode === 'signup' && (
            <div className="form-group">
              <label htmlFor="displayName">Name (optional)</label>
              <input
                type="text"
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How should we address you?"
              />
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              required
            />
          </div>

          {(mode === 'login' || mode === 'signup') && (
            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          )}

          <button
            type="submit"
            className="auth-submit-btn"
            disabled={loading}
          >
            {loading ? 'Please wait...' : (
              <>
                {mode === 'login' && 'Sign In'}
                {mode === 'signup' && 'Create Account'}
                {mode === 'magic-link' && 'Send Magic Link'}
                {mode === 'forgot-password' && 'Send Reset Link'}
              </>
            )}
          </button>
        </form>

        <div className="auth-divider">
          <span>or</span>
        </div>

        <div className="auth-links">
          {mode === 'login' && (
            <>
              <button
                className="auth-link-btn"
                onClick={() => switchMode('magic-link')}
              >
                Sign in with magic link (no password)
              </button>
              <button
                className="auth-link-btn"
                onClick={() => switchMode('forgot-password')}
              >
                Forgot password?
              </button>
              <p className="auth-switch">
                Don't have an account?{' '}
                <button onClick={() => switchMode('signup')}>Sign up</button>
              </p>
            </>
          )}

          {mode === 'signup' && (
            <p className="auth-switch">
              Already have an account?{' '}
              <button onClick={() => switchMode('login')}>Sign in</button>
            </p>
          )}

          {(mode === 'magic-link' || mode === 'forgot-password') && (
            <p className="auth-switch">
              <button onClick={() => switchMode('login')}>
                ← Back to sign in
              </button>
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Auth callback component for handling redirects
export const AuthCallback = () => {
  // This component handles the redirect from magic link / email confirmation
  // Supabase will automatically handle the session
  return (
    <div className="auth-callback">
      <p>Signing you in...</p>
    </div>
  );
};

export default AuthModal;
