-- Add file_size column to documents table
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS file_size INTEGER;

-- Add topic_labels column if it doesn't exist (used by extract-document API)
ALTER TABLE documents 
ADD COLUMN IF NOT EXISTS topic_labels TEXT[];

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'documents' 
ORDER BY ordinal_position;
