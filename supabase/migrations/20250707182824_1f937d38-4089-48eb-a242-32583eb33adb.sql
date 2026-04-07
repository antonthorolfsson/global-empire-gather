-- Create chess_moves table to store game state and moves
CREATE TABLE public.chess_moves (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  war_id UUID NOT NULL,
  move_number INTEGER NOT NULL,
  player_color TEXT NOT NULL CHECK (player_color IN ('white', 'black')),
  from_row INTEGER NOT NULL CHECK (from_row >= 0 AND from_row <= 7),
  from_col INTEGER NOT NULL CHECK (from_col >= 0 AND from_col <= 7),
  to_row INTEGER NOT NULL CHECK (to_row >= 0 AND to_row <= 7),
  to_col INTEGER NOT NULL CHECK (to_col >= 0 AND to_col <= 7),
  piece_type TEXT NOT NULL CHECK (piece_type IN ('king', 'queen', 'rook', 'bishop', 'knight', 'pawn')),
  captured_piece TEXT,
  board_state JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chess_moves ENABLE ROW LEVEL SECURITY;

-- Create policies for chess moves
CREATE POLICY "Chess moves are viewable by war participants" 
ON public.chess_moves 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM war_declarations wd 
    JOIN game_players gp ON (gp.id = wd.attacking_player_id OR gp.id = wd.defending_player_id)
    WHERE wd.id = chess_moves.war_id AND gp.user_id = auth.uid()
  )
);

CREATE POLICY "War participants can create chess moves" 
ON public.chess_moves 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM war_declarations wd 
    JOIN game_players gp ON (gp.id = wd.attacking_player_id OR gp.id = wd.defending_player_id)
    WHERE wd.id = chess_moves.war_id AND gp.user_id = auth.uid()
  )
);

-- Add index for better performance
CREATE INDEX idx_chess_moves_war_id ON public.chess_moves(war_id);
CREATE INDEX idx_chess_moves_war_move ON public.chess_moves(war_id, move_number);