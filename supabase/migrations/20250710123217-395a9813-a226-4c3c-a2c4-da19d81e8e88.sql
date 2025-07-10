-- Drop the existing public_games view
DROP VIEW IF EXISTS public.public_games;

-- Recreate the public_games view without SECURITY DEFINER
CREATE VIEW public.public_games AS
SELECT 
  g.id,
  g.name,
  g.status,
  g.game_phase,
  g.max_players,
  g.current_player_turn,
  g.is_public,
  g.created_by,
  g.created_at,
  g.updated_at,
  g.deleted_at,
  COALESCE(
    json_agg(
      json_build_object(
        'id', gp.id,
        'player_name', gp.player_name,
        'color', gp.color,
        'is_host', gp.is_host,
        'player_order', gp.player_order,
        'joined_at', gp.joined_at
      ) ORDER BY gp.player_order
    ) FILTER (WHERE gp.id IS NOT NULL), 
    '[]'::json
  ) as game_players
FROM games g
LEFT JOIN game_players gp ON g.id = gp.game_id
WHERE g.is_public = true 
  AND g.deleted_at IS NULL
GROUP BY g.id, g.name, g.status, g.game_phase, g.max_players, g.current_player_turn, g.is_public, g.created_by, g.created_at, g.updated_at, g.deleted_at;