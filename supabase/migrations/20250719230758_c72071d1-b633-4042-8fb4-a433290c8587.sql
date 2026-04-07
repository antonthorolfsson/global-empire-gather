-- Remove the existing cron job and recreate it with a fresh configuration
DO $$ BEGIN PERFORM cron.unschedule('auto-vote-preselections'); EXCEPTION WHEN OTHERS THEN NULL; END $$;

-- Recreate the cron job with a slightly different approach
DO $$ BEGIN PERFORM cron.unschedule('auto-vote-preselections-v2'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'auto-vote-preselections-v2',
  '*/30 * * * * *', -- Every 30 seconds
  $$
  SELECT net.http_post(
    url := 'https://jhyoobrpkvmygbcevyjn.supabase.co/functions/v1/auto-vote-scheduler',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpoeW9vYnJwa3ZteWdiY2V2eWpuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU1NjYzMzAsImV4cCI6MjA5MTE0MjMzMH0.jlu2jNklzvRgR5VCDM1b0Pvd0_YEU8ibUUhfb0fMoss"}'::jsonb,
    body := '{"timestamp": "' || extract(epoch from now()) || '"}'::jsonb
  );
  $$
);