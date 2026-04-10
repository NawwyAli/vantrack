-- Phase 9: Compliance Checklists

create table checklists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users not null,
  job_id uuid references jobs(id) on delete set null,
  client_id uuid references clients(id) on delete set null,
  name text not null,
  items jsonb not null default '[]',
  engineer_notes text default '',
  status text not null default 'draft',
  completed_at timestamptz,
  created_at timestamptz default now()
);

alter table checklists enable row level security;

create policy "Users manage own checklists"
  on checklists for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
