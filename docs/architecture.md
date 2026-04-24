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
| /api/questions | POST | Submit + anonymize question |
| /api/questions | GET | Fetch questions for a team |
| /api/answers | POST | Submit + anonymize answer; trigger synthesis if threshold met |
| /api/synthesize | POST | Run Claude synthesis, store insight |

## Pages
- `/` — Create or join a team
- `/team/[code]` — Question feed; bottom drawer for submitting a question; after team creation show code + copy button immediately
- `/team/[code]/question/[id]` — Answer a question (bottom drawer); view synthesis when ready

## Decision Log
- **[24 Apr 2026] Synthesis triggered via internal fetch from answers route.** Why: simplest path for prototype — no queue infra needed. Alternatives rejected: background job (too complex), cron (overkill). Tradeoff: answer submission response blocks while Claude synthesizes (~3–5s). Acceptable at demo scale.
- **[24 Apr 2026] `GET /api/questions/[id]` added as dynamic route.** Why: question detail page needs to fetch a single question by ID. Alternatives: fetch full list and filter client-side (wasteful). Tradeoff: one extra route file.
- **[24 Apr 2026] `GET /api/synthesize` added alongside POST.** Why: question detail page needs to fetch the insight after the question closes. Clean separation of concerns.

## Quality Signals
| Area | Status | Last checked |
|---|---|---|
| API error handling | 🟡 Basic — returns error strings, no retry logic | 24 Apr 2026 |
| Claude prompt robustness | 🟡 Works but not tested with adversarial input | 24 Apr 2026 |
| Mobile layout | 🟢 Tested at 390px, safe-area padding in place | 24 Apr 2026 |
| Full E2E flow | 🟢 Create → question → 3 answers → synthesis verified | 24 Apr 2026 |
| Double-submit guard | 🟢 localStorage implemented | 24 Apr 2026 |

## Key Architectural Decisions
See @docs/decisions.md for rationale behind major choices.
