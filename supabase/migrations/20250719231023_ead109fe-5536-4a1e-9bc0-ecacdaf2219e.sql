-- Create a more direct cron job that calls the function directly
DO $$ BEGIN PERFORM cron.unschedule('direct-auto-vote'); EXCEPTION WHEN OTHERS THEN NULL; END $$;
SELECT cron.schedule(
  'direct-auto-vote',
  '*/30 * * * * *', -- Every 30 seconds
  $$
  SELECT public.auto_vote_from_preselection();
  $$
);