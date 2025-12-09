-- Enable pg_trgm extension for fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create GIN index on Post.title for faster trigram search
CREATE INDEX IF NOT EXISTS idx_post_title_trgm ON "Post" USING GIN (title gin_trgm_ops);

-- Function to search posts by title using fuzzy matching
-- Supports searching across all posts, within a specific community, or in feed
CREATE OR REPLACE FUNCTION search_posts(
  search_query TEXT,
  community_id_filter UUID DEFAULT NULL,
  limit_count INT DEFAULT 20,
  offset_count INT DEFAULT 0
)
RETURNS TABLE (
  id UUID,
  title VARCHAR,
  content TEXT,
  user_id UUID,
  community_id UUID,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  likes_count INT,
  dislikes_count INT,
  comments_count INT,
  engagement_score DOUBLE PRECISION,
  similarity REAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.title,
    p.content,
    p.user_id,
    p.community_id,
    p.created_at,
    p.updated_at,
    p.likes_count,
    p.dislikes_count,
    p.comments_count,
    p.engagement_score,
    SIMILARITY(p.title, search_query) as similarity
  FROM "Post" p
  WHERE 
    -- Fuzzy match using pg_trgm similarity
    p.title % search_query
    -- Optional community filter
    AND (community_id_filter IS NULL OR p.community_id = community_id_filter)
  ORDER BY 
    -- Order by similarity score (higher is better)
    SIMILARITY(p.title, search_query) DESC,
    -- Then by creation date for same similarity
    p.created_at DESC
  LIMIT limit_count
  OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;


-- trigram have trouble with search length < 4, so we can adjust the function to handle short queries better
-- Adjusted search_posts to handle short queries better
-- CREATE OR REPLACE FUNCTION search_posts(
--   search_query TEXT,
--   community_id_filter UUID DEFAULT NULL,
--   limit_count INT DEFAULT 20,
--   offset_count INT DEFAULT 0
-- )
-- RETURNS TABLE (
--   id UUID,
--   title VARCHAR,
--   content TEXT,
--   user_id UUID,
--   community_id UUID,
--   created_at TIMESTAMP,
--   updated_at TIMESTAMP,
--   likes_count INT,
--   dislikes_count INT,
--   comments_count INT,
--   engagement_score DOUBLE PRECISION,
--   similarity REAL
-- ) AS $$
-- DECLARE
--   q TEXT;
--   use_trgm BOOLEAN;
-- BEGIN
--   q := trim(coalesce(search_query, ''));
--   IF q = '' THEN
--     RETURN; -- no rows for empty query; change behavior if desired
--   END IF;

--   -- Decide whether to use pg_trgm similarity or prefix match
--   use_trgm := char_length(q) >= 4;

--   IF use_trgm THEN
--     RETURN QUERY
--     SELECT *
--     FROM (
--       SELECT 
--         p.id,
--         p.title,
--         p.content,
--         p.user_id,
--         p.community_id,
--         p.created_at,
--         p.updated_at,
--         p.likes_count,
--         p.dislikes_count,
--         p.comments_count,
--         p.engagement_score,
--         SIMILARITY(p.title, q) AS similarity
--       FROM "Post" p
--       WHERE (community_id_filter IS NULL OR p.community_id = community_id_filter)
--         AND p.title % q
--     ) t
--     ORDER BY similarity DESC, created_at DESC
--     LIMIT limit_count
--     OFFSET offset_count;
--   ELSE
--     -- Short queries: use case-insensitive prefix match for better results
--     RETURN QUERY
--     SELECT 
--       p.id,
--       p.title,
--       p.content,
--       p.user_id,
--       p.community_id,
--       p.created_at,
--       p.updated_at,
--       p.likes_count,
--       p.dislikes_count,
--       p.comments_count,
--       p.engagement_score,
--       0.0::real AS similarity
--     FROM "Post" p
--     WHERE (community_id_filter IS NULL OR p.community_id = community_id_filter)
--       AND p.title ILIKE q || '%'
--     ORDER BY created_at DESC
--     LIMIT limit_count
--     OFFSET offset_count;
--   END IF;
-- END;
-- $$ LANGUAGE plpgsql;