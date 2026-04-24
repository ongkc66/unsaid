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

## Key Gotchas
- **Next.js 16 params are Promises** — even in `'use client'` components, dynamic route params must be unwrapped with `React.use(params)`. Direct access (`params.code`) crashes the page silently in dev and throws in prod.
- **Playwright captures before useEffect** — `npx playwright screenshot` takes the shot before client-side data fetches complete. Always use `page.waitForFunction(() => !document.body.innerText.includes('Loading…'))` to wait for real content.
- **Supabase CLI IPv6 issue** — `supabase db query --db-url` fails on machines without IPv4 direct routing to Supabase. Apply schema via the Supabase SQL editor dashboard instead.
- **create-next-app rejects non-empty dirs** — scaffold to a temp folder (`/tmp/project-tmp`) then `cp -r` into the target directory.
- **Synthesis via internal fetch** — answers route triggers synthesis via `fetch('/api/synthesize')`. Acceptable for prototype; in production this must be a background queue to avoid blocking the answer response.
- **Client vs server Supabase client** — `lib/supabase.ts` is browser-safe (anon key only). Service-role client lives in `lib/supabase-admin.ts` and must only be imported from API routes. Top-level `createClient(url, serviceKey!)` crashes client bundles with "supabaseKey is required" because `SUPABASE_SERVICE_ROLE_KEY` is not exposed to the browser.
- **URL > localStorage for route-derived state** — components mounted in root layout (e.g. `BottomNav`) can read localStorage before a page effect writes it. When the current route contains the state you need (team code in `/team/[code]`), parse it from the pathname. Keep localStorage as a fallback for non-team routes only.
- **Navigation aborts in-flight fetches** — a button that both navigates AND submits a form will abort the POST, surfacing as a generic "Network error" in the drawer's catch. When chasing a mystery network error, check what else the click triggered. The `AnswerDrawer` catch-all still masks this — fine for the prototype, worth splitting abort vs network in prod.
- **Turbopack import-path cache** — renaming import paths (e.g. `@/lib/supabase` → `@/lib/supabase-admin`) may need `rm -rf .next` + dev server restart. HMR alone doesn't always re-resolve.
- **Attribution leaks at the metadata layer** — anonymity isn't only about scrubbing text. In small teams, showing "Synthesised from 3 answers" confirms everyone participated and makes the insight cross-referenceable. Redact counts in synthesis output; progress counts on *open* questions are explicitly allowed (named nobody).
- **Supabase Realtime needs publication membership** — subscriptions silently return no events if the table isn't in the `supabase_realtime` publication. Run `alter publication supabase_realtime add table <name>;` when creating new tables.
- **`display: inline-block` eats trailing whitespace** — putting `{' '}` inside an `inline-block` span collapses it; the space never renders. Split text with `/(\s+)/` (not `' '`) so whitespace tokens become their own plain sibling spans. Used in `InsightReveal` and the home-page preview — follow this pattern for any word-by-word reveal.
- **Skeleton cards must mirror real card structure** — generic shimmer blocks cause visible layout shift when real content loads. Match structural shape: same border style (use `border-accent/15` for insight-card skeletons, `border-white/5` for open-card skeletons), same padding, same left-bar treatment. The skeleton→content swap should feel like an in-place reveal, not a page jump.
- **Progress summary strip: only show when closedCount > 0** — rendering "0 insights ready" reads as failure. The strip appears on first synthesis and communicates momentum; before that the collecting section is self-explanatory.
- **SVG animation from 0 requires `requestAnimationFrame`** — setting animated state directly in `useEffect` doesn't give the browser time to paint the initial state (width/strokeDasharray at 0). Wrap in `requestAnimationFrame(() => setAnimated(true))` so the transition has a visible start frame.
- **`navigator.canShare?.(data)` before `navigator.share()`** — some browsers expose `share` but reject specific payloads (e.g. URLs without HTTPS in dev). Guard with `canShare` to avoid uncaught rejections; fall through to clipboard copy on failure or `AbortError`.
- **`type` imports from API routes in client components** — safe as long as it's `import type`, not a value import. Route files importing `supabaseAdmin` won't bleed into the client bundle because TS erases type-only imports at compile time.

## Deprecated Patterns
- **Wordmark-as-home nav** [RESOLVED: 24 Apr 2026] — AppHeader previously used a muted "UNSAID" wordmark as the home link. Too subtle on mobile; discoverability failed. Replaced by persistent `BottomNav` in root layout.
- **Fixed CTA button on team feed** [RESOLVED: 24 Apr 2026] — the big "Ask the team something" bottom-fixed button competed with the new BottomNav's Ask tab. Removed; empty state now has a prominent + button and Ask tab handles the rest.
- **`answerCount` prop on `InsightReveal`** [RESOLVED: 24 Apr 2026] — passed to display "Synthesised from X answers". Dropped for attribution-leak reasons; prop removed from component signature.

## Component Patterns
- Server components by default; only add `'use client'` when interactivity is needed
- Forms use native HTML form + server actions where possible
- No global state management — pass props, use URL params, or hit the API

## Styling
- Tailwind utility classes only — no custom CSS files
- **Mobile-first, always.** Design and build for 390px width first, scale up. No feature is complete until it works on mobile
- Max content width responsive: `max-w-2xl lg:max-w-5xl mx-auto` — 672px below 1024px viewports (tablets/laptops), 1024px on desktop (Linear-workspace width, fills ~70% of a 1440px monitor). Focused forms (home/auth) stay at `max-w-sm`. Compose drawer stays at `max-w-2xl` — wider textareas feel like document editors, not conversations.
- Touch targets minimum 44px height (buttons, cards, inputs)
- Bottom drawer sits above the mobile keyboard — use `pb-safe` or `env(safe-area-inset-bottom)` for notched phones
- No hover-only interactions — every interactive element must work via tap
- **Palette:** Deep midnight/indigo base (`bg-[#0D0F1A]`), warm off-white text (`text-[#F0EEE6]`), muted indigo for cards (`bg-[#13152A]`), soft indigo accent (`#6366F1`) — not zinc/slate, this is a human product not a dev tool
- **Typography:** Geist Sans for all UI; synthesis output uses `text-lg font-medium` to signal it's the main event
- **Readability floors — enforce on every page:**
  - Body / primary content: `text-base` (16px) minimum. Never `text-sm` for the main thing on a page.
  - Secondary / descriptive copy: `text-sm` (14px) minimum. Not `text-xs`.
  - Metadata, labels, badges, captions: `text-xs` (12px) floor. **NEVER** `text-[10px]` or `text-[11px]`.
  - Opacity floors on dark midnight bg: primary text = `text-cream` (no modifier). Secondary = `text-cream-muted` or `text-cream/80` at dimmest. Tertiary = `text-cream-muted/70` at dimmest. Below that you're hiding text, not de-emphasizing it.
  - Before declaring any UI task done, scan the diff for `text-xs`, `text-[10px]`, `text-[11px]`, `/30`, `/40`, `/50`, `/60` opacity modifiers and justify or upgrade each.
- **Submission UX:** Question/answer input as a bottom drawer (slides up over the feed) — keeps user feeling contained and private, not navigated away
- **Pending questions:** Styled like a sealed card; synthesis-ready questions get a subtle visual "open" state
- **Progress indicator:** Show "X of N answered" count on each open question card — safe (count only, no names), reduces drop-off anxiety
