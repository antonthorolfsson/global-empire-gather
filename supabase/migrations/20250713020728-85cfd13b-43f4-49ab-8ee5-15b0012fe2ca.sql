-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job that runs every 10 seconds to check for auto-votes
SELECT cron.schedule(
  'auto-vote-scheduler',
  '*/10 * * * * *', -- every 10 seconds
  $$
  SELECT
    net.http_post(
        url:='https://tspkvuskpdxoayzhsivd.supabase.co/functions/v1/auto-vote-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRzcGt2dXNrcGR4b2F5emhzaXZkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYxODcsImV4cCI6MjA2NzQ3MjE4N30.A09rP8VDPTmbDLs83miQqie-HvyNdgaPGLEnFZ2Hkjs"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);