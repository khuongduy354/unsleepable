


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pg_trgm" WITH SCHEMA "public";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE TYPE "public"."community_member_role" AS ENUM (
    'member',
    'admin'
);


ALTER TYPE "public"."community_member_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."count_active_posts_for_community"("community_id_param" "uuid") RETURNS TABLE("active_post_count" bigint)
    LANGUAGE "sql"
    AS $$
    WITH ActiveByComment AS (
        -- 1. Tìm các Post có ít nhất 1 Comment
        SELECT 
            P.id as post_id
        FROM 
            "Post" P
        JOIN 
            "Comments" C ON P.id = C.post_id
        WHERE
            P.community_id = community_id_param
        GROUP BY
            P.id
        HAVING 
            COUNT(C.id) >= 1

    ), ActiveByReaction AS (
        -- 2. Tìm các Post có ít nhất 20 Reactions
        SELECT 
            P.id as post_id
        FROM 
            "Post" P
        JOIN 
            "Reaction" R ON P.id = R.post_id -- Giả sử tên bảng Reactions là PostReaction
        WHERE
            P.community_id = community_id_param
        GROUP BY
            P.id
        HAVING 
            COUNT(R.id) >= 20
    )
    -- 3. Đếm số Post duy nhất thỏa mãn ĐK 1 HOẶC ĐK 2
    SELECT
        COUNT(DISTINCT post_id) AS active_post_count
    FROM (
        SELECT post_id FROM ActiveByComment
        UNION 
        SELECT post_id FROM ActiveByReaction
    ) AS CombinedActivePosts;
$$;


