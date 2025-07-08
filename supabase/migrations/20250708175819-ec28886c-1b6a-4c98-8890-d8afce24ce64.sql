-- Add RLS policy to allow game creators to delete their games
CREATE POLICY "Game creators can delete their games" 
ON public.games 
FOR DELETE 
USING (auth.uid() = created_by);

-- Add a deleted_at column to track when games were deleted (soft delete)
ALTER TABLE public.games ADD COLUMN deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;

-- Create index on deleted_at for better query performance
CREATE INDEX idx_games_deleted_at ON public.games(deleted_at);