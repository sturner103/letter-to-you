import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import App from './App.jsx';
import { supabase } from './lib/supabase.js';
import './styles.css';
import './auth-styles.css';
import './styles-additions.css';

// Restore session from server BEFORE React mounts
// This handles Chrome's Bounce Tracking Mitigations wiping localStorage
async function restoreSessionIfNeeded() {
  // Only attempt restore if returning from Stripe (has payment params)
  const params = new URLSearchParams(window.location.search);
  if (!params.has('payment') && !params.has('stripe_session')) {
    return; // Not a Stripe return, skip restore
  }

  console.log('Stripe return detected, checking for session backup...');
  
  try {
    const response = await fetch('/.netlify/functions/restore-session', {
      credentials: 'include'
    });
    const data = await response.json();
    
    if (data.found && data.accessToken && data.refreshToken) {
      console.log('Found session backup, restoring...');
      const { data: sessionData, error } = await supabase.auth.setSession({
        access_token: data.accessToken,
        refresh_token: data.refreshToken
      });
      
      if (sessionData?.session) {
        console.log('Session restored successfully!');
      } else if (error) {
        console.error('Failed to restore session:', error.message);
      }
    } else {
      console.log('No session backup found');
    }
  } catch (e) {
    console.error('Error checking for session backup:', e);
  }
}

// Restore session first, then mount React
restoreSessionIfNeeded().then(() => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
});

