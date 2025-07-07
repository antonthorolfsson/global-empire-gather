-- Allow game players to update current_player_turn
CREATE POLICY "Game players can update turn" ON public.games
FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.game_players 
    WHERE game_players.game_id = games.id 
    AND game_players.user_id = auth.uid()
  )
);