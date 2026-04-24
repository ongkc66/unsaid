-- Migration: add is_ai_generated flag to questions
-- Run this in the Supabase SQL Editor (CLI has IPv6 issues on some machines).

alter table questions
  add column if not exists is_ai_generated boolean not null default false;
