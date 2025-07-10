-- Create chat messages table
CREATE TABLE public.chat_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL,
  player_id UUID NOT NULL,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Create policies for chat messages
CREATE POLICY "Game players can view chat messages" 
ON public.chat_messages 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.game_id = chat_messages.game_id 
  AND game_players.user_id = auth.uid()
));

CREATE POLICY "Game players can send chat messages" 
ON public.chat_messages 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM game_players 
  WHERE game_players.id = chat_messages.player_id 
  AND game_players.user_id = auth.uid()
  AND game_players.game_id = chat_messages.game_id
));

-- Enable realtime for chat messages
ALTER TABLE public.chat_messages REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.chat_messages;