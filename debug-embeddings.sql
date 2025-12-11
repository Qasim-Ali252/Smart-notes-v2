-- Debug embeddings to understand the issue with negative values

-- Check embedding data types and formats
SELECT 
  id,
  title,
  CASE 
    WHEN embedding IS NULL THEN 'NULL'
    WHEN embedding::text LIKE '[-%' THEN 'STARTS_NEGATIVE'
    WHEN embedding::text LIKE '[0.%' THEN 'STARTS_POSITIVE'
    ELSE 'OTHER'
  END as embedding_type,
  LENGTH(embedding::text) as embedding_length,
  SUBSTRING(embedding::text, 1, 50) as embedding_preview
FROM notes 
WHERE user_id = (SELECT auth.uid())
ORDER BY created_at DESC
LIMIT 20;

-- Check if embeddings are proper vectors
SELECT 
  id,
  title,
  embedding IS NOT NULL as has_embedding,
  array_length(embedding::float[], 1) as embedding_dimensions
FROM notes 
WHERE user_id = (SELECT auth.uid())
  AND embedding IS NOT NULL
LIMIT 10;

-- Test vector similarity with a sample embedding
SELECT 
  id,
  title,
  embedding <#> '[0.1, 0.2, 0.3]'::vector as distance_test
FROM notes 
WHERE user_id = (SELECT auth.uid())
  AND embedding IS NOT NULL
LIMIT 5;