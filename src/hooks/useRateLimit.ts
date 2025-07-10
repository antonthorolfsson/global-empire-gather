import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { toast } from '@/hooks/use-toast';

interface RateLimitConfig {
  maxCount: number;
  windowMinutes: number;
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  game_creation: { maxCount: 5, windowMinutes: 60 },
  war_declaration: { maxCount: 10, windowMinutes: 60 },
  email_invitation: { maxCount: 20, windowMinutes: 1440 }, // 24 hours
  chess_move: { maxCount: 100, windowMinutes: 60 },
};

export const useRateLimit = () => {
  const [isChecking, setIsChecking] = useState(false);
  const { user } = useAuth();

  const checkRateLimit = async (actionType: string): Promise<boolean> => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You must be logged in to perform this action.",
        variant: "destructive",
      });
      return false;
    }

    const config = RATE_LIMITS[actionType];
    if (!config) {
      console.warn(`Unknown action type for rate limiting: ${actionType}`);
      return true;
    }

    setIsChecking(true);
    
    try {
      const { data, error } = await supabase.rpc('check_rate_limit', {
        _user_id: user.id,
        _action_type: actionType,
        _max_count: config.maxCount,
        _window_minutes: config.windowMinutes,
      });

      if (error) {
        console.error('Rate limit check failed:', error);
        return true; // Allow action if check fails
      }

      if (!data) {
        const windowText = config.windowMinutes >= 60 
          ? `${config.windowMinutes / 60} hour${config.windowMinutes / 60 > 1 ? 's' : ''}`
          : `${config.windowMinutes} minute${config.windowMinutes > 1 ? 's' : ''}`;
        
        toast({
          title: "Rate limit exceeded",
          description: `You can only perform this action ${config.maxCount} times per ${windowText}. Please try again later.`,
          variant: "destructive",
        });
        return false;
      }

      return true;
    } catch (error) {
      console.error('Rate limit check error:', error);
      return true; // Allow action if check fails
    } finally {
      setIsChecking(false);
    }
  };

  return {
    checkRateLimit,
    isChecking,
  };
};