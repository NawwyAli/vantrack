-- Phase 11: Automated Follow-ups and Reminders

-- Add tracking columns to jobs and quotes
alter table jobs add column if not exists sms_reminder_sent_at timestamptz;
alter table quotes add column if not exists followup_sent_at timestamptz;

-- Add reminder preferences to engineer profiles
alter table engineer_profiles add column if not exists review_url text default '';
alter table engineer_profiles add column if not exists auto_sms_reminders boolean default false;
alter table engineer_profiles add column if not exists quote_followup_days integer default 0;
-- quote_followup_days = 0 means disabled; any positive value = auto follow-up after N days
