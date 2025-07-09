-- Create a security definer function to get current user email
CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS TEXT AS $$
  SELECT email FROM auth.users WHERE id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Game invitations are viewable by inviter and invitee" ON public.game_invitations;
DROP POLICY IF EXISTS "Invitees can update invitation status" ON public.game_invitations;

-- Create new policies using the security definer function
CREATE POLICY "Game invitations are viewable by inviter and invitee" 
ON public.game_invitations 
FOR SELECT 
USING (
  (inviter_id = auth.uid()) OR 
  (invitee_email = public.get_current_user_email())
);

CREATE POLICY "Invitees can update invitation status" 
ON public.game_invitations 
FOR UPDATE 
USING (invitee_email = public.get_current_user_email());