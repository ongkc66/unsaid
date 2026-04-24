# Progress

## Current Milestone
**Milestone 1: Core flow complete** — full create → question → answer → synthesis loop working end-to-end.

## Status
- [x] Plan agreed (tech stack, data flow, build order)
- [x] CLAUDE.md + docs/ + .claude/rules/ scaffolded
- [x] Next.js project initialized + dependencies installed
- [x] Supabase project created + schema applied
- [x] GitHub public repo created (https://github.com/ongkc66/unsaid)
- [x] Static UI mockup (all 3 pages)
- [x] Team create/join API + home page wired
- [x] Question submission + Claude anonymization
- [x] Answer submission + Claude anonymization
- [x] Auto-synthesis trigger on answer threshold
- [x] Question detail page with real data
- [x] localStorage double-submit guard
- [x] Code copy button + new team share nudge
- [x] Empty state on feed + prominent + button to open drawer
- [x] Full browser flow test (user-driven)
- [x] Persistent FB-style BottomNav (Home/Feed/Ask/Insight)
- [x] Synthesis reveal animation (word-by-word fade + bloom)
- [x] Realtime subscriptions on feed + question detail
- [x] Question prompt starters in drawer
- [x] Attribution-leak fix: dropped count from synthesis reveal
- [x] Home page "see it in action" preview (IntersectionObserver, word-by-word reveal, progress bar animation)
- [x] Feed section split — insights above collecting, section labels only in mixed state
- [x] Feed progress summary strip (only when closedCount > 0)
- [x] Skeleton loading on all 4 pages (feed, question detail, insights, pulse)
- [ ] Apply `ALTER PUBLICATION supabase_realtime ADD TABLE ...` in Supabase dashboard (needed for realtime)
- [ ] Two-tab live test to verify realtime fires end-to-end
- [ ] Vercel deploy (optional for demo — skipped for now)
- [ ] Playwright demo recording (skipped for now)

## Next Task
Apply the new realtime `ALTER PUBLICATION` lines from `supabase-schema.sql` in the Supabase SQL editor, then run a two-tab test to confirm live progress + synthesis reveal transitions fire without manual refresh. After that: Vercel deploy for a live demo URL.

## Build Order
| Hour | Task | Status |
|---|---|---|
| 0:00–0:30 | Scaffold Next.js, Supabase setup, GitHub repo | ✓ Done |
| 0:30–1:15 | Team create/join flow + code share | ✓ Done |
| 1:15–2:15 | Question submission + Claude anonymization | ✓ Done |
| 2:15–3:15 | Answer submission + synthesis trigger | ✓ Done |
| 3:15–4:00 | Feed + question detail with real data | ✓ Done |
| 4:00–4:30 | UI polish, ACE review, empty state | ✓ Done |
| 4:30–5:00 | Browser test, Vercel deploy, demo recording | Pending |

## Open Questions
- Do we want a Vercel deploy for a live demo URL?
- Do we want a Playwright recording of the golden path for the submission?

## Recent Changes

**24 Apr 2026 — Full core flow shipped**
You scaffolded the entire project from zero: Next.js 14 + Supabase + Claude API. The complete loop — create team, submit question (Claude anonymizes), answer (Claude anonymizes), auto-synthesis trigger when all members answered, insight revealed — is working end-to-end and verified via API tests. UI covers home, feed, pending question, and insight pages with the midnight/indigo palette. All code pushed to GitHub (ongkc66/unsaid).

**24 Apr 2026 — Feed UX polish + skeleton loading across all pages**
You upgraded three areas of the feed page: (1) questions are now grouped into "insights ready" and "collecting" sections with accent/muted divider labels — only shown when both types coexist, so single-type feeds stay clean; (2) a progress summary strip (`N insights ready · N collecting` + segmented bar) appears above the sections as soon as the first insight lands, giving judges a one-line team readiness signal; (3) all four pages (feed, question detail, insights, pulse) now have skeleton loading states that structurally mirror the real card layouts — staggered pulse delays, accent border hints on insight-style skeletons, left-bar shape preserved on the insights page. Also shipped the home page "see it in action" preview: a static example question + synthesis reveal that plays word-by-word via IntersectionObserver when the section scrolls into view. Fixed a whitespace-collapse bug in the preview caused by putting `{' '}` inside `inline-block` spans — switched to `/(\s+)/` split so spaces render as sibling text nodes (matching the pattern already used in `InsightReveal`).

**24 Apr 2026 — Nav, reveal, realtime, starters, anonymity polish**
You replaced the subtle wordmark-as-home with a persistent FB-style BottomNav (Home/Feed/Ask/Insight) mounted in root layout. The Ask tab opens the page's drawer via a custom `unsaid:ask` event when on the team route, otherwise navigates with `?compose=1`. Empty-state now has a prominent + button. Built the synthesis reveal moment — words blur-fade in with a 55ms stagger, backed by a radial accent bloom, closing with a "Distilled from the team" divider. Wired Supabase Realtime on the feed and question detail so the "X of N answered" count, progress bar, and open→closed transition all update live. Added 4 prompt starters in the question drawer to break blank-textarea paralysis. Fixed two anonymity leaks: removed the "Synthesised from N answers" count (partial attribution risk in small teams) and kept only the neutral "Distilled from the team" line. Along the way: split `lib/supabase-admin.ts` from `lib/supabase.ts` so client components can import `supabase` without crashing on the service-role key; and traced a "Network error" on submit to a stale-localStorage race in BottomNav that made the Ask tab navigate home mid-submit — fixed by reading the team code from the URL when on `/team/[code]`.
