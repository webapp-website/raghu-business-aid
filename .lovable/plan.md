
## Scope

A TanStack Start app with 4 routes (Home, Plans, About, Chat), Google-style design, Razorpay subscription paywall gating the Chat with "Raghu" — an AI business consultant (Gemini) with image analysis + image generation, multilingual (EN/TE/HI/TA/ML), and content moderation.

## Backend (Lovable Cloud / Supabase)

Enable Cloud, then create tables:

- `profiles` (id=auth.uid, full_name, preferred_language, created_at)
- `subscriptions` (id, user_id, plan: monthly|quarterly|premium, currency: INR|USD, status: active|expired|cancelled, razorpay_order_id, razorpay_payment_id, starts_at, expires_at)
- `chat_threads` (id, user_id, title, language, created_at, updated_at)
- `chat_messages` (id, thread_id, user_id, role: user|assistant, content text, image_url text nullable, created_at)

RLS: user_id = auth.uid() on all user data. Grants for authenticated + service_role. Storage bucket `chat-uploads` (private, signed URLs).

Auth: email/password + Google via `_authenticated` managed layout. Sign-in at `/auth`.

## Secrets

- `RAZORPAY_KEY_ID` = `rzp_test_TBsbZijh4LsFW4` (set via set_secret — safe test key)
- `RAZORPAY_KEY_SECRET` = user-provided (add_secret; user already shared but I'll store securely and instruct rotation)
- `LOVABLE_API_KEY` (auto)

## Server functions & routes

- `createRazorpayOrder({ plan, currency })` — server fn, auth required. Creates Razorpay order via REST, returns order_id + amount.
- `verifyRazorpayPayment({ order_id, payment_id, signature, plan, currency })` — verifies HMAC-SHA256, inserts subscription row with computed expires_at.
- `getActiveSubscription()` — returns active sub for current user (used to gate chat UI).
- `listThreads()`, `createThread({ language })`, `deleteThread({ id })`, `getThreadMessages({ threadId })`
- `sendMessage({ threadId, text, imageDataUrl? })` — server fn:
  1. Text moderation via Gemini (classify toxic/hate/explicit) — reject with polite message.
  2. If image: image moderation via Gemini vision — reject if unsafe.
  3. Upload image to storage bucket, get signed URL.
  4. Load thread history from DB.
  5. Call `google/gemini-3-flash-preview` with Raghu system prompt (multilingual, consultant framework, legal disclaimers) + full history + optional image.
  6. Detect if response should include generated image (heuristic: model tagged `[GENERATE_IMAGE: prompt]`), then call `google/gemini-3.1-flash-image` and attach.
  7. Persist user+assistant messages, return assistant message with any generated image URL.
- `/api/public/*` not required (all internal).

## Frontend routes

- `src/routes/__root.tsx` — updated head (title "Launch Business", description, og). Google Sans font via `<link>` in root head (Product Sans not public; use "Google Sans" fallback → Inter/DM Sans). Header with logo + nav (Home/Plans/About + Sign In / Account menu). Footer with legal disclaimer link.
- `src/routes/index.tsx` — Home: hero "Meet Raghu, your AI business consultant", capsule CTA → Plans, feature highlights, multilingual note.
- `src/routes/plans.tsx` — 3 plan cards (Monthly ₹2,000, Quarterly ₹5,000, Premium ₹20,000/mo). Currency toggle INR/USD (USD prices: $24 / $60 / $240 approx — will confirm rates in code as static). "Subscribe" button opens Razorpay checkout (loads `checkout.js` in root head), on success calls verify server fn, then redirects to `/chat`.
- `src/routes/about.tsx` — company + full legal/privacy disclaimers as specified.
- `src/routes/_authenticated/route.tsx` — managed gate (integration-provided).
- `src/routes/_authenticated/chat.tsx` and `chat.$threadId.tsx` — thread list sidebar + AI Elements chat UI. Before rendering chat, check `getActiveSubscription()`; if none → show upgrade card linking to `/plans`.
- `src/routes/auth.tsx` — sign in/up with email/password + Google OAuth (via lovable broker).

## Chat UI (AI Elements)

Install: `conversation message prompt-input shimmer tool`. Composer supports image attach. Assistant messages render markdown + optional generated image. Thread list sidebar with new-thread button, language selector on thread creation. Route: `/chat` redirects to newest thread or creates one; `/chat/$threadId` for individual threads. Chat window keyed by threadId.

## Design system (Google style)

Update `src/styles.css`:
- Off-white background `oklch(0.985 0 0)` light, near-black `oklch(0.18 0 0)` dark
- Primary Google blue `oklch(0.62 0.19 258)`
- Google red/yellow/green accents for logo dots
- Radius large: `--radius: 1.5rem` (pill/capsule everywhere)
- Font: `Google Sans`, `Product Sans`, `Inter`, system-ui
- Custom button variant `pill` (default) — high border-radius, subtle shadow

All buttons/inputs/tags = capsule.

## Multilingual & Raghu system prompt

System prompt (server-side, English) instructs Raghu to:
- Detect user's language from their message; respond in same language among EN/TE/HI/TA/ML.
- Ask clarifying questions before advising.
- Analyze images when provided.
- Emit `[GENERATE_IMAGE: <prompt>]` on its own line when a visual would help.
- Refuse toxic/explicit inputs.
- Append short disclaimer.

## Moderation

Lightweight: send input to `gemini-3.1-flash-lite` with JSON output `{safe: bool, reason: string}`. Same for images (vision).

## Delivery order

1. Enable Cloud, store secrets, run migration.
2. Design system + root head + header/footer.
3. Home, Plans, About pages.
4. Auth page + Google provider config.
5. Razorpay server fns + checkout wiring on Plans.
6. Chat: server fns, threads, AI Elements UI, image handling, image generation, moderation.
7. Verify build, smoke test.

## Notes / assumptions

- Razorpay test secret you pasted will be stored securely — please rotate it in the Razorpay dashboard afterwards since it appeared in chat.
- USD prices are approximate static conversions (will use $24/$60/$240) — tell me if you want different USD amounts.
- No Razorpay recurring subscriptions API used (test mode); each purchase creates a fixed-period subscription row. Renewal = new purchase.
- SMS/OTP auth not included (not requested).
