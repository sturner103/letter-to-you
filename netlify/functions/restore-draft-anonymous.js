// netlify/functions/restore-draft-anonymous.js
// Restores draft answers after Google OAuth redirect
// Reads bl_draft cookie, fetches from temp_drafts, deletes the row

import { createClient } from '@supabase/supabase-js';

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

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Database not configured' })
    };
  }

  const cookies = parseCookies(event.headers.cookie);
  const token = cookies.bl_draft;

  if (!token) {
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ draft: null })
    };
  }

  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://nsjpjlqtqkkgwcstpunq.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Fetch the draft
    const { data, error } = await supabase
      .from('temp_drafts')
      .select('*')
      .eq('token', token)
      .single();

    if (error || !data) {
      console.log('No temp draft found for token:', token.substring(0, 8) + '...');
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          // Clear the cookie since it's no longer valid
          'Set-Cookie': 'bl_draft=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
        },
        body: JSON.stringify({ draft: null })
      };
    }

    // Delete the row (one-time use)
    await supabase
      .from('temp_drafts')
      .delete()
      .eq('token', token);

    console.log('Temp draft restored and deleted for mode:', data.mode);

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        // Clear the cookie
        'Set-Cookie': 'bl_draft=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0'
      },
      body: JSON.stringify({
        draft: {
          mode: data.mode,
          answers: data.answers,
          followUpOpen: data.follow_up_open,
          followUpAnswers: data.follow_up_answers,
          tone: data.tone
        }
      })
    };

  } catch (error) {
    console.error('Restore draft anonymous error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to restore draft' })
    };
  }
}
