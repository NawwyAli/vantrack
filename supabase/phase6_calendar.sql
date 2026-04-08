-- Phase 6: Calendar & Scheduling
-- Run this in the Supabase SQL editor

alter table jobs
  add column if not exists start_time text,
  add column if not exists end_time text;
