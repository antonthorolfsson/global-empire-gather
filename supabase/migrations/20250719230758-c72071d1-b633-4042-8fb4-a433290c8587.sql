-- Remove the existing cron job and recreate it with a fresh configuration
SELECT cron.unschedule('auto-vote-preselections');

-- Recreate the cron job with a slightly different approach
SELECT cron.schedule(
  'auto-vote-preselections-v2',
  '*/30 * * * * *', -- Every 30 seconds
  $$
  SELECT net.http_post(
    url := 'https://tspkvuskpdxoayzhsivd.supabase.co/functions/v1/auto-vote-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcGt2dXNrcGR4b2F5emhzaXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYxODcsImV4cCI6MjA2NzQ3MjE4N0.A09rP8VDPTmbDLs83miQqie-HvyNdgaPGLEnFZ2Hkjs"}'::jsonb,
    body := '{"timestamp": "' || extract(epoch from now()) || '"}'::jsonb
  );
  $$
);