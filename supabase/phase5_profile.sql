-- Phase 5: Engineer Profile enhancements
-- Run this in the Supabase SQL editor

alter table engineer_profiles
  add column if not exists working_days jsonb,
  add column if not exists working_hours_start text,
  add column if not exists working_hours_end text;

-- Storage policy for the logos bucket
-- NOTE: First create a public bucket called "logos" in the Supabase dashboard
-- (Storage → New bucket → name: logos → Public: on)
-- Then run this policy:
create policy "users_own_logos" on storage.objects
  for all using (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'logos'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
