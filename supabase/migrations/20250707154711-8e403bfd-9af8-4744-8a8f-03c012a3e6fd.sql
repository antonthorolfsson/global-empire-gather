-- Create war declarations table
CREATE TABLE public.war_declarations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  attacking_player_id UUID NOT NULL,
  defending_player_id UUID NOT NULL,
  attacking_country_id TEXT NOT NULL,
  defending_country_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, declined, completed
  winner_player_id UUID NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.war_declarations ENABLE ROW LEVEL SECURITY;

-- Create policies for war declarations
CREATE POLICY "War declarations are viewable by game players" 
ON public.war_declarations 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.game_id = war_declarations.game_id 
  AND game_players.user_id = auth.uid()
));

CREATE POLICY "Players can create war declarations" 
ON public.war_declarations 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.id = war_declarations.attacking_player_id 
  AND game_players.user_id = auth.uid()
));

CREATE POLICY "Players can update war declarations they're involved in" 
ON public.war_declarations 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.game_id = war_declarations.game_id 
  AND game_players.user_id = auth.uid()
  AND (game_players.id = war_declarations.attacking_player_id OR game_players.id = war_declarations.defending_player_id)
));

-- Add trigger for automatic timestamp updates
CREATE TRIGGER update_war_declarations_updated_at
BEFORE UPDATE ON public.war_declarations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for war declarations
ALTER PUBLICATION supabase_realtime ADD TABLE public.war_declarations;
ALTER TABLE public.war_declarations REPLICA IDENTITY FULL;