ALTER FUNCTION "public"."count_active_posts_for_community"("community_id_param" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_unique_username"("base_username" "text") RETURNS "text"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  new_username TEXT;
  counter INT := 0;
BEGIN
  new_username := base_username;
  WHILE EXISTS (SELECT 1 FROM public."UserAccount" WHERE username = new_username) LOOP
    counter := counter + 1;
    new_username := base_username || '_' || counter::TEXT;
  END LOOP;
  RETURN new_username;
END;
$$;


ALTER FUNCTION "public"."generate_unique_username"("base_username" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."get_pending_reports_by_community_and_admin"("target_community_id" "uuid", "admin_user_id" "uuid") RETURNS TABLE("id" "uuid", "reporter_user_id" "uuid", "reason" "text", "status" "text", "created_at" timestamp with time zone, "reported_post_id" "uuid", "reported_comment_id" "uuid", "community_id" "uuid", "entity_title" "text", "entity_content_preview" "text", "entity_type" "text")
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM "CommunityMember" cm
        WHERE cm.community_id = target_community_id
          AND cm.user_account_id = admin_user_id
          AND cm.role = 'admin'
    ) THEN
        RETURN;
    END IF;

    RETURN QUERY
    SELECT
        r.id,
        r.reporter_user_id,
        r.reason::text,
        r.status::text,
        -- Nếu created_at của bạn là timestamp without time zone, chuyển sang timestamptz:
        -- r.created_at AT TIME ZONE 'UTC'  -- nếu cần map từ UTC
        r.created_at::timestamp with time zone,
        r.reported_post_id,
        r.reported_comment_id,
        p.community_id,
        p.title::text,
        p.content::text,
        'POST'::text
    FROM "Report" r
    JOIN "Post" p ON r.reported_post_id = p.id
    WHERE r.status = 'PENDING' AND p.community_id = target_community_id

    UNION ALL

    SELECT
        r.id,
        r.reporter_user_id,
        r.reason::text,
        r.status::text,
        r.created_at::timestamp with time zone,
        r.reported_post_id,
        r.reported_comment_id,
        p.community_id,
        p.title::text,
        c.content::text,
        'COMMENT'::text
    FROM "Report" r
    JOIN "Comments" c ON r.reported_comment_id = c.id
    JOIN "Post" p ON c.post_id = p.id
    WHERE r.status = 'PENDING' AND p.community_id = target_community_id;
END;
$$;


ALTER FUNCTION "public"."get_pending_reports_by_community_and_admin"("target_community_id" "uuid", "admin_user_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  base_username TEXT;
  final_username TEXT;
BEGIN
  -- Determine base username from metadata or email
  base_username := COALESCE(
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'full_name',
    SPLIT_PART(NEW.email, '@', 1)
  );
  
  -- Generate unique username if needed
  final_username := public.generate_unique_username(base_username);
  
  INSERT INTO public."UserAccount" (id, email, username, created_at, status)
  VALUES (
    NEW.id,
    NEW.email,
    final_username,
    NOW(),
    'active'
  )
  ON CONFLICT (id) DO NOTHING;
  
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_posts"("search_query" "text", "community_id_filter" "uuid" DEFAULT NULL::"uuid", "current_user_id" "uuid" DEFAULT NULL::"uuid", "limit_count" integer DEFAULT 20, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" character varying, "content" "text", "user_id" "uuid", "username" character varying, "community_id" "uuid", "created_at" timestamp without time zone, "updated_at" timestamp without time zone, "likes_count" integer, "dislikes_count" integer, "comments_count" integer, "engagement_score" double precision, "similarity" real)
    LANGUAGE "plpgsql"
    AS $$
DECLARE
  q TEXT;
  use_trgm BOOLEAN;
BEGIN
  q := trim(coalesce(search_query, ''));

  -- Access predicate reused in multiple places:
  -- If community_id_filter IS NOT NULL:
  --   - allow if community is public
  --   - if private, allow only when current_user_id is an approved member
  -- If community_id_filter IS NULL:
  --   - only return posts from public communities
  IF q = '' THEN
    RETURN QUERY
    SELECT 
      p.id,
      p.title,
      p.content,
      p.user_id,
      u.username,
      p.community_id,
      p.created_at,
      p.updated_at,
      p.likes_count,
      p.dislikes_count,
      p.comments_count,
      p.engagement_score,
      1.0::real AS similarity
    FROM "Post" p
    INNER JOIN "Community" c ON p.community_id = c.id
    LEFT JOIN "UserAccount" u ON p.user_id = u.id
    WHERE p.status = 'approved'
      AND (
        -- Filter by a specific community
        (community_id_filter IS NOT NULL
         AND p.community_id = community_id_filter
         AND (
           -- If community is public allow everyone
           c.visibility = 'public'
           -- If private, only allow if user is an approved member
           OR (
             c.visibility = 'private'
             AND current_user_id IS NOT NULL
             AND EXISTS (
               SELECT 1 FROM "CommunityMember" cm
               WHERE cm.community_id = p.community_id
                 AND cm.user_account_id = current_user_id
                 AND cm.status = 'approved'
             )
           )
         )
        )
        -- No community filter: only public communities
        OR (community_id_filter IS NULL AND c.visibility = 'public')
      )
    ORDER BY p.engagement_score DESC, p.created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
    RETURN;
  END IF;

  use_trgm := char_length(q) >= 4;

  IF use_trgm THEN
    RETURN QUERY
    SELECT *
    FROM (
      SELECT 
        p.id,
        p.title,
        p.content,
        p.user_id,
        u.username,
        p.community_id,
        p.created_at,
        p.updated_at,
        p.likes_count,
        p.dislikes_count,
        p.comments_count,
        p.engagement_score,
        GREATEST(
          SIMILARITY(p.title, q),
          CASE
            WHEN q = '' THEN 0.0
            WHEN p.title ILIKE '%' || q || '%' THEN 0.7
            WHEN SIMILARITY(p.title, q) > 0.3 THEN SIMILARITY(p.title, q)
            WHEN p.content ILIKE '%' || q || '%' THEN 0.4
            ELSE 0.1
          END
        )::real AS similarity
      FROM "Post" p
      INNER JOIN "Community" c ON p.community_id = c.id
      LEFT JOIN "UserAccount" u ON p.user_id = u.id
      WHERE p.status = 'approved'
        AND (
          (community_id_filter IS NOT NULL
           AND p.community_id = community_id_filter
           AND (
             c.visibility = 'public'
             OR (
               c.visibility = 'private'
               AND current_user_id IS NOT NULL
               AND EXISTS (
                 SELECT 1 FROM "CommunityMember" cm
                 WHERE cm.community_id = p.community_id
                   AND cm.user_account_id = current_user_id
                   AND cm.status = 'approved'
               )
             )
           )
          )
          OR (community_id_filter IS NULL AND c.visibility = 'public')
        )
    ) t
    ORDER BY similarity DESC, engagement_score DESC, created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
  ELSE
    RETURN QUERY
    SELECT 
      p.id,
      p.title,
      p.content,
      p.user_id,
      u.username,
      p.community_id,
      p.created_at,
      p.updated_at,
      p.likes_count,
      p.dislikes_count,
      p.comments_count,
      p.engagement_score,
      0.5::real AS similarity
    FROM "Post" p
    INNER JOIN "Community" c ON p.community_id = c.id
    LEFT JOIN "UserAccount" u ON p.user_id = u.id
    WHERE p.status = 'approved'
      AND p.title ILIKE '%' || q || '%'
      AND (
        (community_id_filter IS NOT NULL
         AND p.community_id = community_id_filter
         AND (
           c.visibility = 'public'
           OR (
             c.visibility = 'private'
             AND current_user_id IS NOT NULL
             AND EXISTS (
               SELECT 1 FROM "CommunityMember" cm
               WHERE cm.community_id = p.community_id
                 AND cm.user_account_id = current_user_id
                 AND cm.status = 'approved'
             )
           )
         )
        )
        OR (community_id_filter IS NULL AND c.visibility = 'public')
      )
    ORDER BY created_at DESC
    LIMIT limit_count
    OFFSET offset_count;
  END IF;
END;
$$;


ALTER FUNCTION "public"."search_posts"("search_query" "text", "community_id_filter" "uuid", "current_user_id" "uuid", "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_posts_by_tags"("tag_names" "text"[], "search_mode" "text", "community_id_filter" "uuid" DEFAULT NULL::"uuid", "limit_count" integer DEFAULT 20, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" character varying, "content" "text", "user_id" "uuid", "community_id" "uuid", "created_at" timestamp without time zone, "updated_at" timestamp without time zone, "likes_count" integer, "dislikes_count" integer, "comments_count" integer, "engagement_score" double precision, "similarity" numeric)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF search_mode = 'AND' THEN
    -- Posts must have ALL specified tags
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
      1.0::NUMERIC AS similarity
    FROM "Post" p
    INNER JOIN "PostTag" pt ON p.id = pt.post_id
    INNER JOIN "Tag" t ON pt.tag_id = t.id
    WHERE 
      t."Name" = ANY(tag_names)
      AND (community_id_filter IS NULL OR p.community_id = community_id_filter)
    GROUP BY p.id, p.title, p.content, p.user_id, p.community_id, p.created_at, p.updated_at, 
             p.likes_count, p.dislikes_count, p.comments_count, p.engagement_score
    HAVING COUNT(DISTINCT t."Name") = array_length(tag_names, 1)
    ORDER BY p.engagement_score DESC, p.created_at DESC
    LIMIT limit_count OFFSET offset_count;

  ELSIF search_mode = 'OR' THEN
    -- Posts with ANY of the tags
    RETURN QUERY
    SELECT DISTINCT
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
      1.0::NUMERIC AS similarity
    FROM "Post" p
    INNER JOIN "PostTag" pt ON p.id = pt.post_id
    INNER JOIN "Tag" t ON pt.tag_id = t.id
    WHERE 
      t."Name" = ANY(tag_names)
      AND (community_id_filter IS NULL OR p.community_id = community_id_filter)
    ORDER BY p.engagement_score DESC, p.created_at DESC
    LIMIT limit_count OFFSET offset_count;

  ELSIF search_mode = 'NOT' THEN
    -- Exclude posts with these tags
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
      1.0::NUMERIC AS similarity
    FROM "Post" p
    WHERE 
      (community_id_filter IS NULL OR p.community_id = community_id_filter)
      AND p.id NOT IN (
        SELECT DISTINCT pt2.post_id
        FROM "PostTag" pt2
        INNER JOIN "Tag" t2 ON pt2.tag_id = t2.id
        WHERE t2."Name" = ANY(tag_names)
      )
    ORDER BY p.engagement_score DESC, p.created_at DESC
    LIMIT limit_count OFFSET offset_count;

  ELSE
    RAISE EXCEPTION 'Invalid search_mode: %. Must be AND, OR, or NOT', search_mode;
  END IF;
END;
$$;


ALTER FUNCTION "public"."search_posts_by_tags"("tag_names" "text"[], "search_mode" "text", "community_id_filter" "uuid", "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."search_posts_with_tags"("search_query" "text", "or_tags" "text"[] DEFAULT NULL::"text"[], "and_tags" "text"[] DEFAULT NULL::"text"[], "not_tags" "text"[] DEFAULT NULL::"text"[], "community_id_filter" "uuid" DEFAULT NULL::"uuid", "current_user_id" "uuid" DEFAULT NULL::"uuid", "limit_count" integer DEFAULT 20, "offset_count" integer DEFAULT 0) RETURNS TABLE("id" "uuid", "title" character varying, "content" "text", "user_id" "uuid", "username" character varying, "community_id" "uuid", "created_at" timestamp without time zone, "updated_at" timestamp without time zone, "likes_count" integer, "dislikes_count" integer, "comments_count" integer, "engagement_score" double precision, "similarity" real)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  -- If no tag filters, use the base search_posts function
  IF or_tags IS NULL AND and_tags IS NULL AND not_tags IS NULL THEN
    RETURN QUERY
    SELECT * FROM search_posts(search_query, community_id_filter, current_user_id, limit_count, offset_count);
    RETURN;
  END IF;

  -- With tag filters: first get search results (including empty query), then apply tag filtering
  RETURN QUERY
  WITH base_results AS (
    SELECT * FROM search_posts(search_query, community_id_filter, current_user_id, 1000, 0)
  ),
  tag_filtered AS (
    SELECT DISTINCT br.*
    FROM base_results br
    WHERE 
      -- OR condition: must have at least one tag from or_tags
      (or_tags IS NULL OR EXISTS (
        SELECT 1 FROM "PostTag" pt
        INNER JOIN "Tag" t ON pt.tag_id = t.id
        WHERE pt.post_id = br.id AND t."Name" = ANY(or_tags)
      ))
      -- AND condition: must have all tags from and_tags
      AND (and_tags IS NULL OR (
        SELECT COUNT(DISTINCT t."Name")
        FROM "PostTag" pt
        INNER JOIN "Tag" t ON pt.tag_id = t.id
        WHERE pt.post_id = br.id AND t."Name" = ANY(and_tags)
      ) = array_length(and_tags, 1))
      -- NOT condition: must not have any tags from not_tags
      AND (not_tags IS NULL OR NOT EXISTS (
        SELECT 1 FROM "PostTag" pt
        INNER JOIN "Tag" t ON pt.tag_id = t.id
        WHERE pt.post_id = br.id AND t."Name" = ANY(not_tags)
      ))
  )
  SELECT *
  FROM tag_filtered
  ORDER BY engagement_score DESC, similarity DESC, created_at DESC
  LIMIT limit_count OFFSET offset_count;
END;
$$;


ALTER FUNCTION "public"."search_posts_with_tags"("search_query" "text", "or_tags" "text"[], "and_tags" "text"[], "not_tags" "text"[], "community_id_filter" "uuid", "current_user_id" "uuid", "limit_count" integer, "offset_count" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_comments_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE "Post" 
    SET comments_count = comments_count + 1 
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE "Post" 
    SET comments_count = GREATEST(0, comments_count - 1)
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_post_comments_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_post_likes_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.type = 'like' AND NEW.post_id IS NOT NULL THEN
      UPDATE "Post" 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.post_id;
    ELSIF NEW.type = 'dislike' AND NEW.post_id IS NOT NULL THEN
      UPDATE "Post" 
      SET dislikes_count = dislikes_count + 1 
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    IF OLD.type = 'like' AND OLD.post_id IS NOT NULL THEN
      UPDATE "Post" 
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.post_id;
    ELSIF OLD.type = 'dislike' AND OLD.post_id IS NOT NULL THEN
      UPDATE "Post" 
      SET dislikes_count = GREATEST(0, dislikes_count - 1)
      WHERE id = OLD.post_id;
    END IF;
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Handle type change
    IF OLD.post_id IS NOT NULL AND OLD.type = 'like' THEN
      UPDATE "Post" 
      SET likes_count = GREATEST(0, likes_count - 1)
      WHERE id = OLD.post_id;
    ELSIF OLD.post_id IS NOT NULL AND OLD.type = 'dislike' THEN
      UPDATE "Post" 
      SET dislikes_count = GREATEST(0, dislikes_count - 1)
      WHERE id = OLD.post_id;
    END IF;
    
    IF NEW.post_id IS NOT NULL AND NEW.type = 'like' THEN
      UPDATE "Post" 
      SET likes_count = likes_count + 1 
      WHERE id = NEW.post_id;
    ELSIF NEW.post_id IS NOT NULL AND NEW.type = 'dislike' THEN
      UPDATE "Post" 
      SET dislikes_count = dislikes_count + 1 
      WHERE id = NEW.post_id;
    END IF;
    RETURN NEW;
  END IF;
END;
$$;


ALTER FUNCTION "public"."update_post_likes_count"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Asset" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "filename" character varying,
    "type" character varying,
    "size" integer,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "private_space_id" "uuid",
    "user_id" "uuid",
    "url" "text"
);


ALTER TABLE "public"."Asset" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Comments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "content" "text" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid" NOT NULL,
    "parent_comment_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone
);


ALTER TABLE "public"."Comments" OWNER TO "postgres";


COMMENT ON COLUMN "public"."Comments"."parent_comment_id" IS 'For threaded comments';



CREATE TABLE IF NOT EXISTS "public"."Community" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying NOT NULL,
    "description" "text",
    "visibility" character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "tags" "text"[]
);


ALTER TABLE "public"."Community" OWNER TO "postgres";


COMMENT ON COLUMN "public"."Community"."visibility" IS 'e.g., public or private';



CREATE TABLE IF NOT EXISTS "public"."CommunityMember" (
    "user_account_id" "uuid" NOT NULL,
    "community_id" "uuid" NOT NULL,
    "joined_at" timestamp without time zone DEFAULT "now"(),
    "role" "public"."community_member_role",
    "status" character varying(20) DEFAULT 'approved'::character varying NOT NULL
);


ALTER TABLE "public"."CommunityMember" OWNER TO "postgres";


COMMENT ON COLUMN "public"."CommunityMember"."status" IS 'Member status: pending (awaiting admin approval) or approved (active member)';



CREATE TABLE IF NOT EXISTS "public"."DirectMessage" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "sender_id" "uuid" NOT NULL,
    "receiver_id" "uuid" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."DirectMessage" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."ModerationLog" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "report_id" "uuid" NOT NULL,
    "moderator_id" "uuid" NOT NULL,
    "action" character varying NOT NULL,
    "reason" "text",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."ModerationLog" OWNER TO "postgres";


COMMENT ON COLUMN "public"."ModerationLog"."moderator_id" IS 'Ref to UserAccount (moderator)';



CREATE TABLE IF NOT EXISTS "public"."Post" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "title" character varying,
    "content" "text",
    "user_id" "uuid" NOT NULL,
    "community_id" "uuid" NOT NULL,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone,
    "likes_count" integer DEFAULT 0,
    "dislikes_count" integer DEFAULT 0,
    "comments_count" integer DEFAULT 0,
    "engagement_score" double precision,
    "status" "text" DEFAULT 'pending'::"text" NOT NULL,
    "summary" "text"
);


ALTER TABLE "public"."Post" OWNER TO "postgres";


COMMENT ON COLUMN "public"."Post"."status" IS 'this is the status of the post for pending purpus';



CREATE TABLE IF NOT EXISTS "public"."PostTag" (
    "post_id" "uuid" NOT NULL,
    "tag_id" "uuid" NOT NULL
);


ALTER TABLE "public"."PostTag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."PrivateSpace" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_account_id" "uuid" NOT NULL
);


