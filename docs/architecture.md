# Architecture

## System Overview
Unsaid is a Next.js web app with no user authentication. Teams are identified by a 6-character code. All sensitive processing (anonymization, synthesis) happens server-side via Claude before anything touches the database.

## Data Flow

### Question Submission
User types question (raw)
→ POST /api/questions
→ Claude rewrites (anonymize-question prompt)
→ Anonymized text stored in `questions` table
→ Raw input discarded

### Answer Submission
User types answer (raw)
→ POST /api/answers
→ Claude rewrites (anonymize-answer prompt)
→ Anonymized text stored in `answers` table, question.answer_count incremented
→ Raw input discarded
→ If answer_count >= team.member_count → trigger synthesis immediately
→ Double-submission guard: answered question IDs stored in localStorage (no auth, trusted team model)

### Synthesis
Triggered automatically when answer threshold met
→ POST /api/synthesize
→ All anonymized answers fetched
→ Claude synthesizes into team-level insight
→ Insight stored in `synthesis` table
→ Question status updated to 'closed'

## Database Schema

```sql
teams (
  id uuid primary key,
  code char(6) unique not null,
  name text,
  member_count int not null,         -- soft threshold for synthesis trigger
  created_at timestamptz default now()
)

questions (
  id uuid primary key,
  team_id uuid references teams(id),
  anonymized_text text not null,
  status text default 'open',        -- 'open' | 'closed'
  answer_count int default 0,        -- denormalised; increment on answer insert
  created_at timestamptz default now()
)

answers (
  id uuid primary key,
  question_id uuid references questions(id),
  anonymized_text text not null,
  created_at timestamptz default now()
)

synthesis (
  id uuid primary key,
  question_id uuid references questions(id),
  insight_text text not null,
  created_at timestamptz default now()
)
```

## API Routes
| Route | Method | Purpose |
|---|---|---|
| /api/team | POST | Create team |
| /api/team | GET | Join team by code |
| /api/team/pulse | GET | Activity heatmap + question counts (total, closed, AI-seeded) |
| /api/team/insights | GET | All closed questions + synthesis, sorted newest first |
| /api/team/suggestions | GET | Suggestions from all closed questions, grouped by question |
| /api/questions | POST | Submit + anonymize question |
| /api/questions | GET | Fetch questions for a team |
| /api/answers | POST | Submit + anonymize answer; trigger synthesis if threshold met |
| /api/synthesize | POST | Run Claude synthesis, store insight |

## Pages
- `/` — Create or join a team
- `/team/[code]` — Question feed; bottom drawer for submitting a question; after team creation show code + copy button immediately
- `/team/[code]/question/[id]` — Answer a question (bottom drawer); view synthesis when ready
- `/team/[code]/insights` — Insights gallery: all closed questions with full insight text, themes, timestamp, suggestions teaser
- `/team/[code]/pulse` — Team reflection layer: team summary, recurring theme chart, completion ring, question origin stat, what-to-try tracker, activity heatmap

