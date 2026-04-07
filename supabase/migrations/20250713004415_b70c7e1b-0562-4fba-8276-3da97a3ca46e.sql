-- Create table for player preselections
CREATE TABLE IF NOT EXISTS public.player_preselections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  player_id UUID NOT NULL,
  game_id UUID NOT NULL,
  country_id TEXT NOT NULL,
  position INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.player_preselections ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Players can view their own preselections" ON public.player_preselections;
CREATE POLICY "Players can view their own preselections" 
ON public.player_preselections 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.id = player_preselections.player_id 
    AND game_players.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Players can create their own preselections" ON public.player_preselections;
CREATE POLICY "Players can create their own preselections" 
ON public.player_preselections 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.id = player_preselections.player_id 
    AND game_players.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Players can update their own preselections" ON public.player_preselections;
CREATE POLICY "Players can update their own preselections" 
ON public.player_preselections 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.id = player_preselections.player_id 
    AND game_players.user_id = auth.uid()
));

DROP POLICY IF EXISTS "Players can delete their own preselections" ON public.player_preselections;
CREATE POLICY "Players can delete their own preselections" 
ON public.player_preselections 
FOR DELETE 
USING (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.id = player_preselections.player_id 
    AND game_players.user_id = auth.uid()
));

-- Add unique constraint to prevent duplicate positions per player
CREATE UNIQUE INDEX IF NOT EXISTS idx_player_preselections_unique_position 
ON public.player_preselections (player_id, position);

-- Add trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_player_preselections_updated_at ON public.player_preselections;
CREATE TRIGGER update_player_preselections_updated_at
BEFORE UPDATE ON public.player_preselections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to automatically vote from preselection list
CREATE OR REPLACE FUNCTION public.auto_vote_from_preselection()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  game_rec RECORD;
  player_rec RECORD;
  preselection_rec RECORD;
BEGIN
  -- Find games in playing phase where it's someone's turn
  FOR game_rec IN 
    SELECT g.id, g.current_player_turn 
    FROM games g 
    WHERE g.game_phase = 'playing' 
      AND g.status = 'active'
      AND g.current_player_turn IS NOT NULL
  LOOP
    -- Get the current player
    SELECT * INTO player_rec 
    FROM game_players gp 
    WHERE gp.game_id = game_rec.id 
      AND gp.player_order = game_rec.current_player_turn;
    
    IF player_rec.id IS NOT NULL THEN
      -- Check if player has preselections and no recent activity (5+ minutes since last update)
      SELECT pp.country_id INTO preselection_rec
      FROM player_preselections pp
      WHERE pp.player_id = player_rec.id
        AND pp.position = 1
        AND NOT EXISTS (
          SELECT 1 FROM game_countries gc 
          WHERE gc.country_id = pp.country_id 
            AND gc.game_id = game_rec.id 
            AND gc.player_id IS NOT NULL
        )
      ORDER BY pp.position
      LIMIT 1;
      
      -- If we found a valid preselection, auto-vote
      IF preselection_rec.country_id IS NOT NULL THEN
        -- Check if enough time has passed since last game update (auto-vote after 5 minutes)
        IF EXISTS (
          SELECT 1 FROM games g2 
          WHERE g2.id = game_rec.id 
            AND g2.updated_at < now() - interval '5 minutes'
        ) THEN
          -- Insert the country selection
          INSERT INTO game_countries (game_id, player_id, country_id, selected_at)
          VALUES (game_rec.id, player_rec.id, preselection_rec.country_id, now());
          
          -- Remove the used preselection and reorder
          DELETE FROM player_preselections 
          WHERE player_id = player_rec.id AND country_id = preselection_rec.country_id;
          
          -- Update positions for remaining preselections
          UPDATE player_preselections 
          SET position = position - 1, updated_at = now()
          WHERE player_id = player_rec.id AND position > 1;
          
          -- Advance to next player
          UPDATE games 
          SET 
            current_player_turn = CASE 
              WHEN current_player_turn >= (
                SELECT COUNT(*) - 1 FROM game_players WHERE game_id = game_rec.id
              ) THEN 0 
              ELSE current_player_turn + 1 
            END,
            updated_at = now()
          WHERE id = game_rec.id;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;