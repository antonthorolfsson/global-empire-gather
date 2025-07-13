-- Update the auto-vote function to remove claimed countries from all preselection lists
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
      -- Check if player has preselections and no recent activity (30 seconds since last update)
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
        -- Check if enough time has passed since last game update (auto-vote after 30 seconds)
        IF EXISTS (
          SELECT 1 FROM games g2 
          WHERE g2.id = game_rec.id 
            AND g2.updated_at < now() - interval '30 seconds'
        ) THEN
          -- Insert the country selection
          INSERT INTO game_countries (game_id, player_id, country_id, selected_at)
          VALUES (game_rec.id, player_rec.id, preselection_rec.country_id, now());
          
          -- Remove the claimed country from ALL players' preselection lists in this game
          DELETE FROM player_preselections 
          WHERE country_id = preselection_rec.country_id 
            AND player_id IN (
              SELECT gp.id FROM game_players gp WHERE gp.game_id = game_rec.id
            );
          
          -- Update positions for all remaining preselections in the game
          UPDATE player_preselections 
          SET position = position - 1, updated_at = now()
          WHERE player_id IN (
            SELECT gp.id FROM game_players gp WHERE gp.game_id = game_rec.id
          ) AND position > (
            SELECT MIN(pp2.position) 
            FROM player_preselections pp2 
            WHERE pp2.player_id = player_preselections.player_id 
              AND pp2.country_id = preselection_rec.country_id
          );
          
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