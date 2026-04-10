-- Phase 10: Expense and Mileage Tracker

create table expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  job_id uuid references jobs(id) on delete set null,
  date date not null,
  category text not null,
  description text not null,
  amount numeric(10,2) not null,
  created_at timestamptz default now()
);

alter table expenses enable row level security;

create policy "Users manage own expenses"
  on expenses for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table mileage_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  job_id uuid references jobs(id) on delete set null,
  date date not null,
  from_location text not null,
  to_location text not null,
  miles numeric(8,1) not null,
  purpose text default '',
  created_at timestamptz default now()
);

alter table mileage_entries enable row level security;

create policy "Users manage own mileage"
  on mileage_entries for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
