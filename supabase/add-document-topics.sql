-- Add topic_labels column to documents table
ALTER TABLE documents ADD COLUMN IF NOT EXISTS topic_labels TEXT[] DEFAULT '{}';

-- Create index for topic search
CREATE INDEX IF NOT EXISTS idx_documents_topic_labels ON documents USING GIN(topic_labels);

-- Update existing documents to have empty topic_labels if null
UPDATE documents SET topic_labels = '{}' WHERE topic_labels IS NULL;
