-- Phase 2: Job Management
-- Run this in the Supabase SQL editor

-- Jobs table
create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  property_id uuid references properties(id) on delete set null,
  description text not null,
  date date not null,
  price decimal(10,2),
  status text not null default 'pending',
  is_recurring boolean default false,
  recurring_interval text,
  archived boolean default false,
  notes text,
  created_at timestamptz default now()
);

alter table jobs enable row level security;

create policy "users_own_jobs" on jobs
  for all using (auth.uid() = user_id);

-- Job photos table
create table if not exists job_photos (
  id uuid primary key default gen_random_uuid(),
  job_id uuid references jobs(id) on delete cascade not null,
  user_id uuid references profiles(id) on delete cascade not null,
  storage_path text not null,
  created_at timestamptz default now()
);

alter table job_photos enable row level security;

create policy "users_own_job_photos" on job_photos
  for all using (auth.uid() = user_id);

-- Client notes / communication log
create table if not exists client_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  note text not null,
  created_at timestamptz default now()
);

alter table client_notes enable row level security;

create policy "users_own_client_notes" on client_notes
  for all using (auth.uid() = user_id);

-- NOTE: Also create a Storage bucket called "uploads" (set to public)
-- in Supabase Dashboard > Storage > New bucket
-- Name: uploads
-- Public: ON
