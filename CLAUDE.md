# Barry Letter — Project Context for Claude Code

## What Is This

Barry Letter is a self-reflection tool that generates personalized letters. Users answer guided interview questions about their life situation, and the app generates a 600-1,200 word letter using Claude API. The letters help people process career changes, relationship transitions, and other pivotal moments.

Live at: https://barryletter.com
GitHub: https://github.com/sturner103/letter-to-you
Local path: C:\Users\sturn\OneDrive\Barry Letter V2

## Tech Stack

- Frontend: React 18 + Vite 5 (single-page app)
- Auth: Supabase (Google OAuth, email/password)
- Database: Supabase (Postgres with RLS)
- Payments: Stripe Checkout ($12 NZD per letter)
- AI: Anthropic Claude API (letter generation via Netlify function)
- Hosting: Netlify (auto-deploys from GitHub main branch)
- DNS: Cloudflare
- Analytics: Plausible (privacy-focused)
- Custom auth domain: auth.barryletter.com (Supabase Pro)

## Project Structure

```
Barry Letter V2/
├── config/
│   └── questions.js          # All interview questions, modes, safety detection
├── netlify/
│   └── functions/
│       ├── create-checkout-session.js   # Creates Stripe Checkout session
│       ├── stripe-webhook.js            # Handles Stripe payment confirmation
│       ├── verify-purchase.js           # Verifies purchase status
│       ├── mark-purchase-used.js        # Marks purchase used after generation
│       ├── generate-letter.js           # Claude API letter generation
│       ├── save-letter.js               # Server-side letter save (bypasses RLS)
│       ├── store-session.js             # Backs up auth session before Stripe redirect
│       ├── restore-session.js           # Restores auth session after Stripe return
│       ├── set-checkout-cookie.js       # Sets userId cookie before Stripe redirect
│       ├── email-letter.js              # Emails letter to user
│       ├── compare-letters.js           # AI comparison of two letters
│       ├── generate-checkin-reflection.js
│       └── send-scheduled-emails.js     # Cron: sends future-dated letters
├── src/
│   ├── App.jsx               # Main app (~2200 lines, all views and logic)
│   ├── main.jsx              # Entry point with OAuth + session restore
│   ├── styles.css            # Base styles
│   ├── styles-additions.css  # Additional styles (payment modal, etc.)
│   ├── auth-styles.css       # Auth modal styles
│   ├── lib/
│   │   └── supabase.js       # Supabase client config
│   ├── hooks/
│   │   └── useAuth.jsx       # Auth context provider
│   └── components/
│       ├── Auth/AuthModal.jsx
│       ├── Legal/LegalPage.jsx
│       ├── CookieNotice/CookieNotice.jsx
│       ├── Checkin/
│       └── FutureLetter/
├── netlify.toml              # Build config, redirects, headers
├── package.json
└── index.html
```

## Supabase Tables (existing)

- **profiles** — user profile data (id, display_name, etc.)
- **letters** — generated letters (user_id, mode, tone, questions, letter_content, word_count, delivery_status)
- **purchases** — payment records (user_id, letter_mode, mode_name, amount, currency, stripe_session_id, stripe_payment_intent, status, used, used_at, letter_id)
- **session_backups** — server-side auth session storage for surviving Stripe redirects
- **checkins** — weekly check-in reflections

All tables have RLS enabled. Netlify functions use SUPABASE_SERVICE_ROLE_KEY to bypass RLS when needed.

## Environment Variables

Frontend (VITE_ prefix, exposed to browser):
- VITE_SUPABASE_URL
- VITE_SUPABASE_ANON_KEY

Server-side only (Netlify functions):
- SUPABASE_SERVICE_ROLE_KEY
- ANTHROPIC_API_KEY
- STRIPE_SECRET_KEY
- STRIPE_WEBHOOK_SECRET
- STRIPE_PRICE_ID

These are configured in Netlify dashboard → Site settings → Environment variables.

## Current Payment Flow (LIVE — what's deployed now)

```
User browses letter types
  → Clicks a letter type
  → Signs in (Google OAuth)
  → Payment gate modal appears ($12 NZD)
  → Redirects to Stripe Checkout
  → Returns to site
  → Payment verified → questions unlock
  → Answers questions → selects tone
  → Letter generates and saves
```

Payment happens BEFORE the user sees any questions.

## Key Architecture Decisions

- One payment = one letter. No free tier, no free rewrites.
- "Change Tone" exists but is the only post-generation option.
- Compare Letters feature exists (marked Beta).
- Quick Letter was removed.
- detectSessionInUrl is disabled in Supabase config to avoid Stripe redirect conflicts. OAuth tokens are processed manually in main.jsx.
- Session backup/restore system exists because Chrome's Bounce Tracking Mitigations can wipe localStorage during Stripe redirect. Before redirect: session saved server-side + userId cookie set. After return: session restored from server.

## Known Gotchas

1. **Chrome Bounce Tracking Mitigations** — Chrome can classify the Stripe redirect as a tracking bounce and wipe all site storage. The store-session/restore-session/set-checkout-cookie functions exist specifically to handle this. Any new redirect flow MUST save state server-side before redirecting.