## Decision Log
- **[24 Apr 2026] Synthesis triggered via internal fetch from answers route.** Why: simplest path for prototype — no queue infra needed. Alternatives rejected: background job (too complex), cron (overkill). Tradeoff: answer submission response blocks while Claude synthesizes (~3–5s). Acceptable at demo scale.
- **[24 Apr 2026] `GET /api/questions/[id]` added as dynamic route.** Why: question detail page needs to fetch a single question by ID. Alternatives: fetch full list and filter client-side (wasteful). Tradeoff: one extra route file.
- **[24 Apr 2026] `GET /api/synthesize` added alongside POST.** Why: question detail page needs to fetch the insight after the question closes. Clean separation of concerns.
- **[24 Apr 2026] Persistent `BottomNav` in root layout (FB-style).** Why: subtle wordmark-as-home nav failed discoverability on mobile — user literally couldn't find it. Bottom tab bar is an unmistakable mobile affordance. Alternatives rejected: top-bar icon cluster (still ambiguous), high-contrast wordmark (didn't solve "is this tappable?"). Tradeoff: only 2 real routes, so Ask is a "virtual" tab that dispatches an event, and Insight redirects to the most recent closed question.
- **[24 Apr 2026] Cross-component drawer trigger via `window.dispatchEvent('unsaid:ask')`.** Why: global `BottomNav` needs to open a page-local drawer without prop drilling or a global store. Alternatives rejected: React Context (boilerplate), URL param (breaks back-button semantics on team page). Tradeoff: not type-safe — contract is a string.
- **[24 Apr 2026] Split service-role Supabase client into `lib/supabase-admin.ts`.** Why: eagerly instantiating `supabaseAdmin` at module top-level crashed client bundles (service role key not in browser env). Alternatives: lazy singleton (more code), dynamic import (runtime cost). Tradeoff: discipline needed — don't import `supabase-admin` from client components.
- **[24 Apr 2026] URL is authoritative team-code source in `BottomNav`.** Why: localStorage reads raced against team-page writes, causing the Ask tab to navigate to `/` mid-submit and abort the POST (visible to user as "Network error"). Parse from `pathname` when on `/team/[code]`; localStorage is fallback only for non-team routes. Tradeoff: nav knows about route shape.
- **[24 Apr 2026] Supabase Realtime subscriptions on feed + question detail.** Why: feed progress and synthesis-ready transitions should feel alive during the demo without manual refresh. Alternatives rejected: polling (wasteful), SSE (more infra). Tradeoff: requires `supabase_realtime` publication membership — easy to forget when adding new tables.
- **[24 Apr 2026] Dropped answer count from synthesis reveal.** Why: "Synthesised from N answers" in a small team confirms participation and enables partial attribution when combined with the insight text. Replaced with "Distilled from the team". Tradeoff: loses a small grounding signal; accepted because anonymity trumps.
- **[24 Apr 2026] BottomNav expanded to 4 tabs: Home / Feed / Insights / Pulse.** Why: Insights gallery is a primary destination — burying it in the feed (scroll + tap closed cards) meant judges wouldn't discover the product's accumulated value. Alternatives rejected: link from Pulse only (too hidden), 3-tab with Insights folded into Pulse (too cluttered). Tradeoff: 4 tabs at 25% width each is tight on 320px devices but acceptable on 390px+.
- **[24 Apr 2026] Native share via `navigator.share()` with clipboard fallback in AppHeader.** Why: code-only copy forced verbal/manual sharing on demo day — highest friction point for judges joining live. Share link = full join URL (`/team/[CODE]`), not just the code. Alternatives rejected: QR code (too complex for 15 min), custom share modal (unnecessary given native sheet). Tradeoff: `navigator.share` unavailable on desktop; clipboard copy of full URL is the fallback.
- **[24 Apr 2026] Pulse API extended to return counts alongside activity days.** Why: completion ring and question origin stat need total/closed/AI question counts — adding three `count: 'exact', head: true` queries to the existing pulse route avoids a new endpoint and keeps all team-stat fetching in one call. Tradeoff: pulse route now does 5 queries; acceptable at demo scale.
- **[24 Apr 2026] Feed section split — closed (insights) above open (collecting), section labels only in mixed state.** Why: flat feed forces judges to scan all cards to understand team state; grouped sections communicate the product loop at a glance. Alternatives rejected: collapsible sections (over-engineered at 3–8 card scale, risks hiding insights behind a closed section). Tradeoff: section labels only appear when both types coexist — single-type feeds stay clean.
- **[24 Apr 2026] Progress summary strip above feed sections.** Why: judges need a one-line team readiness signal before reading individual cards. Strip appears only once `closedCount > 0` (first synthesis moment); before that the feed is self-explanatory. Tradeoff: strip is always-visible (not sticky), scrolls away — intentional; it's a quick-read element, not a persistent indicator.
- **[24 Apr 2026] Home page "see it in action" preview with IntersectionObserver trigger.** Why: judges hit the home page cold and don't know what synthesis output looks like. Static preview card (fake data, clearly labelled) shows the reveal before they create a team. IntersectionObserver fires the word-by-word reveal + progress bar animation on scroll-into-view. Tradeoff: one extra re-render from the Intersection Observer callback; negligible.
- **[24 Apr 2026] Theme frequency, completion ring, question origin stats added to Pulse page.** Why: Pulse was observation-only (heatmap + summary). Charts make it diagnostic — a team can see what they keep circling (themes), how engaged they are (ring), and how much of their thinking was AI-nudged vs. self-initiated (origin). Tradeoff: Pulse page now fetches 4 parallel endpoints on load; all are fast count/select queries.

## Quality Signals
| Area | Status | Last checked |
|---|---|---|
| API error handling | 🟡 `AnswerDrawer` catch still says "Network error" for aborts + HTTP errors; spot-checked this session — masked the real Ask-tab navigation bug. Distinguishing error classes is worth it if we harden | 24 Apr 2026 |
| Claude prompt robustness | 🟡 Works but not tested with adversarial input | 24 Apr 2026 |
| Mobile layout | 🟢 Tested at 390px, safe-area padding in place; BottomNav clears notched bottom | 24 Apr 2026 |
| Full E2E flow | 🟢 Create → question → 3 answers → synthesis verified; user-tested this session | 24 Apr 2026 |
| Double-submit guard | 🟢 localStorage implemented | 24 Apr 2026 |
| Attribution-leak audit | 🟢 Count removed from synthesis reveal; open-state "X of N" allowed per rules | 24 Apr 2026 |
| Realtime reliability | 🟡 Wired but not battle-tested with two live clients; requires `ALTER PUBLICATION` applied in Supabase dashboard | 24 Apr 2026 |
| Synthesis reveal UX | 🟢 Word-by-word blur-fade reveal + bloom glow + divider — verified via Playwright capture | 24 Apr 2026 |
| Pulse page charts | 🟢 Theme frequency bars, completion ring, question origin stat — all wired to live data, TypeScript clean | 24 Apr 2026 |
| Insights gallery | 🟢 `/team/[code]/insights` with accent left-bar cards, realtime-subscribed, 4th nav tab | 24 Apr 2026 |
| Share/invite UX | 🟢 Native share sheet on mobile, clipboard URL fallback on desktop; AbortError handled | 24 Apr 2026 |
| Loading states | 🟢 Skeleton cards on all 4 pages (feed, question detail, insights, pulse) — structurally mirror real cards, staggered pulse delays | 24 Apr 2026 |
| Home page preview | 🟢 "See it in action" preview with IntersectionObserver-triggered reveal; whitespace split bug fixed | 24 Apr 2026 |
| Feed UX | 🟢 Section split (insights/collecting), progress summary strip, skeleton loading all shipped | 24 Apr 2026 |

## Key Architectural Decisions
See @docs/decisions.md for rationale behind major choices.
