-- Enhanced Database Security Improvements

-- Create rate limiting tables
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL,
  action_count INTEGER NOT NULL DEFAULT 1,
  window_start TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, action_type, window_start)
);

-- Enable RLS on rate_limits
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- RLS policies for rate_limits
DROP POLICY IF EXISTS "Users can view their own rate limits" ON public.rate_limits;
CREATE POLICY "Users can view their own rate limits" 
ON public.rate_limits 
FOR SELECT 
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own rate limits" ON public.rate_limits;
CREATE POLICY "Users can insert their own rate limits" 
ON public.rate_limits 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own rate limits" ON public.rate_limits;
CREATE POLICY "Users can update their own rate limits" 
ON public.rate_limits 
FOR UPDATE 
USING (auth.uid() = user_id);

-- Create audit log table
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  action_type TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  details JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on audit_logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- RLS policies for audit_logs (admin-only viewing for now)
DROP POLICY IF EXISTS "System can insert audit logs" ON public.audit_logs;
CREATE POLICY "System can insert audit logs" 
ON public.audit_logs 
FOR INSERT 
WITH CHECK (true);

-- Create rate limiting function
CREATE OR REPLACE FUNCTION public.check_rate_limit(
  _user_id UUID,
  _action_type TEXT,
  _max_count INTEGER,
  _window_minutes INTEGER DEFAULT 60
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_window TIMESTAMP WITH TIME ZONE;
  current_count INTEGER;
BEGIN
  -- Calculate the current window start time
  current_window := date_trunc('hour', now()) + 
    (EXTRACT(minute FROM now())::integer / _window_minutes) * (_window_minutes || ' minutes')::interval;
  
  -- Get current count for this window
  SELECT COALESCE(action_count, 0) INTO current_count
  FROM public.rate_limits
  WHERE user_id = _user_id 
    AND action_type = _action_type 
    AND window_start = current_window;
  
  -- Check if limit exceeded
  IF current_count >= _max_count THEN
    RETURN FALSE;
  END IF;
  
  -- Increment or create rate limit record
  INSERT INTO public.rate_limits (user_id, action_type, action_count, window_start)
  VALUES (_user_id, _action_type, COALESCE(current_count, 0) + 1, current_window)
  ON CONFLICT (user_id, action_type, window_start)
  DO UPDATE SET 
    action_count = rate_limits.action_count + 1,
    created_at = now();
  
  RETURN TRUE;
END;
$$;

-- Create audit logging function
CREATE OR REPLACE FUNCTION public.log_audit_event(
  _user_id UUID,
  _action_type TEXT,
  _resource_type TEXT,
  _resource_id UUID DEFAULT NULL,
  _details JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.audit_logs (
    user_id, 
    action_type, 
    resource_type, 
    resource_id, 
    details
  )
  VALUES (
    _user_id,
    _action_type,
    _resource_type,
    _resource_id,
    _details
  );
END;
$$;

-- Enhanced input validation function
CREATE OR REPLACE FUNCTION public.validate_game_input(
  _name TEXT,
  _max_players INTEGER
)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
BEGIN
  -- Validate game name
  IF _name IS NULL OR length(trim(_name)) < 3 OR length(trim(_name)) > 50 THEN
    RAISE EXCEPTION 'Game name must be between 3 and 50 characters';
  END IF;
  
  -- Check for dangerous characters
  IF _name ~ '[<>"\''&]' THEN
    RAISE EXCEPTION 'Game name contains invalid characters';
  END IF;
  
  -- Validate max players
  IF _max_players < 2 OR _max_players > 8 THEN
    RAISE EXCEPTION 'Max players must be between 2 and 8';
  END IF;
  
  RETURN TRUE;
END;
$$;

-- Enhanced handle_new_user function with validation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  display_name_value TEXT;
BEGIN
  -- Validate that this is being called from auth trigger context
  IF TG_TABLE_SCHEMA != 'auth' OR TG_TABLE_NAME != 'users' THEN
    RAISE EXCEPTION 'Function can only be called from auth.users trigger';
  END IF;
  
  -- Sanitize display name
  display_name_value := COALESCE(
    trim(NEW.raw_user_meta_data ->> 'display_name'), 
    NEW.email
  );
  
  -- Validate display name length and content
  IF length(display_name_value) > 100 THEN
    display_name_value := left(display_name_value, 100);
  END IF;
  
  -- Remove potentially dangerous characters
  display_name_value := regexp_replace(display_name_value, '[<>"\''&]', '', 'g');
  
  -- Insert profile with validated data
  INSERT INTO public.profiles (user_id, display_name)
  VALUES (NEW.id, display_name_value);
  
  -- Log the user creation
  PERFORM public.log_audit_event(
    NEW.id,
    'user_created',
    'profile',
    NULL,
    jsonb_build_object('email', NEW.email, 'created_at', NEW.created_at)
  );
  
  RETURN NEW;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_action_window ON public.rate_limits(user_id, action_type, window_start);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_created ON public.audit_logs(user_id, created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_resource ON public.audit_logs(action_type, resource_type, created_at);

-- Clean up old rate limit records (keep last 24 hours)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  DELETE FROM public.rate_limits 
  WHERE created_at < now() - interval '24 hours';
END;
$$;