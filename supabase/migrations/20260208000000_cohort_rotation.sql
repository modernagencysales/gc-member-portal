-- Cohort Rotation: Add Draft status, rotation tracking, and bootcamp_cohorts dates

-- 1. Add 'Draft' to lms_cohorts status CHECK constraint
ALTER TABLE lms_cohorts DROP CONSTRAINT IF EXISTS lms_cohorts_status_check;
ALTER TABLE lms_cohorts ADD CONSTRAINT lms_cohorts_status_check
  CHECK (status IN ('Active', 'Archived', 'Draft'));

-- 2. Add 'Draft' to bootcamp_cohorts status CHECK constraint
ALTER TABLE bootcamp_cohorts DROP CONSTRAINT IF EXISTS bootcamp_cohorts_status_check;
ALTER TABLE bootcamp_cohorts ADD CONSTRAINT bootcamp_cohorts_status_check
  CHECK (status IN ('Active', 'Archived', 'Draft'));

-- 3. Add rotation_id to lms_cohorts for idempotency tracking
ALTER TABLE lms_cohorts ADD COLUMN IF NOT EXISTS rotation_id TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS idx_lms_cohorts_rotation_id
  ON lms_cohorts (rotation_id) WHERE rotation_id IS NOT NULL;

-- 4. Add start_date and end_date to bootcamp_cohorts
ALTER TABLE bootcamp_cohorts ADD COLUMN IF NOT EXISTS start_date DATE;
ALTER TABLE bootcamp_cohorts ADD COLUMN IF NOT EXISTS end_date DATE;

-- 5. Update duplicate_lms_cohort() RPC to accept optional status parameter
CREATE OR REPLACE FUNCTION duplicate_lms_cohort(
  source_cohort_id UUID,
  new_cohort_name TEXT,
  new_cohort_description TEXT DEFAULT NULL,
  new_cohort_status TEXT DEFAULT 'Draft'
)
RETURNS UUID AS $$
DECLARE
  new_cohort_id UUID;
  week_mapping JSONB := '{}';
  lesson_mapping JSONB := '{}';
  old_week_id UUID;
  new_week_id UUID;
  old_lesson_id UUID;
  new_lesson_id UUID;
  week_row RECORD;
  lesson_row RECORD;
  content_row RECORD;
  action_row RECORD;
BEGIN
  -- Create the new cohort with specified status
  INSERT INTO lms_cohorts (name, description, status)
  VALUES (new_cohort_name, COALESCE(new_cohort_description, 'Duplicated from existing cohort'), new_cohort_status)
  RETURNING id INTO new_cohort_id;

  -- Copy all weeks
  FOR week_row IN
    SELECT * FROM lms_weeks WHERE cohort_id = source_cohort_id ORDER BY sort_order
  LOOP
    INSERT INTO lms_weeks (cohort_id, title, description, sort_order, is_visible)
    VALUES (new_cohort_id, week_row.title, week_row.description, week_row.sort_order, week_row.is_visible)
    RETURNING id INTO new_week_id;

    -- Store the week mapping
    week_mapping := week_mapping || jsonb_build_object(week_row.id::text, new_week_id::text);

    -- Copy lessons for this week
    FOR lesson_row IN
      SELECT * FROM lms_lessons WHERE week_id = week_row.id ORDER BY sort_order
    LOOP
      INSERT INTO lms_lessons (week_id, title, description, sort_order, is_visible)
      VALUES (new_week_id, lesson_row.title, lesson_row.description, lesson_row.sort_order, lesson_row.is_visible)
      RETURNING id INTO new_lesson_id;

      -- Store the lesson mapping
      lesson_mapping := lesson_mapping || jsonb_build_object(lesson_row.id::text, new_lesson_id::text);

      -- Copy content items for this lesson
      FOR content_row IN
        SELECT * FROM lms_content_items WHERE lesson_id = lesson_row.id ORDER BY sort_order
      LOOP
        INSERT INTO lms_content_items (
          lesson_id, title, content_type, embed_url, ai_tool_slug,
          content_text, credentials_data, description, sort_order, is_visible
        )
        VALUES (
          new_lesson_id, content_row.title, content_row.content_type, content_row.embed_url,
          content_row.ai_tool_slug, content_row.content_text, content_row.credentials_data,
          content_row.description, content_row.sort_order, content_row.is_visible
        );
      END LOOP;
    END LOOP;

    -- Copy action items for this week
    FOR action_row IN
      SELECT * FROM lms_action_items WHERE week_id = week_row.id ORDER BY sort_order
    LOOP
      INSERT INTO lms_action_items (week_id, text, description, sort_order, assigned_to_email, is_visible)
      VALUES (new_week_id, action_row.text, action_row.description, action_row.sort_order,
              action_row.assigned_to_email, action_row.is_visible);
    END LOOP;
  END LOOP;

  RETURN new_cohort_id;
END;
$$ LANGUAGE plpgsql;
