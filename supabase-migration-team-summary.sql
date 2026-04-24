-- Migration: add cached team-level summary columns to teams
-- Run this in the Supabase SQL Editor (CLI has IPv6 issues on some machines).

alter table teams
  add column if not exists summary_text text,
  add column if not exists summary_themes text[] not null default '{}',
  add column if not exists summary_generated_at timestamptz,
  add column if not exists summary_source_count int not null default 0;
