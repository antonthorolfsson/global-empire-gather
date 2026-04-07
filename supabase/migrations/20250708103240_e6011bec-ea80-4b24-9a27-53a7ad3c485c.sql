-- Enable realtime for chess_games table
ALTER TABLE public.chess_games REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chess_games;