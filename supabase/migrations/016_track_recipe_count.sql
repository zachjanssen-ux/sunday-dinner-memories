-- Auto-increment recipe_count in usage_tracking when a recipe is created
-- and audio_minutes_used when an audio memory is saved

-- Trigger function: increment recipe count
CREATE OR REPLACE FUNCTION increment_recipe_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE usage_tracking
  SET recipe_count = recipe_count + 1,
      last_updated = now()
  WHERE family_id = NEW.family_id;

  -- If no row exists yet, create one
  IF NOT FOUND THEN
    INSERT INTO usage_tracking (family_id, recipe_count, last_updated)
    VALUES (NEW.family_id, 1, now());
  END IF;

  RETURN NEW;
END;
$$;

-- Trigger function: decrement recipe count
CREATE OR REPLACE FUNCTION decrement_recipe_count()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE usage_tracking
  SET recipe_count = GREATEST(0, recipe_count - 1),
      last_updated = now()
  WHERE family_id = OLD.family_id;
  RETURN OLD;
END;
$$;

-- Trigger function: update audio minutes
CREATE OR REPLACE FUNCTION update_audio_minutes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE usage_tracking
    SET audio_minutes_used = audio_minutes_used + COALESCE(NEW.duration_seconds, 0) / 60.0,
        last_updated = now()
    WHERE family_id = NEW.family_id;

    IF NOT FOUND THEN
      INSERT INTO usage_tracking (family_id, audio_minutes_used, last_updated)
      VALUES (NEW.family_id, COALESCE(NEW.duration_seconds, 0) / 60.0, now());
    END IF;

    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE usage_tracking
    SET audio_minutes_used = GREATEST(0, audio_minutes_used - COALESCE(OLD.duration_seconds, 0) / 60.0),
        last_updated = now()
    WHERE family_id = OLD.family_id;

    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS recipe_count_increment ON recipes;
CREATE TRIGGER recipe_count_increment
  AFTER INSERT ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION increment_recipe_count();

DROP TRIGGER IF EXISTS recipe_count_decrement ON recipes;
CREATE TRIGGER recipe_count_decrement
  AFTER DELETE ON recipes
  FOR EACH ROW
  EXECUTE FUNCTION decrement_recipe_count();

DROP TRIGGER IF EXISTS audio_minutes_update_insert ON audio_memories;
CREATE TRIGGER audio_minutes_update_insert
  AFTER INSERT ON audio_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_minutes();

DROP TRIGGER IF EXISTS audio_minutes_update_delete ON audio_memories;
CREATE TRIGGER audio_minutes_update_delete
  AFTER DELETE ON audio_memories
  FOR EACH ROW
  EXECUTE FUNCTION update_audio_minutes();
