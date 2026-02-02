// netlify/functions/restore-session.js
// Retrieves session tokens stored before Stripe redirect
// Called on page load to restore the auth session

import { createClient } from '@supabase/supabase-js';

// Helper to parse cookies
const parseCookies = (cookieHeader) => {
  const cookies = {};
  if (cookieHeader) {
    cookieHeader.split(';').forEach(cookie => {
      const [name, value] = cookie.trim().split('=');
      if (name && value) cookies[name] = value;
    });
  }
  return cookies;
};

export async function handler(event) {
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get restore token from cookie
  const cookies = parseCookies(event.headers.cookie);
  const restoreToken = cookies.bl_restore;

  if (!restoreToken) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ found: false })
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
    // Find the session backup
    const { data, error } = await supabase
      .from('session_backups')
      .select('*')
      .eq('restore_token', restoreToken)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (error || !data) {
      return {
        statusCode: 200,
        headers: { 
          'Content-Type': 'application/json',
          // Clear the cookie since it's invalid/expired
          'Set-Cookie': 'bl_restore=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
        },
        body: JSON.stringify({ found: false })
      };
    }

    // Delete the backup (one-time use)
    await supabase
      .from('session_backups')
      .delete()
      .eq('restore_token', restoreToken);

    // Return the session tokens and clear the cookie
    return {
      statusCode: 200,
      headers: { 
        'Content-Type': 'application/json',
        'Set-Cookie': 'bl_restore=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      },
      body: JSON.stringify({ 
        found: true,
        accessToken: data.access_token,
        refreshToken: data.refresh_token
      })
    };

  } catch (error) {
    console.error('Restore session error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to restore session' })
    };
  }
}
