-- Migration: add themes + suggestions arrays to synthesis
-- Run this in the Supabase SQL Editor (CLI has IPv6 issues on some machines).

alter table synthesis
  add column if not exists themes text[] not null default '{}',
  add column if not exists suggestions text[] not null default '{}';
