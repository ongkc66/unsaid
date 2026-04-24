# Unsaid

**Anonymous peer-to-peer team insights — surface what your team actually thinks, but never says out loud.**

---

## The problem

You've sat in a retro where everyone said things were fine. You've watched a team survey return 4.8/5 across the board while morale quietly eroded. You've been in a 1:1 where the real issue never came up because it felt too risky to say.

Small teams don't have a feedback problem. They have a **psychological safety problem**.

Standard tools — surveys, retros, anonymous forms — have two fatal flaws: they collect raw text (which a manager can pattern-match back to a person), and they show individual responses (which in a 4-person team makes anonymity trivially breakable). So people don't say what they mean. The team never knows what it's actually dealing with.

---

## How Unsaid solves it

Unsaid is built on two unconventional bets:

**1. Rewrite, don't collect.**
Every question and answer is rewritten by Claude before it touches the database. Your exact words — your tone, your phrasing, your tell-tale vocabulary — never get stored. What gets saved is a neutral, third-person restatement that preserves meaning but strips identity. Raw input is discarded server-side, immediately.

**2. Synthesis only — never individual answers.**
Nobody sees what you wrote. Nobody sees what anyone wrote. The only output is a Claude-generated team-level insight that synthesises all responses into one collective signal. Even the team lead only sees the synthesis.

To further protect small teams (where "2 of 3 answered = I know who said what"), Unsaid injects 1–2 AI-generated decoy answers into every synthesis prompt — making attribution mathematically harder without distorting the insight.

---

## What it looks like in practice

1. A team member asks something the team hasn't said out loud — via a bottom drawer that slides up, contained and private
2. Claude rewrites the question anonymously before it appears in the feed
3. Team members answer on their own time — Claude rewrites each answer too
4. When enough people have responded, synthesis triggers automatically
5. The insight appears word-by-word — a single, honest signal from the whole team
6. Over time, a **Team Portrait** emerges: a Claude-generated narrative of what this team keeps circling back to, with recurring themes extracted across all insights

---

## Features

- **Zero friction** — no login, no accounts; teams are identified by a 6-character join code
- **AI anonymization** — every input rewritten by `claude-sonnet-4-6` before storage; raw text never persists
- **Decoy injection** — 1–2 AI answers mixed into synthesis to break attribution math in small teams
- **Auto-synthesis** — triggers automatically when the answer threshold is met; no manual action required
- **Question labels** — Claude assigns each question to one of 7 categories (Culture, Leadership, Process, Wellbeing, Growth, Recognition, Communication); feed is filterable by label
- **Team Portrait** — a running Claude-generated narrative of the team's character, updated after each new insight
- **Pulse tab** — activity heatmap, completion ring, theme frequency chart, and actionable suggestions tracked over time
- **Realtime feed** — Supabase Postgres changes subscription; new questions and status changes appear without refresh
- **Mobile-first** — designed for 390px; works on any device, no install

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 14 (App Router, server components) |
| Database | Supabase (Postgres + Realtime) |
| AI | Anthropic Claude (`claude-sonnet-4-6`) |
| Styling | Tailwind CSS v4 + Geist Sans |
| Deploy | Vercel |

---

## Local setup

**Prerequisites:** Node.js 18+, a Supabase project, an Anthropic API key.

```bash
# 1. Clone and install
git clone https://github.com/ongkc66/unsaid.git
cd unsaid
npm install

# 2. Copy env template and fill in your keys
cp .env.example .env.local

# 3. Apply the database schema
# Open your Supabase project → SQL Editor → paste contents of supabase-schema.sql
# Then apply each migration file in order:
#   supabase-migration-ai-questions.sql
#   supabase-migration-insight-extras.sql
#   supabase-migration-team-summary.sql

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment variables

| Variable | Description |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |
| `ANTHROPIC_API_KEY` | Anthropic API key |

---

## Database schema

```sql
teams        — id, code(6), name, member_count, summary_text, summary_themes
questions    — id, team_id, anonymized_text, status(open|closed), answer_count, label, is_ai_generated
answers      — id, question_id, anonymized_text
synthesis    — id, question_id, insight_text, themes, suggestions
```

Full schema in [`supabase-schema.sql`](./supabase-schema.sql).

---

## Privacy model

| What happens | Detail |
|---|---|
| Raw question typed | Sent to Claude server-side, rewritten, original discarded |
| Raw answer typed | Sent to Claude server-side, rewritten, original discarded |
| What's stored | Only anonymized text — no names, IPs, sessions, or user IDs |
| What's shown | Only team-level synthesis — never individual answers |
| Small team protection | 1–2 AI decoy answers injected per synthesis to prevent attribution by elimination |

---

## Design principles

- **Midnight palette** — `#0D0F1A` base, `#F0EEE6` text, `#6366F1` accent. Intimate and calm, not a dev tool dashboard.
- **Bottom drawer UX** — input slides up over the feed; the user never navigates away, keeping the feeling of a private, contained space.
- **Synthesis as the reveal** — the insight appears word-by-word, weighted typographically. It's the emotional centrepiece of the product.
- **No individual answer display** — ever. Even closed questions show only the synthesis.

---

## Roadmap

- [ ] Vercel production deploy
- [ ] Slack / Teams integration (post synthesis to a channel)
- [ ] Weekly digest email
- [ ] Export team portrait as PDF

---

Built at a hackathon in one session. All Claude calls live in [`src/lib/claude.ts`](./src/lib/claude.ts).
