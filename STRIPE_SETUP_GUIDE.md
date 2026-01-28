# Stripe Payment Setup Guide

This guide walks you through setting up Stripe payments for Barry Letter.

---

## Step 1: Create the Purchases Table in Supabase

Run this SQL in your Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
-- =====================================================
-- PURCHASES TABLE (tracks letter payments)
-- =====================================================
CREATE TABLE public.purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  
  -- What they bought
  letter_mode TEXT NOT NULL,           -- 'general', 'relationship', 'career', etc.
  mode_name TEXT,                       -- Human-readable name
  
  -- Payment details
  amount INTEGER NOT NULL,              -- Amount in cents (1200 = $12.00)
  currency TEXT DEFAULT 'NZD',
  stripe_session_id TEXT UNIQUE,        -- Checkout session ID
  stripe_payment_intent TEXT,           -- Payment intent ID (for refunds)
  
  -- Status tracking
  status TEXT DEFAULT 'pending',        -- 'pending', 'completed', 'refunded', 'failed'
  used BOOLEAN DEFAULT false,           -- Has the letter been generated?
  used_at TIMESTAMPTZ,                  -- When was the letter generated?
  letter_id UUID REFERENCES public.letters(id), -- Link to generated letter
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_purchases_user_id ON public.purchases(user_id);
CREATE INDEX idx_purchases_session_id ON public.purchases(stripe_session_id);
CREATE INDEX idx_purchases_status ON public.purchases(status) WHERE status = 'completed';

-- Enable Row Level Security
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- Users can view their own purchases
CREATE POLICY "Users can view own purchases" ON public.purchases
  FOR SELECT USING (auth.uid() = user_id);

-- Only the server (service role) can insert purchases
-- This is handled by the webhook using SUPABASE_SERVICE_ROLE_KEY

-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER purchases_updated_at
  BEFORE UPDATE ON public.purchases
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Step 2: Configure Stripe in Netlify

Add these environment variables in Netlify (Site settings → Environment variables):

| Variable | Description | Where to find it |
|----------|-------------|------------------|
| `STRIPE_SECRET_KEY` | Your Stripe secret key | Stripe Dashboard → Developers → API keys |
| `STRIPE_PUBLISHABLE_KEY` | Your Stripe publishable key | Stripe Dashboard → Developers → API keys |
| `STRIPE_PRICE_ID` | The price ID for $12 NZD letter | Stripe Dashboard → Products → Your product → Price ID |
| `STRIPE_WEBHOOK_SECRET` | Webhook signing secret | Created in Step 3 |

For **TEST MODE**, your keys will start with:
- `pk_test_...` (publishable)
- `sk_test_...` (secret)

For **LIVE MODE**, they start with:
- `pk_live_...` (publishable)
- `sk_live_...` (secret)

---

## Step 3: Set Up Stripe Webhook

1. Go to **Stripe Dashboard → Developers → Webhooks**
2. Click **"Add endpoint"**
3. Enter your webhook URL:
   - `https://barryletter.com/.netlify/functions/stripe-webhook`
4. Select events to listen to:
   - `checkout.session.completed`
   - `checkout.session.expired` (optional, for logging)
5. Click **"Add endpoint"**
6. Copy the **"Signing secret"** (starts with `whsec_...`)
7. Add it to Netlify as `STRIPE_WEBHOOK_SECRET`

**For local testing**, use the Stripe CLI:
```bash
stripe listen --forward-to localhost:8888/.netlify/functions/stripe-webhook
```

---

## Step 4: Test the Payment Flow

1. Deploy your site to Netlify
2. Go to barryletter.com
3. Sign in with Google
4. Select a letter mode
5. Click "Buy Letter ($12 NZD)"
6. Use Stripe test card: `4242 4242 4242 4242`
   - Any future expiry date
   - Any 3-digit CVC
   - Any billing details
7. Complete checkout
8. You should be redirected back and see the questions

---

## Step 5: Verify Everything Works

**Check Supabase:**
```sql
SELECT * FROM public.purchases ORDER BY created_at DESC LIMIT 5;
```

**Check Stripe Dashboard:**
- Payments → View recent payments
- Webhooks → View webhook attempts

---

## Environment Variables Summary

For your `.env` file (local development):
```env
# Existing
ANTHROPIC_API_KEY=your_key
VITE_SUPABASE_URL=https://nsjpjlqtqkkgwcstpunq.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# New - Stripe
STRIPE_SECRET_KEY=sk_test_your_key
STRIPE_PUBLISHABLE_KEY=pk_test_your_key
STRIPE_PRICE_ID=price_1SueREQwVeYItV7S2oJKxqSW
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
```

---

## Going Live Checklist

Before switching to live mode:

- [ ] Test the full flow in test mode
- [ ] Verify webhook receives events
- [ ] Verify purchases table records payments
- [ ] Switch Stripe API keys to live keys
- [ ] Create new webhook endpoint for production
- [ ] Update `STRIPE_WEBHOOK_SECRET` with production signing secret
- [ ] Test with a real $12 payment (you can refund it)
- [ ] Set up GST/tax collection when accountant confirms

---

## Troubleshooting

**"Payment system not configured"**
- Check `STRIPE_SECRET_KEY` is set in Netlify environment variables
- Redeploy after adding environment variables

**"Webhook Error: No signatures found matching"**
- Your `STRIPE_WEBHOOK_SECRET` doesn't match
- Make sure you copied the signing secret from the correct webhook endpoint

**Purchase not appearing in database**
- Check Stripe webhook logs for errors
- Verify `SUPABASE_SERVICE_ROLE_KEY` is correct
- Check Supabase RLS policies

**User stuck at payment page**
- Check browser console for errors
- Verify `STRIPE_PUBLISHABLE_KEY` is correct (it's used in frontend)
