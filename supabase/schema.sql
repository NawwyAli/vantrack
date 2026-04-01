-- Profiles (extends auth.users with role)
create table if not exists public.profiles (
  id uuid primary key,
  role text not null check (role in ('gas_engineer', 'plumber', 'both')),
  created_at timestamptz not null default now(),
  foreign key (id) references auth.users(id) on delete cascade
);

-- Clients (landlords)
create table if not exists public.clients (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  address text not null,
  phone text not null,
  email text not null default '',
  created_at timestamptz not null default now()
);

-- Properties (rental properties belonging to a client)
create table if not exists public.properties (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references public.clients(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  address text not null,
  created_at timestamptz not null default now()
);

-- Certificates (CP12 records for a property)
create table if not exists public.certificates (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  issue_date date not null,
  notes text not null default '',
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.clients enable row level security;
alter table public.properties enable row level security;
alter table public.certificates enable row level security;

-- Profiles policies
create policy "profiles_select" on public.profiles for select using (auth.uid() = id);
create policy "profiles_insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles_update" on public.profiles for update using (auth.uid() = id);

-- Clients policies
create policy "clients_select" on public.clients for select using (auth.uid() = user_id);
create policy "clients_insert" on public.clients for insert with check (auth.uid() = user_id);
create policy "clients_update" on public.clients for update using (auth.uid() = user_id);
create policy "clients_delete" on public.clients for delete using (auth.uid() = user_id);

-- Properties policies
create policy "properties_select" on public.properties for select using (auth.uid() = user_id);
create policy "properties_insert" on public.properties for insert with check (auth.uid() = user_id);
create policy "properties_update" on public.properties for update using (auth.uid() = user_id);
create policy "properties_delete" on public.properties for delete using (auth.uid() = user_id);

-- Certificates policies
create policy "certificates_select" on public.certificates for select using (auth.uid() = user_id);
create policy "certificates_insert" on public.certificates for insert with check (auth.uid() = user_id);
create policy "certificates_update" on public.certificates for update using (auth.uid() = user_id);
create policy "certificates_delete" on public.certificates for delete using (auth.uid() = user_id);
