-- Drop the existing trigger
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;

-- Create a smarter function that only updates updated_at when content changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update updated_at if title, content, summary, or key_topics changed
  -- Don't update for tags-only changes (pin/favorite)
  IF (NEW.title IS DISTINCT FROM OLD.title) OR
     (NEW.content IS DISTINCT FROM OLD.content) OR
     (NEW.summary IS DISTINCT FROM OLD.summary) OR
     (NEW.key_topics IS DISTINCT FROM OLD.key_topics) THEN
    NEW.updated_at = NOW();
  ELSE
    -- Preserve the old updated_at for metadata-only changes
    NEW.updated_at = OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
CREATE TRIGGER update_notes_updated_at
  BEFORE UPDATE ON notes
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Verify the trigger was created
SELECT tgname, tgrelid::regclass, tgenabled 
FROM pg_trigger 
WHERE tgname = 'update_notes_updated_at';