ALTER TABLE "public"."PrivateSpace" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Profile" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_account_id" "uuid" NOT NULL,
    "l_name" character varying,
    "bio" "text"
);


ALTER TABLE "public"."Profile" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Reaction" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "type" character varying NOT NULL,
    "user_id" "uuid" NOT NULL,
    "post_id" "uuid",
    "created_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."Reaction" OWNER TO "postgres";


COMMENT ON COLUMN "public"."Reaction"."type" IS 'e.g., like or dislike';



COMMENT ON COLUMN "public"."Reaction"."post_id" IS 'NULL if reaction for comment';



CREATE TABLE IF NOT EXISTS "public"."Report" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "reporter_user_id" "uuid" NOT NULL,
    "reason" "text",
    "status" character varying DEFAULT 'pending'::character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "reported_user_id" "uuid",
    "reported_post_id" "uuid",
    "reported_comment_id" "uuid"
);


ALTER TABLE "public"."Report" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Tag" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "Name" character varying NOT NULL
);


ALTER TABLE "public"."Tag" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."UserAccount" (
    "id" "uuid" NOT NULL,
    "email" character varying NOT NULL,
    "username" character varying NOT NULL,
    "password_hash" character varying,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "status" character varying
);


ALTER TABLE "public"."UserAccount" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."notification_subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "subscription" "jsonb" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."notification_subscriptions" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Asset"
    ADD CONSTRAINT "Asset_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Comments"
    ADD CONSTRAINT "Comments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."CommunityMember"
    ADD CONSTRAINT "CommunityMember_pkey" PRIMARY KEY ("user_account_id", "community_id");



