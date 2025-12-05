-- SAFE VERSION: Add embeddings for Gemini (no destructive operations)
-- This version only ADDS columns, never removes them

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column for notes (768 dimensions for Gemini)
-- Only adds if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'notes' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE notes ADD COLUMN embedding vector(768);
  END IF;
END $$;

-- Add embedding column for documents (768 dimensions for Gemini)
-- Only adds if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'documents' AND column_name = 'embedding'
  ) THEN
    ALTER TABLE documents ADD COLUMN embedding vector(768);
  END IF;
END $$;

-- Create indexes for fast similarity search (only if they don't exist)
CREATE INDEX IF NOT EXISTS notes_embedding_idx ON notes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to search notes by similarity
CREATE OR REPLACE FUNCTION search_notes_semantic(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  tags text[],
  summary text,
  key_topics text[],
  updated_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    notes.id,
    notes.title,
    notes.content,
    notes.tags,
    notes.summary,
    notes.key_topics,
    notes.updated_at,
    1 - (notes.embedding <=> query_embedding) as similarity
  FROM notes
  WHERE (user_id_filter IS NULL OR notes.user_id = user_id_filter)
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search documents by similarity
CREATE OR REPLACE FUNCTION search_documents_semantic(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_path text,
  summary text,
  key_insights text[],
  topic_labels text[],
  note_id uuid,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    documents.id,
    documents.file_name,
    documents.file_path,
    documents.summary,
    documents.key_insights,
    documents.topic_labels,
    documents.note_id,
    documents.created_at,
    1 - (documents.embedding <=> query_embedding) as similarity
  FROM documents
  WHERE (user_id_filter IS NULL OR documents.user_id = user_id_filter)
    AND documents.embedding IS NOT NULL
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  ORDER BY documents.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search both notes and documents
CREATE OR REPLACE FUNCTION search_all_semantic(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 20,
  user_id_filter uuid DEFAULT NULL
)
RETURNS TABLE (
  result_type text,
  id uuid,
  title text,
  content text,
  summary text,
  note_id uuid,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  -- Search notes
  SELECT
    'note'::text as result_type,
    notes.id,
    notes.title,
    notes.content,
    notes.summary,
    notes.id as note_id,
    notes.updated_at as created_at,
    1 - (notes.embedding <=> query_embedding) as similarity
  FROM notes
  WHERE (user_id_filter IS NULL OR notes.user_id = user_id_filter)
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  
  UNION ALL
  
  -- Search documents
  SELECT
    'document'::text as result_type,
    documents.id,
    documents.file_name as title,
    documents.summary as content,
    documents.summary,
    documents.note_id,
    documents.created_at,
    1 - (documents.embedding <=> query_embedding) as similarity
  FROM documents
  WHERE (user_id_filter IS NULL OR documents.user_id = user_id_filter)
    AND documents.embedding IS NOT NULL
    AND 1 - (documents.embedding <=> query_embedding) > match_threshold
  
  ORDER BY similarity DESC
  LIMIT match_count;
END;
$$;

-- Verify setup
SELECT 
  'Setup Complete!' as status,
  'notes' as table_name,
  COUNT(*) as total_rows,
  COUNT(embedding) as rows_with_embeddings,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 2)
    ELSE 0
  END as coverage_percent
FROM notes
UNION ALL
SELECT 
  'Setup Complete!' as status,
  'documents' as table_name,
  COUNT(*) as total_rows,
  COUNT(embedding) as rows_with_embeddings,
  CASE 
    WHEN COUNT(*) > 0 THEN ROUND(COUNT(embedding)::numeric / COUNT(*)::numeric * 100, 2)
    ELSE 0
  END as coverage_percent
FROM documents;
