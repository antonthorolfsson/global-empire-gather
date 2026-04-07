-- Add special_move column to chess_moves table for en passant and castling
ALTER TABLE public.chess_moves 
ADD COLUMN IF NOT EXISTS special_move TEXT CHECK (special_move IN ('en_passant', 'castle_kingside', 'castle_queenside'));