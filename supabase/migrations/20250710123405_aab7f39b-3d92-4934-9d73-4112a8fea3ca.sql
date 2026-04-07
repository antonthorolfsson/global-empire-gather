-- Update get_current_user_email function to remove SECURITY DEFINER
-- This function can work without SECURITY DEFINER since it only accesses auth.users
-- which is accessible to authenticated users for their own data
DROP FUNCTION IF EXISTS public.get_current_user_email() CASCADE;

CREATE OR REPLACE FUNCTION public.get_current_user_email()
RETURNS text
LANGUAGE sql
STABLE
AS $function$
  SELECT email FROM auth.users WHERE id = auth.uid();
$function$;

-- Update handle_new_user function to remove SECURITY DEFINER
-- Note: This trigger function needs to insert into profiles table
-- We'll keep it but remove SECURITY DEFINER and rely on proper RLS policies
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

-- Recreate the trigger since we dropped the function with CASCADE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();