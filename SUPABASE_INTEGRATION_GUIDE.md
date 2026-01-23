# Supabase Integration Guide for Letter to You

## Overview

This guide walks you through adding Supabase to your Letter to You app for:
1. **User Authentication** (email/password + magic link)
2. **Letter to Future Self** (scheduled delivery)
3. **Weekly Check-in System** (progress tracking)

---

## Part 1: Supabase Project Setup

### Step 1: Create Supabase Account & Project

1. Go to [supabase.com](https://supabase.com) and sign up
2. Click "New Project"
3. Choose your organization (or create one)
4. Fill in:
   - **Name:** `letter-to-you`
   - **Database Password:** (save this somewhere safe!)
   - **Region:** Choose closest to your users
5. Click "Create new project" (takes ~2 minutes)

### Step 2: Get Your API Keys

Once your project is ready:
1. Go to **Settings → API**
2. Copy these values (you'll need them):
   - `Project URL` (e.g., `https://xxxx.supabase.co`)
   - `anon public` key (safe for frontend)
   - `service_role` key (NEVER expose in frontend - for Netlify Functions only)

### Step 3: Add Environment Variables

**Local Development (`.env` file):**
```env
# Existing
ANTHROPIC_API_KEY=your_anthropic_key

# New - Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

**Netlify Dashboard:**
1. Go to Site settings → Environment variables
2. Add all three Supabase variables

> **Important:** `VITE_` prefix makes variables available in frontend code. The service role key should NOT have this prefix.

---

## Part 2: Database Schema

Run this SQL in Supabase SQL Editor (Dashboard → SQL Editor → New query):

```sql
-- =====================================================
-- USERS PROFILE (extends Supabase auth.users)
-- =====================================================
CREATE TABLE public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  display_name TEXT,
  timezone TEXT DEFAULT 'America/New_York',
  weekly_checkin_day INTEGER DEFAULT 0, -- 0=Sunday, 1=Monday, etc.
  weekly_checkin_time TIME DEFAULT '09:00:00',
  email_notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- LETTERS (stores all generated letters)
-- =====================================================
CREATE TABLE public.letters (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Letter content
  mode TEXT NOT NULL, -- 'general', 'relationship', 'career', 'transition', 'life-event'
  life_event_type TEXT, -- 'new-job', 'relationship-end', 'grief', etc.
  tone TEXT DEFAULT 'warm', -- 'warm', 'direct', 'motivating'
  questions JSONB, -- array of {question, answer} objects
  letter_content TEXT NOT NULL,
  
  -- Future self feature
  is_future_letter BOOLEAN DEFAULT false,
  delivery_date TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  delivery_status TEXT DEFAULT 'immediate', -- 'immediate', 'scheduled', 'delivered', 'failed'
  
  -- Metadata
  word_count INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- WEEKLY CHECK-INS
-- =====================================================
CREATE TABLE public.checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Check-in content
  mood_rating INTEGER CHECK (mood_rating >= 1 AND mood_rating <= 10),
  energy_level INTEGER CHECK (energy_level >= 1 AND energy_level <= 10),
  
  -- Reflection questions
  wins TEXT, -- "What went well this week?"
  challenges TEXT, -- "What was difficult?"
  gratitude TEXT, -- "What are you grateful for?"
  focus_next_week TEXT, -- "What's your focus for next week?"
  
  -- Optional: AI-generated insight
  ai_reflection TEXT,
  
  -- Metadata
  week_number INTEGER, -- ISO week number
  year INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent duplicate check-ins per week
  UNIQUE(user_id, year, week_number)
);

-- =====================================================
-- SCHEDULED EMAILS (for future letter delivery)
-- =====================================================
CREATE TABLE public.scheduled_emails (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  letter_id UUID REFERENCES public.letters(id) ON DELETE CASCADE,
  
  scheduled_for TIMESTAMPTZ NOT NULL,
  status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================
CREATE INDEX idx_letters_user_id ON public.letters(user_id);
CREATE INDEX idx_letters_delivery_date ON public.letters(delivery_date) WHERE is_future_letter = true;
CREATE INDEX idx_checkins_user_id ON public.checkins(user_id);
CREATE INDEX idx_checkins_created ON public.checkins(created_at DESC);
CREATE INDEX idx_scheduled_emails_pending ON public.scheduled_emails(scheduled_for) WHERE status = 'pending';

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_emails ENABLE ROW LEVEL SECURITY;

-- Profiles: users can only access their own
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Letters: users can only access their own
CREATE POLICY "Users can view own letters" ON public.letters
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own letters" ON public.letters
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own letters" ON public.letters
  FOR DELETE USING (auth.uid() = user_id);

-- Check-ins: users can only access their own
CREATE POLICY "Users can view own checkins" ON public.checkins
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkins" ON public.checkins
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own checkins" ON public.checkins
  FOR UPDATE USING (auth.uid() = user_id);

-- Scheduled emails: users can view their own
CREATE POLICY "Users can view own scheduled emails" ON public.scheduled_emails
  FOR SELECT USING (auth.uid() = user_id);

-- =====================================================
-- AUTO-CREATE PROFILE ON SIGNUP
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Get current ISO week number
CREATE OR REPLACE FUNCTION get_iso_week(ts TIMESTAMPTZ DEFAULT NOW())
RETURNS INTEGER AS $$
  SELECT EXTRACT(WEEK FROM ts)::INTEGER;
$$ LANGUAGE SQL;

-- Check if user has completed this week's check-in
CREATE OR REPLACE FUNCTION has_completed_weekly_checkin(p_user_id UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.checkins
    WHERE user_id = p_user_id
    AND year = EXTRACT(YEAR FROM NOW())::INTEGER
    AND week_number = get_iso_week(NOW())
  );
$$ LANGUAGE SQL SECURITY DEFINER;
```

---

## Part 3: Authentication Setup

### Enable Email Auth in Supabase

1. Go to **Authentication → Providers**
2. Ensure **Email** is enabled
3. Configure settings:
   - ✅ Enable email confirmations (recommended)
   - ✅ Enable email change confirmations
   - Set **Site URL** to `https://barry-letter.netlify.app`
   - Add **Redirect URLs:**
     - `https://barry-letter.netlify.app/auth/callback`
     - `http://localhost:5173/auth/callback` (for local dev)

### Email Templates (Optional but Recommended)

Go to **Authentication → Email Templates** and customize:
- **Confirm signup** - Welcome email
- **Magic Link** - Passwordless login
- **Reset Password** - Password recovery

---

## Part 4: Install Dependencies

Run in your project folder:

```bash
npm install @supabase/supabase-js
```

---

## Part 5: File Structure

After integration, your project will look like:

```
letter-to-you/
├── config/
│   └── questions.js
├── netlify/
│   └── functions/
│       ├── generate-letter.js
│       ├── save-letter.js          # NEW
│       ├── get-letters.js          # NEW
│       ├── save-checkin.js         # NEW
│       ├── get-checkins.js         # NEW
│       └── send-scheduled-email.js # NEW (for cron)
├── src/
│   ├── lib/
│   │   └── supabase.js            # NEW - Supabase client
│   ├── hooks/
│   │   └── useAuth.js             # NEW - Auth hook
│   ├── components/
│   │   ├── Auth/
│   │   │   ├── LoginForm.jsx      # NEW
│   │   │   ├── SignupForm.jsx     # NEW
│   │   │   └── AuthCallback.jsx   # NEW
│   │   ├── FutureLetter/
│   │   │   └── FutureLetterForm.jsx # NEW
│   │   ├── Checkin/
│   │   │   ├── WeeklyCheckin.jsx  # NEW
│   │   │   └── CheckinHistory.jsx # NEW
│   │   └── Dashboard/
│   │       └── UserDashboard.jsx  # NEW
│   ├── App.jsx
│   ├── main.jsx
│   └── styles.css
├── .env
├── index.html
├── netlify.toml
├── package.json
└── vite.config.js
```

---

## Next Steps

The following files are provided in this setup package:

1. `src/lib/supabase.js` - Supabase client initialization
2. `src/hooks/useAuth.js` - Authentication React hook
3. `src/components/Auth/LoginForm.jsx` - Login component
4. `src/components/Auth/SignupForm.jsx` - Signup component
5. `src/components/FutureLetter/FutureLetterForm.jsx` - Future letter scheduling
6. `src/components/Checkin/WeeklyCheckin.jsx` - Weekly check-in form
7. `netlify/functions/save-letter.js` - Save letters to database
8. `netlify/functions/send-scheduled-email.js` - Email delivery function
9. Updated `netlify.toml` with scheduled function config

---

## Scheduled Email Delivery

For the "Letter to Future Self" feature, you'll need to set up a scheduled function. Netlify supports cron jobs:

In `netlify.toml`:
```toml
[functions."send-scheduled-email"]
schedule = "0 * * * *"  # Runs every hour
```

This function checks for letters due for delivery and sends them via your email provider (Resend, SendGrid, etc.).

---

## Questions?

Common issues:
- **"Invalid API key"** - Check your env variables match exactly
- **"RLS policy violation"** - Make sure user is authenticated before database operations
- **"Email not sending"** - Check Supabase email settings and rate limits

