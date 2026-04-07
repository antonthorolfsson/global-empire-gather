-- Add foreign key constraints to chat_messages table
DO $$ BEGIN
  ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_game_id_fkey FOREIGN KEY (game_id) REFERENCES public.games(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.chat_messages ADD CONSTRAINT chat_messages_player_id_fkey FOREIGN KEY (player_id) REFERENCES public.game_players(id) ON DELETE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;