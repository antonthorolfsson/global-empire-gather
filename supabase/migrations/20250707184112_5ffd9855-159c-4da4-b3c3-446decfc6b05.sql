-- Enable real-time for chess_moves table
ALTER TABLE public.chess_moves REPLICA IDENTITY FULL;

-- Add the table to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.chess_moves;