// netlify/functions/mark-purchase-used.js
// Marks a purchase as used when a letter is generated

import { createClient } from '@supabase/supabase-js';

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
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
    const { purchaseId, letterId, userId } = JSON.parse(event.body);

    if (!purchaseId || !userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'purchaseId and userId are required' })
      };
    }

    // Update the purchase to mark it as used
    const { data, error } = await supabase
      .from('purchases')
      .update({
        used: true,
        used_at: new Date().toISOString(),
        letter_id: letterId || null
      })
      .eq('id', purchaseId)
      .eq('user_id', userId) // Security: ensure user owns this purchase
      .eq('used', false) // Only update if not already used
      .select()
      .single();

    if (error) {
      console.error('Error marking purchase used:', error);
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Failed to mark purchase as used',
          details: error.message 
        })
      };
    }

    if (!data) {
      return {
        statusCode: 400,
        body: JSON.stringify({ 
          error: 'Purchase not found or already used' 
        })
      };
    }

    console.log('Purchase marked as used:', purchaseId);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        success: true,
        purchase: {
          id: data.id,
          usedAt: data.used_at
        }
      })
    };

  } catch (error) {
    console.error('Mark purchase used error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to update purchase',
        details: error.message 
      })
    };
  }
}
