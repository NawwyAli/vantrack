-- Phase 4: Invoices
-- Run this in the Supabase SQL editor

create table if not exists invoices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  client_id uuid references clients(id) on delete cascade not null,
  job_id uuid references jobs(id) on delete set null,
  quote_id uuid references quotes(id) on delete set null,
  invoice_number text not null,
  status text not null default 'draft',   -- draft, sent, paid, overdue
  line_items jsonb not null default '[]',
  subtotal decimal(10,2) not null default 0,
  vat_rate decimal(5,2) not null default 0,
  vat_amount decimal(10,2) not null default 0,
  total decimal(10,2) not null default 0,
  notes text,
  due_date date,
  paid_at timestamptz,
  payment_link_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table invoices enable row level security;

create policy "users_own_invoices" on invoices
  for all using (auth.uid() = user_id);
