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

  const { signIn, signUp, signInWithMagicLink, resetPassword } = useAuth();

  if (!isOpen) return null;

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
          setMessage({
            type: 'success',
            text: 'Check your email for a confirmation link!'
          });
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
