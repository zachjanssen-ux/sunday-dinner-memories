-- Add bonus columns for add-on pack purchases
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS bonus_scans integer DEFAULT 0;
ALTER TABLE usage_tracking ADD COLUMN IF NOT EXISTS bonus_audio_minutes decimal DEFAULT 0;
