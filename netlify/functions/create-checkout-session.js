// netlify/functions/create-checkout-session.js
// Creates a Stripe Checkout session for letter purchase

import Stripe from 'stripe';

export async function handler(event) {
  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Check for Stripe secret key
  if (!process.env.STRIPE_SECRET_KEY) {
    console.error('STRIPE_SECRET_KEY not configured');
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Payment system not configured' })
    };
  }

  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

  try {
    const { userId, mode, modeName } = JSON.parse(event.body);

    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User must be logged in to purchase' })
      };
    }

    if (!mode) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Letter mode is required' })
      };
    }

    // Get the site URL for redirects
    // IMPORTANT: Hard-code production URL to ensure Stripe always redirects to the same origin
    // This prevents session loss from www vs non-www or other URL variations
    const siteUrl = process.env.NODE_ENV === 'production' || process.env.URL?.includes('barryletter')
      ? 'https://barryletter.com'
      : (process.env.URL || 'http://localhost:5173');
    
    console.log('Stripe redirect URL will be:', siteUrl);
    console.log('process.env.URL:', process.env.URL);

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price: process.env.STRIPE_PRICE_ID, // Your $12 NZD price
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${siteUrl}/write/${mode}?payment=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/?payment=cancelled`,
      metadata: {
        userId: userId,
        letterMode: mode,
        modeName: modeName || mode
      },
      // Collect billing address for tax purposes (GST-ready)
      billing_address_collection: 'required',
      // Allow promotion codes if you want to offer discounts later
      allow_promotion_codes: true,
    });

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        sessionId: session.id,
        url: session.url 
      })
    };

  } catch (error) {
    console.error('Stripe checkout error:', error);
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to create checkout session',
        details: error.message 
      })
    };
  }
}
