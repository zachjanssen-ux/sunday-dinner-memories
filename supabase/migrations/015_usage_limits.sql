-- Add recipe count and audio minute limits to the system

-- Add audio_minutes_used to usage_tracking
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS audio_minutes_used decimal DEFAULT 0;
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS recipe_count integer DEFAULT 0;

-- Function to get current recipe count for a family
CREATE OR REPLACE FUNCTION get_family_recipe_count(p_family_id uuid)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM recipes WHERE family_id = p_family_id;
$$;

-- Function to get total audio minutes for a family
CREATE OR REPLACE FUNCTION get_family_audio_minutes(p_family_id uuid)
RETURNS decimal
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(SUM(duration_seconds), 0) / 60.0 FROM audio_memories WHERE family_id = p_family_id;
$$;

-- Update existing usage_tracking rows with current counts
UPDATE usage_tracking ut
SET
  recipe_count = (SELECT COUNT(*)::integer FROM recipes WHERE family_id = ut.family_id),
  audio_minutes_used = (SELECT COALESCE(SUM(duration_seconds), 0) / 60.0 FROM audio_memories WHERE family_id = ut.family_id);
