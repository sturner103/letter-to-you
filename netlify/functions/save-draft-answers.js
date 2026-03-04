// netlify/functions/save-draft-answers.js
// Saves draft answers to Supabase before Stripe redirect (UPSERT - one draft per user per mode)

import { createClient } from '@supabase/supabase-js';

export async function handler(event) {
  if (event.httpMethod !== 'POST') {
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
    const { userId, mode, answers, followUpOpen, followUpAnswers, tone } = JSON.parse(event.body);

    if (!userId || !mode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId and mode are required' })
      };
    }

    const { data, error } = await supabase
      .from('draft_answers')
      .upsert({
        user_id: userId,
        mode,
        answers: answers || {},
        follow_up_open: followUpOpen || {},
        follow_up_answers: followUpAnswers || {},
        tone: tone || 'youdecide',
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id,mode' })
      .select()
      .single();

    if (error) {
      console.error('Error saving draft:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save draft', details: error.message })
      };
    }

    console.log('Draft saved for user:', userId, 'mode:', mode);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ success: true, draft: { id: data.id } })
    };

  } catch (error) {
    console.error('Save draft error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to save draft', details: error.message })
    };
  }
}
