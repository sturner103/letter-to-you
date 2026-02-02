// netlify/functions/verify-purchase.js
// Verifies if a user has a valid purchase for a letter mode

import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

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

    // Also check for userId in cookie (set before Stripe redirect)
    if (!userId) {
      const cookies = parseCookies(event.headers.cookie);
      if (cookies.bl_uid) {
        userId = cookies.bl_uid;
        console.log('Retrieved userId from cookie:', userId);
      }
    }

    // If we have a sessionId but no userId, get userId from Stripe session metadata
    if (sessionId && !userId) {
      if (!process.env.STRIPE_SECRET_KEY) {
        return {
          statusCode: 500,
          body: JSON.stringify({ error: 'Payment system not configured' })
        };
      }
      
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
      
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        userId = session.metadata?.userId;
        console.log('Retrieved userId from Stripe session:', userId);
      } catch (stripeError) {
        console.error('Error retrieving Stripe session:', stripeError);
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Invalid session ID' })
        };
      }
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
          },
          // Return userId so frontend can use it even if auth is lost
          userId: userId
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
        })),
        userId: userId
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
