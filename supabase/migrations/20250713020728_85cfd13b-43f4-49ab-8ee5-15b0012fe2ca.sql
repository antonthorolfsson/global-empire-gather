-- Enable required extensions for cron jobs
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Create a cron job that runs every 10 seconds to check for auto-votes
DO $$ BEGIN PERFORM cron.unschedule('auto-vote-scheduler'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'auto-vote-scheduler',
  '*/10 * * * * *', -- every 10 seconds
  $$
  SELECT
    net.http_post(
        url:='https://jhyoobrpkvmygbcevyjn.supabase.co/functions/v1/auto-vote-scheduler',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoeW9vYnJwa3ZteWdiY2V2eWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjYzMzAsImV4cCI6MjA5MTE0MjMzMH0.jlu2jNklzvRgR5VCDM1b0Pvd0_YEU8ibUUhfb0fMoss"}'::jsonb,
        body:='{"time": "' || now() || '"}'::jsonb
    ) as request_id;
  $$
);