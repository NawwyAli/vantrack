-- Step 1: Add reminder tracking column to certificates
alter table public.certificates
  add column if not exists reminder_sent_at timestamptz;

-- Step 2: Enable pg_cron and pg_net extensions (if not already enabled)
-- Do this in Supabase Dashboard → Database → Extensions → enable pg_cron and pg_net

-- Step 3: Schedule the Edge Function to run daily at 9am UTC
select cron.schedule(
  'cp12-daily-reminders',
  '0 9 * * *',
  $$
  select
    net.http_post(
      url := 'https://dwoiqzfbqljejkozxlkl.supabase.co/functions/v1/send-reminders',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer sb_publishable_Jg_FO1eJdtGRe1Oqe6LN-w_wzt-iVf9'
      ),
      body := '{}'::jsonb
    )
  $$
);

-- To check scheduled jobs:
-- select * from cron.job;

-- To unschedule:
-- select cron.unschedule('cp12-daily-reminders');
