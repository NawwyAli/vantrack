-- Phase 11: Schedule automated reminder edge functions via pg_cron
-- Run AFTER enabling pg_cron and pg_net extensions in Supabase Dashboard

-- Send SMS job reminders daily at 8am UTC (9am BST)
select cron.schedule(
  'phase11-job-reminders',
  '0 8 * * *',
  $$
  select net.http_post(
    url    := 'https://dwoiqzfbqljejkozxlkl.supabase.co/functions/v1/send-job-reminders',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_Jg_FO1eJdtGRe1Oqe6LN-w_wzt-iVf9'
    ),
    body := '{}'::jsonb
  )
  $$
);

-- Send quote follow-up emails daily at 9am UTC (10am BST)
select cron.schedule(
  'phase11-quote-followups',
  '0 9 * * *',
  $$
  select net.http_post(
    url    := 'https://dwoiqzfbqljejkozxlkl.supabase.co/functions/v1/send-quote-followups',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer sb_publishable_Jg_FO1eJdtGRe1Oqe6LN-w_wzt-iVf9'
    ),
    body := '{}'::jsonb
  )
  $$
);

-- To verify scheduled jobs:
-- select * from cron.job;

-- To remove:
-- select cron.unschedule('phase11-job-reminders');
-- select cron.unschedule('phase11-quote-followups');
