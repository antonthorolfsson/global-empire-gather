-- Add privacy setting to games table
ALTER TABLE public.games ADD COLUMN is_public boolean NOT NULL DEFAULT true;

-- Create game invitations table
CREATE TABLE public.game_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id uuid NOT NULL REFERENCES public.games(id) ON DELETE CASCADE,
  inviter_id uuid NOT NULL,
  invitee_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '7 days'),
  UNIQUE(game_id, invitee_email)
);

-- Enable RLS on game invitations
ALTER TABLE public.game_invitations ENABLE ROW LEVEL SECURITY;

-- RLS policies for game invitations
CREATE POLICY "Game invitations are viewable by inviter and invitee"
ON public.game_invitations
FOR SELECT
USING (
  inviter_id = auth.uid() 
  OR invitee_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

CREATE POLICY "Game creators can invite players"
ON public.game_invitations
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.games 
    WHERE id = game_invitations.game_id 
    AND created_by = auth.uid()
  )
);

CREATE POLICY "Invitees can update invitation status"
ON public.game_invitations
FOR UPDATE
USING (
  invitee_email = (
    SELECT email FROM auth.users WHERE id = auth.uid()
  )
);

-- Update games query to filter by privacy
CREATE OR REPLACE VIEW public.public_games AS
SELECT g.*, 
       array_agg(
         json_build_object(
           'player_name', gp.player_name,
           'color', gp.color,
           'is_host', gp.is_host,
           'user_id', gp.user_id
         )
       ) FILTER (WHERE gp.id IS NOT NULL) as game_players
FROM public.games g
LEFT JOIN public.game_players gp ON g.id = gp.game_id
WHERE g.is_public = true 
  AND g.deleted_at IS NULL
GROUP BY g.id;