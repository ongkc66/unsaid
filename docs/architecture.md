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

## Key Architectural Decisions
See @docs/decisions.md for rationale behind major choices.
