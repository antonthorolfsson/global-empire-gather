-- Remove the old failing cron job
SELECT cron.unschedule(1);

-- Check if our new cron job (jobid 2) has run successfully  
-- Let's also manually test it to make sure it works
SELECT net.http_post(
  url := 'https://tspkvuskpdxoayzhsivd.supabase.co/functions/v1/auto-vote-scheduler',
  headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcGt2dXNrcGR4b2F5emhzaXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYxODcsImV4cCI6MjA2NzQ3MjE4N30.A09rP8VDPTmbDLs83miQqie-HvyNdgaPGLEnFZ2Hkjs"}'::jsonb,
  body := '{"trigger": "manual_test"}'::jsonb
) as request_id;