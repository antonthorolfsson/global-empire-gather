-- Fix auto-vote function to prevent duplicates with proper locking and validation
CREATE OR REPLACE FUNCTION public.auto_vote_from_preselection()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  game_rec RECORD;
  player_rec RECORD;
  preselection_rec RECORD;
  total_players INTEGER;
  next_turn INTEGER;
  country_already_taken BOOLEAN;
BEGIN
  -- Find games in playing phase where it's someone's turn
  FOR game_rec IN 
    SELECT g.id, g.current_player_turn, g.updated_at
    FROM games g 
    WHERE g.game_phase = 'playing' 
      AND g.status = 'active'
      AND g.current_player_turn IS NOT NULL
      -- Only process games that haven't been updated very recently (prevent race conditions)
      AND g.updated_at < now() - interval '5 seconds'
  LOOP
    -- Get the current player with explicit locking to prevent race conditions
    SELECT * INTO player_rec 
    FROM game_players gp 
    WHERE gp.game_id = game_rec.id 
      AND gp.player_order = game_rec.current_player_turn
    FOR UPDATE; -- Lock the player record
    
    IF player_rec.id IS NOT NULL THEN
      -- Get total number of players for this game
      SELECT COUNT(*) INTO total_players
      FROM game_players
      WHERE game_id = game_rec.id;
      
      -- Find the FIRST AVAILABLE preselection (lowest position that's not already taken)
      SELECT pp.country_id INTO preselection_rec
      FROM player_preselections pp
      WHERE pp.player_id = player_rec.id
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
        IF game_rec.updated_at < now() - interval '30 seconds' THEN
          
          -- Double-check that the country is still available (prevent race conditions)
          SELECT EXISTS (
            SELECT 1 FROM game_countries gc 
            WHERE gc.country_id = preselection_rec.country_id 
              AND gc.game_id = game_rec.id 
              AND gc.player_id IS NOT NULL
          ) INTO country_already_taken;
          
          -- Only proceed if country is still available
          IF NOT country_already_taken THEN
            -- Begin atomic transaction with proper sequencing
            
            -- 1. Insert the country selection with ON CONFLICT handling
            INSERT INTO game_countries (game_id, player_id, country_id, selected_at)
            VALUES (game_rec.id, player_rec.id, preselection_rec.country_id, now())
            ON CONFLICT (game_id, country_id) DO NOTHING;
            
            -- Check if the insert was successful (not conflicted)
            IF FOUND THEN
              -- 2. Remove the claimed country from ALL players' preselection lists in this game
              DELETE FROM player_preselections 
              WHERE country_id = preselection_rec.country_id 
                AND player_id IN (
                  SELECT gp.id FROM game_players gp WHERE gp.game_id = game_rec.id
                );
              
              -- 3. Clean up and reorder positions for all players
              -- Use a simpler approach: update positions based on current order
              WITH ordered_preselections AS (
                SELECT 
                  pp.id,
                  pp.player_id,
                  ROW_NUMBER() OVER (PARTITION BY pp.player_id ORDER BY pp.position, pp.created_at) as new_position
                FROM player_preselections pp
                WHERE pp.player_id IN (
                  SELECT gp.id FROM game_players gp WHERE gp.game_id = game_rec.id
                )
              )
              UPDATE player_preselections 
              SET position = op.new_position, updated_at = now()
              FROM ordered_preselections op
              WHERE player_preselections.id = op.id
                AND player_preselections.position != op.new_position;
              
              -- 4. Calculate next turn properly
              next_turn := CASE 
                WHEN game_rec.current_player_turn >= (total_players - 1) THEN 0 
                ELSE game_rec.current_player_turn + 1 
              END;
              
              -- 5. Update the game turn with explicit WHERE clause to prevent race conditions
              UPDATE games 
              SET 
                current_player_turn = next_turn,
                updated_at = now()
              WHERE id = game_rec.id
                AND current_player_turn = game_rec.current_player_turn; -- Only update if turn hasn't changed
              
              -- Log the auto-vote for debugging
              RAISE NOTICE 'Auto-voted for game %, player % (order %), country %, next turn %', 
                game_rec.id, player_rec.player_name, game_rec.current_player_turn, preselection_rec.country_id, next_turn;
            ELSE
              -- Country was already taken by another process
              RAISE NOTICE 'Country % already taken in game % during auto-vote', preselection_rec.country_id, game_rec.id;
            END IF;
          END IF;
        END IF;
      END IF;
    END IF;
  END LOOP;
END;
$$;