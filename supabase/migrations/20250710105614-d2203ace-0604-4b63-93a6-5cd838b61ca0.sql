-- Add RLS policy to allow country transfers after war completion
CREATE POLICY "Allow country transfer after war completion" 
ON public.game_countries 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 
    FROM war_declarations wd
    JOIN game_players gp ON (gp.id = wd.attacking_player_id OR gp.id = wd.defending_player_id)
    WHERE wd.defending_country_id = game_countries.country_id
      AND wd.game_id = game_countries.game_id
      AND wd.status = 'completed'
      AND gp.user_id = auth.uid()
  )
);