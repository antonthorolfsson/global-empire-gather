-- First, update the RLS policies to use auth.email() directly instead of get_current_user_email()
-- This removes the dependency on the SECURITY DEFINER function

-- Drop existing policies that use get_current_user_email()
DROP POLICY IF EXISTS "Game invitations are viewable by inviter and invitee" ON game_invitations;
DROP POLICY IF EXISTS "Invitees can update invitation status" ON game_invitations;

-- Recreate policies using auth.email() directly
CREATE POLICY "Game invitations are viewable by inviter and invitee" 
ON game_invitations 
FOR SELECT 
USING (
  inviter_id = auth.uid() OR 
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

CREATE POLICY "Invitees can update invitation status" 
ON game_invitations 
FOR UPDATE 
USING (
  invitee_email = (SELECT email FROM auth.users WHERE id = auth.uid())
);

-- Now we can safely drop the get_current_user_email function
DROP FUNCTION IF EXISTS public.get_current_user_email();

-- Update handle_new_user function to remove SECURITY DEFINER
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data ->> 'display_name', NEW.email));
  RETURN NEW;
END;
$function$;

-- Recreate the trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();