// netlify/functions/save-letter.js
// Saves a letter to the database using service role (bypasses RLS)
// Used when frontend auth session is lost but we have verified userId from Stripe

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
    const { userId, mode, tone, questions, letterContent } = JSON.parse(event.body);

    if (!userId || !letterContent) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId and letterContent are required' })
      };
    }

    const { data, error } = await supabase
      .from('letters')
      .insert({
        user_id: userId,
        mode: mode || 'general',
        tone: tone || 'warm',
        questions: questions || [],
        letter_content: letterContent,
        word_count: letterContent.split(/\s+/).length,
        delivery_status: 'immediate'
      })
      .select()
      .single();

    if (error) {
      console.error('Error saving letter:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to save letter', details: error.message })
      };
    }

    console.log('Letter saved successfully for user:', userId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        letter: {
          id: data.id,
          mode: data.mode,
          tone: data.tone,
          createdAt: data.created_at
        }
      })
    };

  } catch (error) {
    console.error('Save letter error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to save letter',
        details: error.message 
      })
    };
  }
}
