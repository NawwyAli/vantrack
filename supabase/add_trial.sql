-- Add trial and subscription tracking to profiles
alter table public.profiles
  add column if not exists trial_ends_at timestamptz,
  add column if not exists subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'canceled', 'expired'));

-- Update the signup trigger to set trial_ends_at on new signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, role, trial_ends_at, subscription_status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'role', 'gas_engineer'),
    now() + interval '14 days',
    'trialing'
  );
  return new;
end;
$$;

-- Backfill trial_ends_at for any existing users (sets it to 14 days from now)
update public.profiles
  set trial_ends_at = now() + interval '14 days',
      subscription_status = 'trialing'
  where trial_ends_at is null;
