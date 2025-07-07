-- Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create games table for game sessions
CREATE TABLE public.games (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_player_turn INTEGER DEFAULT 0,
  game_phase TEXT NOT NULL DEFAULT 'setup' CHECK (game_phase IN ('setup', 'playing', 'finished')),
  max_players INTEGER NOT NULL DEFAULT 8,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create game_players table for players in each game
CREATE TABLE public.game_players (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  color TEXT NOT NULL,
  player_order INTEGER NOT NULL,
  is_host BOOLEAN NOT NULL DEFAULT false,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(game_id, user_id),
  UNIQUE(game_id, player_order)
);

-- Create game_countries table for country selections
CREATE TABLE public.game_countries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  country_id TEXT NOT NULL,
  player_id UUID REFERENCES public.game_players(id) ON DELETE CASCADE,
  selected_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(game_id, country_id)
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.games ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_players ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_countries ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
CREATE POLICY "Profiles are viewable by everyone" 
ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create policies for games
CREATE POLICY "Games are viewable by everyone" 
ON public.games FOR SELECT USING (true);

CREATE POLICY "Users can create games" 
ON public.games FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Game creators can update their games" 
ON public.games FOR UPDATE USING (auth.uid() = created_by);

-- Create policies for game_players
CREATE POLICY "Game players are viewable by everyone" 
ON public.game_players FOR SELECT USING (true);

CREATE POLICY "Users can join games" 
ON public.game_players FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own player info" 
ON public.game_players FOR UPDATE USING (auth.uid() = user_id);

-- Create policies for game_countries
CREATE POLICY "Game countries are viewable by everyone" 
ON public.game_countries FOR SELECT USING (true);

CREATE POLICY "Players can select countries in their games" 
ON public.game_countries FOR INSERT WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.game_players 
    WHERE id = player_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Players can update countries in their games" 
ON public.game_countries FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.game_players 
    WHERE id = player_id AND user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();