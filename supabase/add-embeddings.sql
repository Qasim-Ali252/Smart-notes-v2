-- Add embedding column to notes table for vector search
-- This enables fast semantic search

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column (1536 dimensions for OpenAI ada-002)
ALTER TABLE notes ADD COLUMN IF NOT EXISTS embedding vector(1536);

-- Create index for fast similarity search
CREATE INDEX IF NOT EXISTS notes_embedding_idx ON notes 
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Function to search notes by similarity
CREATE OR REPLACE FUNCTION search_notes(
  query_embedding vector(1536),
  match_threshold float,
  match_count int,
  user_id_filter uuid
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
  WHERE notes.user_id = user_id_filter
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