2. **Auth race conditions** — After Stripe return, the auth session may not be ready when React mounts. The verifyPaymentReturn function does NOT require auth — it gets userId from Stripe session metadata or the bl_uid cookie. The `isReturningFromPayment` flag prevents premature redirects.

3. **Supabase detectSessionInUrl: false** — This is intentional. Stripe returns with URL params that Supabase would misinterpret as OAuth tokens. OAuth is handled manually in main.jsx instead.

4. **www vs non-www** — netlify.toml forces redirect from www to non-www to prevent session split.

---

## PENDING CHANGE: Move Payment Gate to After Questions

### What and Why

We want to change the payment gate from before questions to after. The user should be able to browse letter types, sign in, answer all the interview questions, and THEN pay before seeing their generated letter. This increases conversion because by the time they've spent 15 minutes answering deeply personal questions, the $12 feels like nothing.

### New Flow

```
User browses letter types
  → Clicks a letter type
  → Signs in (Google OAuth) — still required before questions
  → Answers all questions + selects tone
  → "Continue to payment" button (instead of "Generate letter")
  → Answers saved to Supabase (draft_answers table)
  → Payment gate modal appears
  → Redirects to Stripe Checkout
  → Returns to site
  → Draft answers restored from Supabase
  → Letter auto-generates and saves
```

### What Needs to Change

#### 1. New Supabase Table: draft_answers

Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE IF NOT EXISTS draft_answers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode text NOT NULL,
  answers jsonb DEFAULT '{}'::jsonb,
  follow_up_open jsonb DEFAULT '{}'::jsonb,
  follow_up_answers jsonb DEFAULT '{}'::jsonb,
  tone text DEFAULT 'youdecide',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, mode)
);

ALTER TABLE draft_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own drafts"
  ON draft_answers FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own drafts"
  ON draft_answers FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own drafts"
  ON draft_answers FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own drafts"
  ON draft_answers FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_draft_answers_user_mode
  ON draft_answers(user_id, mode);
```

#### 2. New Netlify Functions

**save-draft-answers.js** — Saves user's answers to draft_answers table before Stripe redirect. Uses UPSERT (one draft per user per mode). Called when user clicks "Continue to payment" on the last question.

**get-draft-answers.js** — Retrieves saved answers after payment return. Also supports DELETE to clean up after letter generation. Called by verifyPaymentReturn after payment is confirmed.

#### 3. App.jsx Changes

**startInterview()** — Remove payment gate. Authenticated users go straight to questions. If not authenticated, show auth modal, then navigate to questions after sign-in.

**Remove interview route guard** — The useEffect that redirects unpaid users away from /write/:mode should be removed. Questions are now free to access after auth.

**goNext() on last question** — Instead of calling generateLetter() directly:
  - If user has an existing verified purchase → generate immediately
  - Otherwise → call saveDraftAndShowPayment() which saves answers to Supabase and shows the payment gate modal

**New function: saveDraftAndShowPayment()** — Saves answers/followUpOpen/followUpAnswers/tone to draft_answers via the new Netlify function, then shows payment gate.

**verifyPaymentReturn()** — After verifying payment, automatically restore draft answers and generate the letter (instead of just unlocking questions). Show "Payment confirmed — writing your letter..." overlay.

**New function: restoreDraftAndGenerate()** — Fetches draft from Supabase, rebuilds Q&A data, calls generate-letter, saves letter, marks purchase used, cleans up draft. This is called by verifyPaymentReturn after successful verification.

**Payment gate modal** — Update copy from "You're about to begin a guided reflection..." to "Your answers have been saved. Complete payment to generate your personalized letter." Button text: "Unlock your letter →"

**AuthModal onClose** — After auth, navigate to questions (not show payment gate).

**Interview UI** — Add a subtle notice banner at the top of every question: "Payment of $12 NZD is required to receive your letter after completing the questions."

**Last question button** — Text changes from "Generate letter" to "Continue to payment" (unless user already has a verified purchase, then keep "Generate letter").

#### 4. CSS Addition

Add `.interview-payment-notice` styles to styles-additions.css — a warm-toned banner with subtle border.

#### 5. No Changes Needed To

- create-checkout-session.js (redirect URLs still work)
- stripe-webhook.js (purchase creation unchanged)
- verify-purchase.js (verification logic unchanged)
- mark-purchase-used.js (marking logic unchanged)
- Stripe configuration (no env var changes)
- netlify.toml

### Testing Plan

1. Run the Supabase migration
2. Create a feature branch (e.g. pay-after-questions)
3. Make all code changes on the branch
4. Push branch → Netlify creates branch deploy
5. Test the full flow with Stripe test mode:
   - Browse → pick letter type → sign in → answer questions → see payment notice throughout
   - On last question, button says "Continue to payment"
   - Click → answers saved → payment modal appears
   - Pay with test card (4242 4242 4242 4242) → Stripe redirect
   - Return → "Payment confirmed — writing your letter..." → letter appears
   - Check: letter saved to account, purchase marked used, draft cleaned up
6. Test edge cases:
   - Abandon at payment modal (answers should persist in draft_answers)
   - Close browser during Stripe checkout, come back later
   - Chrome incognito (bounce tracking mitigation scenario)
7. Merge to main when satisfied

## Style and Formatting Preferences

- No dark themes
- Text left-aligned (including headers)
- Tight sections, minimal whitespace
- Data callouts where interesting
