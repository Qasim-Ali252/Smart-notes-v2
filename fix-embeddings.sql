-- Fix embedding issues by ensuring proper vector format

-- First, let's see what we have
SELECT 
  COUNT(*) as total_notes,
  COUNT(embedding) as notes_with_embeddings,
  COUNT(*) - COUNT(embedding) as notes_without_embeddings
FROM notes;

-- Check embedding dimensions
SELECT 
  id,
  title,
  array_length(embedding::float[], 1) as dimensions,
  CASE 
    WHEN embedding::text LIKE '[-%' THEN 'negative_start'
    WHEN embedding::text LIKE '[0.%' THEN 'positive_start'
    ELSE 'other'
  END as start_type
FROM notes 
WHERE embedding IS NOT NULL
LIMIT 10;

-- Update the search functions to use cosine similarity
-- (This should be run after the create-search-functions.sql update)

-- Test the updated function with a sample query
-- SELECT * FROM match_notes('[0.1,0.2,0.3]'::vector, 0.1, 5);