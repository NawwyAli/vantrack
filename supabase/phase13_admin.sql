-- Phase 13: Admin Panel
-- Adds is_admin flag to profiles table.
-- Set this to true manually for the owner account via Supabase dashboard:
--   UPDATE profiles SET is_admin = true WHERE id = '<your-user-uuid>';

alter table profiles add column if not exists is_admin boolean default false;
