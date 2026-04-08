-- Phase 7: Online Booking
-- Run this in the Supabase SQL editor

alter table engineer_profiles
  add column if not exists booking_slug text unique,
  add column if not exists booking_enabled boolean default false,
  add column if not exists booking_description text;

create table if not exists booking_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  client_name text not null,
  client_email text,
  client_phone text,
  description text not null,
  preferred_date date,
  message text,
  status text not null default 'pending',  -- pending, accepted, declined
  created_at timestamptz default now()
);

alter table booking_requests enable row level security;

-- Engineers can read and manage their own requests
create policy "engineers_own_booking_requests" on booking_requests
  for all using (auth.uid() = user_id);
