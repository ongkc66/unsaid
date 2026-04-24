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
- [x] Empty state on feed
- [ ] Full browser flow test (user-driven)
- [ ] Vercel deploy (optional for demo)
- [ ] Playwright demo recording

## Next Task
User to test full flow in browser: create team → share code → answer from two tabs → watch synthesis trigger.
Then: optional Vercel deploy + Playwright demo recording.

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
