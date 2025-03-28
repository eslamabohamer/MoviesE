
-- Add visit count column to content table
ALTER TABLE IF EXISTS public.content
ADD COLUMN IF NOT EXISTS visit_count integer DEFAULT 0;

-- Add indexes for better performance on filtering
CREATE INDEX IF NOT EXISTS idx_content_visit_count ON public.content(visit_count);
CREATE INDEX IF NOT EXISTS idx_content_release_year ON public.content(release_year);
CREATE INDEX IF NOT EXISTS idx_content_created_at ON public.content(created_at);
