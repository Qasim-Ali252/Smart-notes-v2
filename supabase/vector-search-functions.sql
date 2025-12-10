-- Function to search notes by vector similarity
CREATE OR REPLACE FUNCTION match_notes(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  title text,
  content text,
  tags text[],
  summary text,
  key_topics text[],
  embedding vector(768),
  user_id uuid,
  created_at timestamptz,
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
    notes.embedding,
    notes.user_id,
    notes.created_at,
    notes.updated_at,
    1 - (notes.embedding <=> query_embedding) as similarity
  FROM notes
  WHERE notes.user_id = p_user_id
    AND notes.embedding IS NOT NULL
    AND 1 - (notes.embedding <=> query_embedding) > match_threshold
  ORDER BY notes.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Function to search documents by vector similarity
CREATE OR REPLACE FUNCTION match_documents(
  query_embedding vector(768),
  match_threshold float DEFAULT 0.5,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL
)
RETURNS TABLE (
  id uuid,
  file_name text,
  file_path text,
  file_size bigint,
  summary text,
  extracted_text text,
  key_insights text[],
  topic_labels text[],
  embedding vector(768),
  note_id uuid,
  note_title text,
  user_id uuid,
  created_at timestamptz,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    d.id,
    d.file_name,
    d.file_path,
    d.file_size,
    d.summary,
    d.extracted_text,
    d.key_insights,
    d.topic_labels,
    d.embedding,
    d.note_id,
    n.title as note_title,
    d.user_id,
    d.created_at,
    1 - (d.embedding <=> query_embedding) as similarity
  FROM documents d
  LEFT JOIN notes n ON d.note_id = n.id
  WHERE d.user_id = p_user_id
    AND d.embedding IS NOT NULL
    AND 1 - (d.embedding <=> query_embedding) > match_threshold
  ORDER BY d.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION match_notes TO authenticated;
GRANT EXECUTE ON FUNCTION match_documents TO authenticated;
