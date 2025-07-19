-- Enable pg_cron and pg_net extensions for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job to run auto-vote function every 30 seconds
SELECT cron.schedule(
  'auto-vote-preselections',
  '*/30 * * * * *', -- Every 30 seconds
  $$
  SELECT net.http_post(
    url := 'https://tspkvuskpdxoayzhsivd.supabase.co/functions/v1/auto-vote-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcGt2dXNrcGR4b2F5emhzaXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYxODcsImV4cCI6MjA2NzQ3MjE4N30.A09rP8VDPTmbDLs83miQqie-HvyNdgaPGLEnFZ2Hkjs"}'::jsonb,
    body := '{"trigger": "cron"}'::jsonb
  ) as request_id;
  $$
);