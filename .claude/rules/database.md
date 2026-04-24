# Database Rules (Supabase)

## Client Setup
- Supabase client initialized once in `lib/supabase.ts`
- Use the server client (with service role key) in API routes — never expose the service role key to the client
- Use the anon client only for public reads if needed

## Schema Conventions
- All table names: plural snake_case (teams, questions, answers)
- Primary keys: uuid (Supabase default)
- Timestamps: timestamptz with `default now()`
- Boolean flags: default false, named as `is_[adjective]` (e.g. is_ai_generated)

## Queries
- Always select only the columns you need — no `select *` in production code
- Use Supabase's typed client where possible for autocomplete and safety
- Handle `.error` from every Supabase call — never silently swallow errors

## Data Safety
- Raw user input must NEVER be written to the database — anonymize via Claude first
- No PII in any table: no emails, names, IPs, or session identifiers
- question_id and team_id foreign keys must be validated server-side before insert

## Realtime (if used)
- Subscribe to `questions` table changes on the team feed page to surface new questions without refresh
- Unsubscribe on component unmount to avoid memory leaks
