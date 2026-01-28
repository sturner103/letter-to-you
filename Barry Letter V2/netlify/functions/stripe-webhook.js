// netlify/functions/stripe-webhook.js
// Handles Stripe webhook events (payment confirmations)

import Stripe from 'stripe';
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
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return { statusCode: 500, body: 'Stripe not configured' };
  }

  if (!process.env.STRIPE_WEBHOOK_SECRET) {
    console.error('STRIPE_WEBHOOK_SECRET not configured');
    return { statusCode: 500, body: 'Webhook secret not configured' };
  }

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.error('SUPABASE_SERVICE_ROLE_KEY not configured');
    return { statusCode: 500, body: 'Database not configured' };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  
  // Initialize Supabase with service role key (bypasses RLS)
  const supabase = createClient(
    process.env.VITE_SUPABASE_URL || 'https://nsjpjlqtqkkgwcstpunq.supabase.co',
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // Get the signature from headers
  const signature = event.headers['stripe-signature'];
  
  if (!signature) {
    console.error('No Stripe signature found');
    return { statusCode: 400, body: 'No signature' };
  }

  let stripeEvent;

  try {
    // Verify the webhook signature
    stripeEvent = stripe.webhooks.constructEvent(
      event.body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return { 
      statusCode: 400, 
      body: `Webhook Error: ${err.message}` 
    };
  }

  // Handle the event
  console.log('Received Stripe event:', stripeEvent.type);

  if (stripeEvent.type === 'checkout.session.completed') {
    const session = stripeEvent.data.object;
    
    console.log('Checkout completed:', {
      sessionId: session.id,
      userId: session.metadata?.userId,
      mode: session.metadata?.letterMode,
      amount: session.amount_total,
      currency: session.currency
    });

    // Extract metadata
    const userId = session.metadata?.userId;
    const letterMode = session.metadata?.letterMode;
    const modeName = session.metadata?.modeName;

    if (!userId || !letterMode) {
      console.error('Missing metadata in session:', session.metadata);
      return { statusCode: 400, body: 'Missing metadata' };
    }

    try {
      // Record the purchase in Supabase
      const { data, error } = await supabase
        .from('purchases')
        .insert({
          user_id: userId,
          letter_mode: letterMode,
          mode_name: modeName,
          amount: session.amount_total, // Amount in cents
          currency: session.currency?.toUpperCase() || 'NZD',
          stripe_session_id: session.id,
          stripe_payment_intent: session.payment_intent,
          status: 'completed'
        })
        .select()
        .single();

      if (error) {
        console.error('Error recording purchase:', error);
        // Don't fail the webhook - Stripe will retry
        // Log error for manual investigation
      } else {
        console.log('Purchase recorded:', data.id);
      }

    } catch (dbError) {
      console.error('Database error:', dbError);
      // Don't fail the webhook
    }
  }

  // Handle payment failure (optional - for logging)
  if (stripeEvent.type === 'checkout.session.expired') {
    const session = stripeEvent.data.object;
    console.log('Checkout expired:', session.id);
  }

  // Return 200 to acknowledge receipt
  return {
    statusCode: 200,
    body: JSON.stringify({ received: true })
  };
}