ALTER TABLE ONLY "public"."Community"
    ADD CONSTRAINT "Community_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."DirectMessage"
    ADD CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."ModerationLog"
    ADD CONSTRAINT "ModerationLog_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PostTag"
    ADD CONSTRAINT "PostTag_pkey" PRIMARY KEY ("post_id", "tag_id");



ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PrivateSpace"
    ADD CONSTRAINT "PrivateSpace_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."PrivateSpace"
    ADD CONSTRAINT "PrivateSpace_user_account_id_key" UNIQUE ("user_account_id");



ALTER TABLE ONLY "public"."Profile"
    ADD CONSTRAINT "Profile_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Profile"
    ADD CONSTRAINT "Profile_user_account_id_key" UNIQUE ("user_account_id");



ALTER TABLE ONLY "public"."Reaction"
    ADD CONSTRAINT "Reaction_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Tag"
    ADD CONSTRAINT "Tag_Name_key" UNIQUE ("Name");



ALTER TABLE ONLY "public"."Tag"
    ADD CONSTRAINT "Tag_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserAccount"
    ADD CONSTRAINT "UserAccount_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."UserAccount"
    ADD CONSTRAINT "UserAccount_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."UserAccount"
    ADD CONSTRAINT "UserAccount_username_key" UNIQUE ("username");



