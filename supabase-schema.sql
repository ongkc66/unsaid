-- Unsaid — database schema
-- Run this in Supabase SQL Editor

create table teams (
  id uuid primary key default gen_random_uuid(),
  code char(6) unique not null,
  name text not null,
  member_count int not null,
  created_at timestamptz default now()
);

create table questions (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete cascade not null,
  anonymized_text text not null,
  status text default 'open' check (status in ('open', 'closed')),
  answer_count int default 0,
  created_at timestamptz default now()
);

create table answers (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade not null,
  anonymized_text text not null,
  created_at timestamptz default now()
);

create table synthesis (
  id uuid primary key default gen_random_uuid(),
  question_id uuid references questions(id) on delete cascade not null,
  insight_text text not null,
  created_at timestamptz default now()
);

-- Indexes for common queries
create index on questions(team_id);
create index on answers(question_id);
create index on synthesis(question_id);

-- Enable Row Level Security (open for prototype — no auth)
alter table teams enable row level security;
alter table questions enable row level security;
alter table answers enable row level security;
alter table synthesis enable row level security;

create policy "public read teams" on teams for select using (true);
create policy "public insert teams" on teams for insert with check (true);

create policy "public read questions" on questions for select using (true);
create policy "public insert questions" on questions for insert with check (true);
create policy "public update questions" on questions for update using (true);

create policy "public read answers" on answers for select using (true);
create policy "public insert answers" on answers for insert with check (true);

create policy "public read synthesis" on synthesis for select using (true);
create policy "public insert synthesis" on synthesis for insert with check (true);
