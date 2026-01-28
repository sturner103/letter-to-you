// src/hooks/useAuth.jsx
import { useState, useEffect, createContext, useContext, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

// Helper to check if error is an abort error (which we can ignore)
const isAbortError = (error) => {
  return error?.name === 'AbortError' || 
         error?.message?.includes('aborted') ||
         error?.code === 'ABORT_ERR';
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const mountedRef = useRef(true);

  const fetchProfile = useCallback(async (userId) => {
    if (!mountedRef.current) return;
    
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet - that's okay
        if (error.code === 'PGRST116') {
          console.log('No profile found for user, will be created on first use');
          return;
        }
        if (!isAbortError(error)) {
          console.error('Error fetching profile:', error);
        }
        return;
      }
      
      if (mountedRef.current) {
        setProfile(data);
      }
    } catch (error) {
      if (!isAbortError(error)) {
        console.error('Error fetching profile:', error);
      }
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          if (!isAbortError(error)) {
            console.error('Error getting initial session:', error);
          }
          if (mountedRef.current) {
            setUser(null);
            setLoading(false);
          }
          return;
        }
        
        if (mountedRef.current) {
          setUser(session?.user ?? null);

          if (session?.user) {
            await fetchProfile(session.user.id);
          }
          setLoading(false);
        }
      } catch (error) {
        if (!isAbortError(error)) {
          console.error('Error getting initial session:', error);
        }
        if (mountedRef.current) {
          setUser(null);
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (!mountedRef.current) return;
        
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    return () => {
      mountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  // Sign up with email/password
  const signUp = async (email, password, displayName) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName }
      }
    });

    if (error) throw error;
    return data;
  };

  // Sign in with email/password
  const signIn = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  };

  // Sign in with magic link
  const signInWithMagicLink = async (email) => {
    const { data, error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });

    if (error) throw error;
    return data;
  };

  // Force clear all Supabase auth storage
  const forceSignOut = useCallback(() => {
    console.log('Force clearing auth storage...');
    
    // Clear all possible Supabase storage keys
    const keysToRemove = [];
    
    // Check localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push({ storage: 'local', key });
      }
    }
    
    // Check sessionStorage
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
        keysToRemove.push({ storage: 'session', key });
      }
    }
    
    // Remove all found keys
    keysToRemove.forEach(({ storage, key }) => {
      console.log(`Removing ${storage}Storage key: ${key}`);
      if (storage === 'local') {
        localStorage.removeItem(key);
      } else {
        sessionStorage.removeItem(key);
      }
    });
    
    // Update state immediately
    setUser(null);
    setProfile(null);
    
    console.log('Auth storage cleared');
  }, []);

  // Sign out with timeout protection
  const signOut = useCallback(async () => {
    console.log('signOut called');
    
    // Create a promise that rejects after timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Sign out timed out')), 3000);
    });
    
    // Try the Supabase signOut with timeout
    try {
      await Promise.race([
        supabase.auth.signOut(),
        timeoutPromise
      ]);
      console.log('Supabase signOut succeeded');
    } catch (error) {
      console.warn('Supabase signOut failed or timed out:', error.message);
      // Continue anyway - we'll force clear storage
    }
    
    // Always force clear storage regardless of API call result
    forceSignOut();
  }, [forceSignOut]);

  // Update profile
  const updateProfile = async (updates) => {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', user.id)
      .select()
      .single();

    if (error) throw error;
    setProfile(data);
    return data;
  };

  // Reset password
  const resetPassword = async (email) => {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset-password`
    });

    if (error) throw error;
    return data;
  };

  const value = {
    user,
    profile,
    loading,
    signUp,
    signIn,
    signInWithMagicLink,
    signOut,
    forceSignOut,
    updateProfile,
    resetPassword,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
