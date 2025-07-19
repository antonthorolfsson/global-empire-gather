-- Remove all the cron jobs since they're not reliable
SELECT cron.unschedule('auto-vote-preselections-v2');
SELECT cron.unschedule('direct-auto-vote');

-- Create a more reliable trigger-based approach that runs periodically
-- This function will be called by the edge function every time someone loads the game
CREATE OR REPLACE FUNCTION public.trigger_auto_vote_check()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Run the auto-vote function
  PERFORM public.auto_vote_from_preselection();
  RETURN true;
END;
$$;