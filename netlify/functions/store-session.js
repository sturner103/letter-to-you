// netlify/functions/store-session.js
// Temporarily stores session tokens before Stripe redirect
// Retrieved after return to restore the session

import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Database not configured' }) 
    };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://nsjpjlqtqkkgwcstpunq.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    const { userId, accessToken, refreshToken } = JSON.parse(event.body);

    if (!userId || !accessToken || !refreshToken) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields' })
      };
    }

    // Generate a random restore token
    const restoreToken = crypto.randomBytes(32).toString('hex');

    // Store in a simple key-value approach using the purchases or a temp table
    // We'll use the user's profile or create a temp storage
    // For simplicity, store in localStorage-like approach via Supabase
    
    const { error } = await supabase
      .from('session_backups')
      .upsert({
        user_id: userId,
        restore_token: restoreToken,
        access_token: accessToken,
        refresh_token: refreshToken,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 3600000).toISOString() // 1 hour
      }, {
        onConflict: 'user_id'
      });

    if (error) {
      // Table might not exist - that's ok, we'll create it
      console.error('Error storing session:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to store session' })
      };
    }

    // Return the restore token - will be stored in cookie
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `bl_restore=${restoreToken}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=3600`
      },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Store session error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to store session' })
    };
  }
}
