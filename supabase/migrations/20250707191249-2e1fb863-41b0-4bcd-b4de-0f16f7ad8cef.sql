-- Create chess games table to store timer state
CREATE TABLE public.chess_games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  war_id UUID NOT NULL UNIQUE,
  white_time_remaining INTEGER NOT NULL DEFAULT 300, -- 5 minutes in seconds
  black_time_remaining INTEGER NOT NULL DEFAULT 300, -- 5 minutes in seconds
  current_player VARCHAR(10) NOT NULL DEFAULT 'white',
  game_status VARCHAR(20) NOT NULL DEFAULT 'playing',
  winner VARCHAR(10) NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chess_games ENABLE ROW LEVEL SECURITY;

-- Create policies for chess games
CREATE POLICY "Chess games are viewable by war participants" 
ON public.chess_games 
FOR SELECT 
USING (EXISTS ( 
  SELECT 1
  FROM (war_declarations wd
    JOIN game_players gp ON ((gp.id = wd.attacking_player_id) OR (gp.id = wd.defending_player_id)))
  WHERE (wd.id = chess_games.war_id) AND (gp.user_id = auth.uid())
));

CREATE POLICY "War participants can create chess games" 
ON public.chess_games 
FOR INSERT 
WITH CHECK (EXISTS ( 
  SELECT 1
  FROM (war_declarations wd
    JOIN game_players gp ON ((gp.id = wd.attacking_player_id) OR (gp.id = wd.defending_player_id)))
  WHERE (wd.id = chess_games.war_id) AND (gp.user_id = auth.uid())
));

CREATE POLICY "War participants can update chess games" 
ON public.chess_games 
FOR UPDATE 
USING (EXISTS ( 
  SELECT 1
  FROM (war_declarations wd
    JOIN game_players gp ON ((gp.id = wd.attacking_player_id) OR (gp.id = wd.defending_player_id)))
  WHERE (wd.id = chess_games.war_id) AND (gp.user_id = auth.uid())
));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_chess_games_updated_at
BEFORE UPDATE ON public.chess_games
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();