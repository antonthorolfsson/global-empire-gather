-- Add RLS policy to allow game creators to delete their games
CREATE POLICY "Game creators can delete their games" 
ON public.games 
FOR DELETE 
USING (auth.uid() = created_by);

-- Add status column values for better game management
-- The games table already has a status column, but let's ensure we have the right values
-- Status values: 'waiting', 'active', 'paused', 'completed'

-- Add a deleted_at column to track when games were deleted (soft delete)
ALTER TABLE public.games ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index on deleted_at for better query performance
CREATE INDEX idx_games_deleted_at ON public.games(deleted_at);

-- Create trigger to update the updated_at timestamp when games are updated
CREATE TRIGGER update_games_updated_at
  BEFORE UPDATE ON public.games
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();