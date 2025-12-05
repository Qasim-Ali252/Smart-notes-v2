-- Add topics column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS topics TEXT[] DEFAULT '{}';

-- Create index for topic search
CREATE INDEX IF NOT EXISTS idx_documents_topics ON documents USING GIN(topics);

-- Update existing documents to have empty topics if null
UPDATE documents SET topics = '{}' WHERE topics IS NULL;
    