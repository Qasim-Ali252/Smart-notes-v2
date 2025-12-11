-- Enable the pgvector extension if not already enabled
CREATE EXTENSION IF NOT EXISTS vector;

-- Function to match notes using vector similarity
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  summary text,
  tags text[],
  key_topics text[],
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
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
    notes.summary,
    notes.tags,
    notes.key_topics,
    notes.created_at,
    notes.updated_at,
    notes.user_id,
    (notes.embedding <#> query_embedding) * -1 AS similarity
  FROM notes
  WHERE 
    (p_user_id IS NULL OR notes.user_id = p_user_id)
    AND notes.embedding IS NOT NULL
    AND (notes.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY notes.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to match documents using vector similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(1536),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_path text,
  file_size bigint,
  extracted_text text,
  summary text,
  key_insights text[],
  topic_labels text[],
  note_id uuid,
  created_at timestamptz,
  updated_at timestamptz,
  user_id uuid,
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
    documents.file_size,
    documents.extracted_text,
    documents.summary,
    documents.key_insights,
    documents.topic_labels,
    documents.note_id,
    documents.created_at,
    documents.updated_at,
    documents.user_id,
    (documents.embedding <#> query_embedding) * -1 AS similarity
  FROM documents
  WHERE 
    (p_user_id IS NULL OR documents.user_id = p_user_id)
    AND documents.embedding IS NOT NULL
    AND (documents.embedding <#> query_embedding) * -1 > match_threshold
  ORDER BY documents.embedding <#> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_notes TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;

-- Create indexes for better performance if they don't exist
CREATE INDEX IF NOT EXISTS notes_embedding_idx ON notes USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX IF NOT EXISTS documents_embedding_idx ON documents USING ivfflat (embedding vector_cosine_ops);