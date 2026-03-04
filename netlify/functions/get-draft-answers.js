// netlify/functions/get-draft-answers.js
// Retrieves or deletes draft answers after Stripe return
// GET: fetch saved draft  |  DELETE: clean up after letter generation

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
  if (!['GET', 'DELETE'].includes(event.httpMethod)) {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
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
    let userId = event.queryStringParameters?.userId;
    const mode = event.queryStringParameters?.mode;

    // Fallback: get userId from cookie
    if (!userId) {
      const cookies = parseCookies(event.headers.cookie);
      if (cookies.bl_uid) {
        userId = cookies.bl_uid;
        console.log('Using userId from cookie:', userId);
      }
    }

    if (!userId || !mode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId and mode are required' })
      };
    }

    if (event.httpMethod === 'DELETE') {
      const { error } = await supabase
        .from('draft_answers')
        .delete()
        .eq('user_id', userId)
        .eq('mode', mode);

      if (error) {
        console.error('Error deleting draft:', error);
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Failed to delete draft' })
        };
      }

      console.log('Draft deleted for user:', userId, 'mode:', mode);
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success: true })
      };
    }

    // GET — retrieve draft
    const { data, error } = await supabase
      .from('draft_answers')
      .select('*')
      .eq('user_id', userId)
      .eq('mode', mode)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching draft:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch draft' })
      };
    }

    if (!data) {
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ draft: null })
      };
    }

    console.log('Draft retrieved for user:', userId, 'mode:', mode);
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        draft: {
          answers: data.answers,
          followUpOpen: data.follow_up_open,
          followUpAnswers: data.follow_up_answers,
          tone: data.tone,
          mode: data.mode
        }
      })
    };

  } catch (error) {
    console.error('Get draft error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to process draft request', details: error.message })
    };
  }
}
