// netlify/functions/store-draft-anonymous.js
// Stores draft answers server-side before Google OAuth redirect
// No auth required — keyed by random token, returned as cookie

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
    const { mode, answers, followUpOpen, followUpAnswers, tone } = JSON.parse(event.body);

    if (!mode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'mode is required' })
      };
    }

    const token = crypto.randomBytes(32).toString('hex');

    const { error } = await supabase
      .from('temp_drafts')
      .insert({
        token,
        mode,
        answers: answers || {},
        follow_up_open: followUpOpen || {},
        follow_up_answers: followUpAnswers || {},
        tone: tone || 'youdecide'
      });

    if (error) {
      console.error('Error storing temp draft:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to store draft' })
      };
    }

    console.log('Temp draft stored with token:', token.substring(0, 8) + '...');

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `bl_draft=${token}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=7200`
      },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    console.error('Store draft anonymous error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to store draft' })
    };
  }
}
