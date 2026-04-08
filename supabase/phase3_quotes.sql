-- Phase 3: Engineer Profile + Quotes
-- Run this in the Supabase SQL editor

-- Engineer profile (one per user, stores business/PDF details)
create table if not exists engineer_profiles (
  id uuid primary key references profiles(id) on delete cascade,
  business_name text,
  business_address text,
  phone text,
  email text,
  gas_safe_number text,
  vat_registered boolean default false,
  vat_number text,
  bank_sort_code text,
  bank_account_number text,
  bank_name text,
  logo_url text,
  working_days text[] default array['Mon','Tue','Wed','Thu','Fri'],
  working_hours_start text default '08:00',
  working_hours_end text default '18:00',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table engineer_profiles enable row level security;

create policy "users_own_engineer_profile" on engineer_profiles
  for all using (auth.uid() = id);

-- Quotes
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete set null,
  quote_number text not null,
  status text not null default 'draft',   -- draft, sent, accepted, declined
  line_items jsonb not null default '[]', -- [{description, qty, unit_price, total}]
  subtotal decimal(10,2) not null default 0,
  vat_rate decimal(5,2) not null default 0,
  vat_amount decimal(10,2) not null default 0,
  total decimal(10,2) not null default 0,
  notes text,
  valid_until date,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table quotes enable row level security;

create policy "users_own_quotes" on quotes
  for all using (auth.uid() = user_id);
