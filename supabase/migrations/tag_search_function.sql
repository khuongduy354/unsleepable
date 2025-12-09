-- Enhanced search with tag filtering that wraps existing search_posts
CREATE OR REPLACE FUNCTION search_posts_with_tags(
  search_query TEXT,
  or_tags TEXT[] DEFAULT NULL,
  and_tags TEXT[] DEFAULT NULL,
  not_tags TEXT[] DEFAULT NULL,
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
  -- If no tag filters, just use the existing search_posts function
  IF or_tags IS NULL AND and_tags IS NULL AND not_tags IS NULL THEN
    RETURN QUERY
    SELECT * FROM search_posts(search_query, community_id_filter, limit_count, offset_count);
    RETURN;
  END IF;

  -- With tag filters: first get fuzzy search results, then apply tag filtering
  RETURN QUERY
  WITH fuzzy_results AS (
    SELECT * FROM search_posts(search_query, community_id_filter, 1000, 0)
  ),
  tag_filtered AS (
    SELECT DISTINCT fr.*
    FROM fuzzy_results fr
    WHERE 
      -- OR condition: must have at least one tag from or_tags
      (or_tags IS NULL OR EXISTS (
        SELECT 1 FROM "PostTag" pt
        INNER JOIN "Tag" t ON pt.tag_id = t.id
        WHERE pt.post_id = fr.id AND t."Name" = ANY(or_tags)
      ))
      -- AND condition: must have all tags from and_tags
      AND (and_tags IS NULL OR (
        SELECT COUNT(DISTINCT t."Name")
        FROM "PostTag" pt
        INNER JOIN "Tag" t ON pt.tag_id = t.id
        WHERE pt.post_id = fr.id AND t."Name" = ANY(and_tags)
      ) = array_length(and_tags, 1))
      -- NOT condition: must not have any tags from not_tags
      AND (not_tags IS NULL OR NOT EXISTS (
        SELECT 1 FROM "PostTag" pt
        INNER JOIN "Tag" t ON pt.tag_id = t.id
        WHERE pt.post_id = fr.id AND t."Name" = ANY(not_tags)
      ))
  )
  SELECT *
  FROM tag_filtered
  ORDER BY engagement_score DESC, similarity DESC, created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$ LANGUAGE plpgsql;
