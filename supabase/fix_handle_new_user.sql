-- Fix: handle_new_user trigger
-- Restores trial_ends_at and subscription_status which were dropped by the earlier RLS fix SQL.
-- Run this in the Supabase SQL Editor.

create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, role, trial_ends_at, subscription_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'gas_engineer'),
    now() + interval '14 days',
    'trialing'
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Ensure the trigger exists (safe to run even if it already exists)
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Backfill any existing users who have no trial set
update public.profiles
  set trial_ends_at = now() + interval '14 days',
      subscription_status = 'trialing'
  where trial_ends_at is null;