ALTER TABLE ONLY "public"."notification_subscriptions"
    ADD CONSTRAINT "notification_subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."notification_subscriptions"
    ADD CONSTRAINT "notification_subscriptions_user_id_key" UNIQUE ("user_id");



CREATE UNIQUE INDEX "Reaction_user_id_post_id_idx" ON "public"."Reaction" USING "btree" ("user_id", "post_id");



CREATE INDEX "idx_asset_user_id" ON "public"."Asset" USING "btree" ("user_id");



CREATE INDEX "idx_directmessage_participants" ON "public"."DirectMessage" USING "btree" ("sender_id", "receiver_id", "created_at" DESC);



CREATE INDEX "idx_notification_subscriptions_user_id" ON "public"."notification_subscriptions" USING "btree" ("user_id");



CREATE INDEX "idx_post_title_trgm" ON "public"."Post" USING "gin" ("title" "public"."gin_trgm_ops");



CREATE OR REPLACE TRIGGER "comment_post_count_trigger" AFTER INSERT OR DELETE ON "public"."Comments" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_comments_count"();



CREATE OR REPLACE TRIGGER "reaction_post_count_trigger" AFTER INSERT OR DELETE OR UPDATE ON "public"."Reaction" FOR EACH ROW EXECUTE FUNCTION "public"."update_post_likes_count"();



