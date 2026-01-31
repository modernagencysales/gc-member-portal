-- Add configurable logo count settings per page
ALTER TABLE blueprint_settings ADD COLUMN IF NOT EXISTS max_logos_landing INTEGER DEFAULT 6;
ALTER TABLE blueprint_settings ADD COLUMN IF NOT EXISTS max_logos_blueprint INTEGER;
