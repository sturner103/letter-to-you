// netlify/functions/verify-purchase.js
// Verifies if a user has a valid purchase for a letter mode

import { createClient } from '@supabase/supabase-js';

export async function handler(event) {
  // Allow GET and POST
  if (event.httpMethod !== 'GET' && event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check environment variables
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
    return { 
      statusCode: 500, 
      body: JSON.stringify({ error: 'Database not configured' }) 
    };
  }

  // Initialize Supabase with service role key
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://nsjpjlqtqkkgwcstpunq.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    // Get parameters from query string or body
    let userId, sessionId;
    
    if (event.httpMethod === 'GET') {
      userId = event.queryStringParameters?.userId;
      sessionId = event.queryStringParameters?.sessionId;
    } else {
      const body = JSON.parse(event.body || '{}');
      userId = body.userId;
      sessionId = body.sessionId;
    }

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'userId is required' })
      };
    }

    // If sessionId provided, verify that specific purchase
    if (sessionId) {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('stripe_session_id', sessionId)
        .eq('user_id', userId)
        .eq('status', 'completed')
        .eq('used', false)
        .single();

      if (error || !data) {
        return {
          statusCode: 200,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            valid: false,
            message: 'Purchase not found or already used'
          })
        };
      }

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          valid: true,
          purchase: {
            id: data.id,
            letterMode: data.letter_mode,
            modeName: data.mode_name,
            createdAt: data.created_at
          }
        })
      };
    }

    // Otherwise, get all unused purchases for this user
    const { data, error } = await supabase
      .from('purchases')
      .select('*')
      .eq('user_id', userId)
      .eq('status', 'completed')
      .eq('used', false)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching purchases:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to fetch purchases' })
      };
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        purchases: data.map(p => ({
          id: p.id,
          letterMode: p.letter_mode,
          modeName: p.mode_name,
          createdAt: p.created_at
        }))
      })
    };

  } catch (error) {
    console.error('Verify purchase error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to verify purchase',
        details: error.message 
      })
    };
  }
}
