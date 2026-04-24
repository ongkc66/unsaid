# Conventions

## File Structure
- All Claude prompt functions go in `lib/claude.ts` — no prompt strings in route handlers or components
- Supabase client setup lives in `lib/supabase.ts`
- API routes follow Next.js App Router convention: `app/api/[resource]/route.ts`
- Components are in `components/` — flat, no subfolders unless count exceeds 10

## Naming
- Components: PascalCase (e.g. `QuestionCard.tsx`)
- Utilities and lib files: camelCase (e.g. `claude.ts`)
- Database columns: snake_case (matches Supabase default)
- API response keys: camelCase (converted from snake_case at the API boundary)

## Data Handling
- Never pass raw user input to the database — always anonymize via Claude first
- Claude functions in lib/claude.ts always return `string` or throw — no null returns
- Store only what's needed: no user IDs, no IP addresses, no session data

## Claude API Usage
- Model: claude-sonnet-4-6
- All prompts are in lib/claude.ts as named exported functions
- Prompts use system + user message pattern
- Keep prompts short and directive — no chain-of-thought for anonymization

## Component Patterns
- Server components by default; only add `'use client'` when interactivity is needed
- Forms use native HTML form + server actions where possible
- No global state management — pass props, use URL params, or hit the API

## Styling
- Tailwind utility classes only — no custom CSS files
- **Mobile-first, always.** Design and build for 390px width first, scale up. No feature is complete until it works on mobile
- Max content width `max-w-lg mx-auto` — keeps it readable on desktop without a separate layout
- Touch targets minimum 44px height (buttons, cards, inputs)
- Bottom drawer sits above the mobile keyboard — use `pb-safe` or `env(safe-area-inset-bottom)` for notched phones
- No hover-only interactions — every interactive element must work via tap
- **Palette:** Deep midnight/indigo base (`bg-[#0D0F1A]`), warm off-white text (`text-[#F0EEE6]`), muted indigo for cards (`bg-[#13152A]`), soft indigo accent (`#6366F1`) — not zinc/slate, this is a human product not a dev tool
- **Typography:** Geist Sans for all UI; synthesis output uses `text-lg font-medium` to signal it's the main event
- **Submission UX:** Question/answer input as a bottom drawer (slides up over the feed) — keeps user feeling contained and private, not navigated away
- **Pending questions:** Styled like a sealed card; synthesis-ready questions get a subtle visual "open" state
- **Progress indicator:** Show "X of N answered" count on each open question card — safe (count only, no names), reduces drop-off anxiety
