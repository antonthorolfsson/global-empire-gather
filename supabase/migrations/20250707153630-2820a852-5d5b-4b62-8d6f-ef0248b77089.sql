-- Enable realtime for game tables
ALTER TABLE public.games REPLICA IDENTITY FULL;
ALTER TABLE public.game_players REPLICA IDENTITY FULL;
ALTER TABLE public.game_countries REPLICA IDENTITY FULL;

-- Add tables to realtime publication
ALTER publication supabase_realtime ADD TABLE public.games;
ALTER publication supabase_realtime ADD TABLE public.game_players;
ALTER publication supabase_realtime ADD TABLE public.game_countries;