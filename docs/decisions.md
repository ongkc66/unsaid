# Decisions

## No user authentication
**Decision:** Teams are identified by a 6-character join code. No login, no accounts.
**Why:** Lowest friction for hackathon demo; auth would add 1–2 hours of build time with no UX benefit for the core concept. Anonymity is handled at the data level (Claude rewrites), not the identity level.
**Trade-off:** No access control — anyone with the code can join. Acceptable for small, trusted teams.

## Raw inputs never stored
**Decision:** Claude anonymizes all input server-side before anything is written to the database.
**Why:** Core trust proposition of the product. If raw text ever leaked, the tool's entire value (psychological safety) collapses.
**Trade-off:** No ability to audit or recover original intent if Claude mistranslates meaning.

## Synthesis only — no individual answer display
**Decision:** Users only ever see the Claude-synthesized team insight, never individual answers.
**Why:** In a 3-person team, showing even anonymized individual answers makes attribution trivial. Synthesis is the only safe output format at this team size.
**Trade-off:** Loses nuance and outlier opinions. Accepted — the goal is team-level understanding, not individual tracking.

## AI decoy answers injected
**Decision:** Claude generates 1–2 plausible filler *answers* to mix into the pool before synthesis.
**Why:** Decoy answers break the "2 of 3 answered = I know who said what" problem.
**Trade-off:** Slightly dilutes synthesis quality. Prompts instruct Claude to weight real answers over decoys.

## AI-seeded questions (reversed 24 Apr 2026)
**Decision:** Claude generates seed *questions* on three triggers: team creation (cold start), synthesis close (momentum), and feed GET when no open questions exist (quiet-team fallback). Seeded rows carry `is_ai_generated = true` and render with a "From Unsaid" sparkle badge — never disguised as a teammate.
**Why:** Empty feeds kill the core loop. Activity-driven triggers (not cron) pace nudges to real team usage — active teams get more prompts, quiet teams don't get spammed. No background infra needed.
**Trade-off:** Every team-creation and synthesis-close now pays one extra Claude call (~1–2 s). Acceptable at demo scale; in production both should be fire-and-forget via a queue.
**Reverses:** the earlier "AI-generated questions cut from MVP" decision — purpose-alignment (surfacing unsaid things) outweighed the complexity concern.

## Supabase over PlanetScale / Railway Postgres
**Decision:** Supabase for the database layer.
**Why:** Free tier, built-in realtime subscriptions, instant REST API, and a UI for schema management — faster for hackathon pace.

## Synthesis trigger: check on answer submission, no cron
**Decision:** After every answer insert, check if `answer_count >= team.member_count`. If yes, fire synthesis inline.
**Why:** No background jobs, no cron infra needed — keeps the prototype simple. Acceptable latency for a 5-hour build.
**Trade-off:** If synthesis Claude call is slow, the answer submission response blocks. Acceptable for demo scale.

## Midnight/indigo palette over zinc/slate
**Decision:** `#0D0F1A` base, `#F0EEE6` text, `#6366F1` accent.
**Why:** This is a product about psychological safety and vulnerability — zinc feels like a dev tool dashboard. The palette should feel intimate and calm.
**Trade-off:** Slightly unconventional for a Next.js app — no out-of-the-box Tailwind preset maps to this exactly, requires custom colour values.

## Bottom drawer for question/answer input
**Decision:** Submission UI slides up as a drawer over the feed, not a separate page/route.
**Why:** Navigating away to submit breaks the "contained and private" feeling. A drawer keeps the user in context.
**Trade-off:** Slightly more complex than a separate page, but manageable with a simple `useState` toggle and Tailwind translate classes.

## Public GitHub repo
**Decision:** Source code is public on GitHub.
**Why:** Required for hackathon submission and demo sharing.
**Trade-off:** Secrets (Supabase keys, Anthropic API key) must never be committed — use `.env.local` which is gitignored by Next.js by default. Add a `.env.example` with placeholder values for reference.

## Next.js App Router (not Pages Router)
**Decision:** App Router with server components as default.
**Why:** Server actions reduce client-side code; server components avoid unnecessary API roundtrips for reads. Aligns with current Next.js best practices.
