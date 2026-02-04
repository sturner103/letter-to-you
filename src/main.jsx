import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import App from './App.jsx';
import { supabase } from './lib/supabase.js';
import './styles.css';
import './auth-styles.css';
import './styles-additions.css';

// Handle OAuth callback BEFORE React mounts
// Since detectSessionInUrl is false (to avoid Stripe conflicts), we manually process OAuth tokens
async function handleOAuthCallback() {
  // Check if this is an OAuth callback (has hash with access_token)
  if (window.location.hash && window.location.hash.includes('access_token')) {
    console.log('OAuth callback detected, processing tokens...');
    
    try {
      // Parse the hash fragment
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      
      if (accessToken && refreshToken) {
        // Set the session manually
        const { data, error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken
        });
        
        if (data?.session) {
          console.log('OAuth session established successfully!');
          // Clean up the URL (remove hash) and redirect to home
          window.history.replaceState(null, '', '/');
        } else if (error) {
          console.error('Failed to set OAuth session:', error.message);
        }
      }
    } catch (e) {
      console.error('Error processing OAuth callback:', e);
    }
    return true; // Was an OAuth callback
  }
  return false; // Not an OAuth callback
}

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

// Initialize app: handle OAuth first, then Stripe restore, then mount React
async function initializeApp() {
  // Step 1: Handle OAuth callback if present
  await handleOAuthCallback();
  
  // Step 2: Restore session from server if returning from Stripe
  await restoreSessionIfNeeded();
  
  // Step 3: Mount React
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </StrictMode>
  );
}

initializeApp();