ALTER TABLE ONLY "public"."Asset"
    ADD CONSTRAINT "Asset_private_space_id_fkey" FOREIGN KEY ("private_space_id") REFERENCES "public"."PrivateSpace"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Asset"
    ADD CONSTRAINT "Asset_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."Comments"
    ADD CONSTRAINT "Comments_parent_comment_id_fkey" FOREIGN KEY ("parent_comment_id") REFERENCES "public"."Comments"("id");



ALTER TABLE ONLY "public"."Comments"
    ADD CONSTRAINT "Comments_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."Post"("id");



ALTER TABLE ONLY "public"."Comments"
    ADD CONSTRAINT "Comments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."CommunityMember"
    ADD CONSTRAINT "CommunityMember_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."Community"("id");



ALTER TABLE ONLY "public"."CommunityMember"
    ADD CONSTRAINT "CommunityMember_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."ModerationLog"
    ADD CONSTRAINT "ModerationLog_moderator_id_fkey" FOREIGN KEY ("moderator_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."ModerationLog"
    ADD CONSTRAINT "ModerationLog_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "public"."Report"("id");



ALTER TABLE ONLY "public"."PostTag"
    ADD CONSTRAINT "PostTag_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."Post"("id");



ALTER TABLE ONLY "public"."PostTag"
    ADD CONSTRAINT "PostTag_tag_id_fkey" FOREIGN KEY ("tag_id") REFERENCES "public"."Tag"("id");



ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_community_id_fkey" FOREIGN KEY ("community_id") REFERENCES "public"."Community"("id");



ALTER TABLE ONLY "public"."Post"
    ADD CONSTRAINT "Post_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."PrivateSpace"
    ADD CONSTRAINT "PrivateSpace_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."Profile"
    ADD CONSTRAINT "Profile_user_account_id_fkey" FOREIGN KEY ("user_account_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."Reaction"
    ADD CONSTRAINT "Reaction_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "public"."Post"("id");



ALTER TABLE ONLY "public"."Reaction"
    ADD CONSTRAINT "Reaction_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_reported_comment_id_fkey" FOREIGN KEY ("reported_comment_id") REFERENCES "public"."Comments"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_reported_post_id_fkey" FOREIGN KEY ("reported_post_id") REFERENCES "public"."Post"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_reported_user_id_fkey" FOREIGN KEY ("reported_user_id") REFERENCES "public"."UserAccount"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Report"
    ADD CONSTRAINT "Report_reporter_user_id_fkey" FOREIGN KEY ("reporter_user_id") REFERENCES "public"."UserAccount"("id");



ALTER TABLE ONLY "public"."DirectMessage"
    ADD CONSTRAINT "fk_directmessage_receiver" FOREIGN KEY ("receiver_id") REFERENCES "public"."UserAccount"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."DirectMessage"
    ADD CONSTRAINT "fk_directmessage_sender" FOREIGN KEY ("sender_id") REFERENCES "public"."UserAccount"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."notification_subscriptions"
    ADD CONSTRAINT "notification_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



CREATE POLICY "Allow everyone to insert (Temporary test)" ON "public"."DirectMessage" FOR INSERT WITH CHECK (true);



CREATE POLICY "Allow select" ON "public"."DirectMessage" FOR SELECT USING (true);



ALTER TABLE "public"."DirectMessage" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";






ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."DirectMessage";



GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_in"("cstring") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_out"("public"."gtrgm") TO "service_role";

























































































































































GRANT ALL ON FUNCTION "public"."count_active_posts_for_community"("community_id_param" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."count_active_posts_for_community"("community_id_param" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."count_active_posts_for_community"("community_id_param" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."generate_unique_username"("base_username" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."generate_unique_username"("base_username" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_unique_username"("base_username" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."get_pending_reports_by_community_and_admin"("target_community_id" "uuid", "admin_user_id" "uuid") TO "anon";
GRANT ALL ON FUNCTION "public"."get_pending_reports_by_community_and_admin"("target_community_id" "uuid", "admin_user_id" "uuid") TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_pending_reports_by_community_and_admin"("target_community_id" "uuid", "admin_user_id" "uuid") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_query_trgm"("text", "internal", smallint, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_extract_value_trgm"("text", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_consistent"("internal", smallint, "text", integer, "internal", "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gin_trgm_triconsistent"("internal", smallint, "text", integer, "internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_compress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_consistent"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_decompress"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_distance"("internal", "text", smallint, "oid", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_options"("internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_penalty"("internal", "internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_picksplit"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_same"("public"."gtrgm", "public"."gtrgm", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "postgres";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "anon";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "authenticated";
GRANT ALL ON FUNCTION "public"."gtrgm_union"("internal", "internal") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."search_posts"("search_query" "text", "community_id_filter" "uuid", "current_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_posts"("search_query" "text", "community_id_filter" "uuid", "current_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_posts"("search_query" "text", "community_id_filter" "uuid", "current_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_posts_by_tags"("tag_names" "text"[], "search_mode" "text", "community_id_filter" "uuid", "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_posts_by_tags"("tag_names" "text"[], "search_mode" "text", "community_id_filter" "uuid", "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_posts_by_tags"("tag_names" "text"[], "search_mode" "text", "community_id_filter" "uuid", "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."search_posts_with_tags"("search_query" "text", "or_tags" "text"[], "and_tags" "text"[], "not_tags" "text"[], "community_id_filter" "uuid", "current_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."search_posts_with_tags"("search_query" "text", "or_tags" "text"[], "and_tags" "text"[], "not_tags" "text"[], "community_id_filter" "uuid", "current_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."search_posts_with_tags"("search_query" "text", "or_tags" "text"[], "and_tags" "text"[], "not_tags" "text"[], "community_id_filter" "uuid", "current_user_id" "uuid", "limit_count" integer, "offset_count" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "postgres";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "anon";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_limit"(real) TO "service_role";



GRANT ALL ON FUNCTION "public"."show_limit"() TO "postgres";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "anon";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_limit"() TO "service_role";



GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "postgres";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "anon";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."show_trgm"("text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_dist"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."strict_word_similarity_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_comments_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_post_likes_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_commutator_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_dist_op"("text", "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "postgres";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "anon";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."word_similarity_op"("text", "text") TO "service_role";


















GRANT ALL ON TABLE "public"."Asset" TO "anon";
GRANT ALL ON TABLE "public"."Asset" TO "authenticated";
GRANT ALL ON TABLE "public"."Asset" TO "service_role";
GRANT SELECT ON TABLE "public"."Asset" TO PUBLIC;



GRANT ALL ON TABLE "public"."Comments" TO "anon";
GRANT ALL ON TABLE "public"."Comments" TO "authenticated";
GRANT ALL ON TABLE "public"."Comments" TO "service_role";
GRANT SELECT ON TABLE "public"."Comments" TO PUBLIC;



GRANT ALL ON TABLE "public"."Community" TO "anon";
GRANT ALL ON TABLE "public"."Community" TO "authenticated";
GRANT ALL ON TABLE "public"."Community" TO "service_role";
GRANT SELECT ON TABLE "public"."Community" TO PUBLIC;



GRANT ALL ON TABLE "public"."CommunityMember" TO "anon";
GRANT ALL ON TABLE "public"."CommunityMember" TO "authenticated";
GRANT ALL ON TABLE "public"."CommunityMember" TO "service_role";
GRANT SELECT ON TABLE "public"."CommunityMember" TO PUBLIC;



GRANT ALL ON TABLE "public"."DirectMessage" TO "anon";
GRANT ALL ON TABLE "public"."DirectMessage" TO "authenticated";
GRANT ALL ON TABLE "public"."DirectMessage" TO "service_role";
GRANT SELECT ON TABLE "public"."DirectMessage" TO PUBLIC;



GRANT ALL ON TABLE "public"."ModerationLog" TO "anon";
GRANT ALL ON TABLE "public"."ModerationLog" TO "authenticated";
GRANT ALL ON TABLE "public"."ModerationLog" TO "service_role";
GRANT SELECT ON TABLE "public"."ModerationLog" TO PUBLIC;



GRANT ALL ON TABLE "public"."Post" TO "anon";
GRANT ALL ON TABLE "public"."Post" TO "authenticated";
GRANT ALL ON TABLE "public"."Post" TO "service_role";
GRANT SELECT ON TABLE "public"."Post" TO PUBLIC;



GRANT ALL ON TABLE "public"."PostTag" TO "anon";
GRANT ALL ON TABLE "public"."PostTag" TO "authenticated";
GRANT ALL ON TABLE "public"."PostTag" TO "service_role";
GRANT SELECT ON TABLE "public"."PostTag" TO PUBLIC;



GRANT ALL ON TABLE "public"."PrivateSpace" TO "anon";
GRANT ALL ON TABLE "public"."PrivateSpace" TO "authenticated";
GRANT ALL ON TABLE "public"."PrivateSpace" TO "service_role";
GRANT SELECT ON TABLE "public"."PrivateSpace" TO PUBLIC;



GRANT ALL ON TABLE "public"."Profile" TO "anon";
GRANT ALL ON TABLE "public"."Profile" TO "authenticated";
GRANT ALL ON TABLE "public"."Profile" TO "service_role";
GRANT SELECT ON TABLE "public"."Profile" TO PUBLIC;



GRANT ALL ON TABLE "public"."Reaction" TO "anon";
GRANT ALL ON TABLE "public"."Reaction" TO "authenticated";
GRANT ALL ON TABLE "public"."Reaction" TO "service_role";
GRANT SELECT ON TABLE "public"."Reaction" TO PUBLIC;



GRANT ALL ON TABLE "public"."Report" TO "anon";
GRANT ALL ON TABLE "public"."Report" TO "authenticated";
GRANT ALL ON TABLE "public"."Report" TO "service_role";
GRANT SELECT ON TABLE "public"."Report" TO PUBLIC;



GRANT ALL ON TABLE "public"."Tag" TO "anon";
GRANT ALL ON TABLE "public"."Tag" TO "authenticated";
GRANT ALL ON TABLE "public"."Tag" TO "service_role";
GRANT SELECT ON TABLE "public"."Tag" TO PUBLIC;



GRANT ALL ON TABLE "public"."UserAccount" TO "anon";
GRANT ALL ON TABLE "public"."UserAccount" TO "authenticated";
GRANT ALL ON TABLE "public"."UserAccount" TO "service_role";
GRANT SELECT ON TABLE "public"."UserAccount" TO PUBLIC;



GRANT ALL ON TABLE "public"."notification_subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."notification_subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."notification_subscriptions" TO "service_role";
GRANT SELECT ON TABLE "public"."notification_subscriptions" TO PUBLIC;









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































