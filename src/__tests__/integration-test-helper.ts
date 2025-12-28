/**
 * Integration Test Helper for Search Functionality
 *
 * This script helps run integration tests against a real Supabase database.
 * Use the Supabase MCP tools to execute these operations.
 */

import { populateAllMockData, cleanupMockData } from "./mock/search.data.mock";

/**
 * Step-by-step guide for running integration tests:
 */

export const INTEGRATION_TEST_GUIDE = `
# Search Integration Testing Guide

## Prerequisites
- Supabase project configured
- MCP Supabase tools available
- Database migrations applied

## Step 1: Populate Test Data

Use #mcp_supabase_execute_sql with the following:

\`\`\`typescript
import { populateAllMockData } from './mock/search.data.mock';
const sql = populateAllMockData();
// Execute via MCP tool
\`\`\`

This will insert:
- 5 test communities
- 3 test users  
- 18 test tags
- 20 test posts
- Multiple post-tag associations

## Step 2: Verify Data Inserted

\`\`\`sql
SELECT COUNT(*) FROM "Post" WHERE id LIKE 'post-%';
-- Should return 20

SELECT COUNT(*) FROM "Tag" WHERE id LIKE 'tag-%';
-- Should return 18

SELECT COUNT(*) FROM "PostTag" WHERE post_id LIKE 'post-%';
-- Should return 40+ associations
\`\`\`

## Step 3: Test Search Queries

### Test 1: Basic Search
\`\`\`sql
SELECT * FROM search_posts_with_tags(
  'javascript',  -- search_query
  NULL,          -- or_tags
  NULL,          -- and_tags  
  NULL,          -- not_tags
  NULL,          -- community_id_filter
  NULL,          -- current_user_id
  20,            -- limit_count
  0              -- offset_count
);
-- Expected: Posts with "JavaScript" in title
\`\`\`

### Test 2: OR Tags
\`\`\`sql
SELECT * FROM search_posts_with_tags(
  '',
  ARRAY['react', 'vue'],  -- or_tags
  NULL,
  NULL,
  NULL,
  NULL,
  20,
  0
);
-- Expected: Posts tagged with react OR vue
\`\`\`

### Test 3: AND Tags
\`\`\`sql
SELECT * FROM search_posts_with_tags(
  '',
  NULL,
  ARRAY['react', 'testing'],  -- and_tags
  NULL,
  NULL,
  NULL,
  20,
  0
);
-- Expected: Posts with BOTH react AND testing tags
\`\`\`

### Test 4: NOT Tags
\`\`\`sql
SELECT * FROM search_posts_with_tags(
  '',
  NULL,
  NULL,
  ARRAY['spam', 'deprecated'],  -- not_tags
  NULL,
  NULL,
  20,
  0
);
-- Expected: Posts WITHOUT spam or deprecated tags
\`\`\`

### Test 5: Combined Filters
\`\`\`sql
SELECT * FROM search_posts_with_tags(
  '',
  ARRAY['react', 'vue'],      -- or_tags
  ARRAY['testing'],           -- and_tags
  ARRAY['deprecated'],        -- not_tags
  NULL,
  NULL,
  20,
  0
);
-- Expected: Posts with (react OR vue) AND testing, but NOT deprecated
\`\`\`

### Test 6: Community Filter
\`\`\`sql
SELECT * FROM search_posts_with_tags(
  '',
  NULL,
  NULL,
  NULL,
  'comm-js',  -- community_id_filter
  NULL,
  20,
  0
);
-- Expected: Only posts from JavaScript community
\`\`\`

### Test 7: Combined Search + Tags + Community
\`\`\`sql
SELECT * FROM search_posts_with_tags(
  'tutorial',
  ARRAY['react'],
  NULL,
  NULL,
  'comm-web',
  NULL,
  20,
  0
);
-- Expected: React tutorials in Web community
\`\`\`

### Test 8: Pagination
\`\`\`sql
-- First page
SELECT * FROM search_posts_with_tags('', NULL, NULL, NULL, NULL, NULL, 5, 0);

-- Second page
SELECT * FROM search_posts_with_tags('', NULL, NULL, NULL, NULL, NULL, 5, 5);

-- Third page  
SELECT * FROM search_posts_with_tags('', NULL, NULL, NULL, NULL, NULL, 5, 10);
\`\`\`

## Step 4: Verify Results

Check that results match expected behavior:
- ✅ Correct posts returned
- ✅ Proper filtering applied
- ✅ Correct similarity scores
- ✅ Proper sorting
- ✅ Pagination works

## Step 5: Clean Up

\`\`\`typescript
import { cleanupMockData } from './mock/search.data.mock';
const sql = cleanupMockData();
// Execute via MCP tool
\`\`\`

This will remove all test data.

## Quick Test Commands

For quick testing via API:

\`\`\`bash
# Test basic search
curl "http://localhost:3000/api/search?q=javascript"

# Test OR tags
curl "http://localhost:3000/api/search?q=&orTags=react,vue"

# Test AND tags
curl "http://localhost:3000/api/search?q=&andTags=react,testing"

# Test NOT tags
curl "http://localhost:3000/api/search?q=&notTags=spam,deprecated"

# Test combined
curl "http://localhost:3000/api/search?q=tutorial&orTags=react&communityId=comm-web"

# Test pagination
curl "http://localhost:3000/api/search?q=&limit=5&offset=0"
curl "http://localhost:3000/api/search?q=&limit=5&offset=5"

# Test sorting
curl "http://localhost:3000/api/search?q=javascript&sortBy=relevance"
curl "http://localhost:3000/api/search?q=javascript&sortBy=time"
\`\`\`

## Troubleshooting

### No results returned
- Verify data was inserted: \`SELECT COUNT(*) FROM "Post" WHERE id LIKE 'post-%'\`
- Check post status: All should be 'approved'
- Verify tags exist: \`SELECT * FROM "Tag" WHERE id LIKE 'tag-%'\`

### Incorrect filtering
- Check PostTag associations: \`SELECT * FROM "PostTag" WHERE post_id LIKE 'post-%'\`
- Verify tag names match exactly (case-sensitive in Tag table)

### RPC errors
- Ensure search_posts_with_tags function exists
- Check function permissions
- Verify all required migrations are applied

## Performance Testing

For large datasets:

\`\`\`sql
-- Add more test posts
INSERT INTO "Post" 
SELECT 
  'perf-post-' || generate_series,
  'Performance Test Post ' || generate_series,
  'Content for performance testing',
  'user-1',
  'comm-js',
  'approved',
  generate_series % 100,  -- likes
  0,
  generate_series % 50,   -- comments
  generate_series % 200,  -- engagement
  NOW() - (generate_series || ' days')::INTERVAL,
  NOW()
FROM generate_series(1, 1000);
\`\`\`

Then test query performance:

\`\`\`sql
EXPLAIN ANALYZE
SELECT * FROM search_posts_with_tags('test', NULL, NULL, NULL, NULL, NULL, 20, 0);
\`\`\`
`;

/**
 * Expected test results for validation
 */
export const EXPECTED_RESULTS = {
  test1_basic_search: {
    query: "javascript",
    expectedCount: 3,
    expectedTitles: [
      "Introduction to JavaScript",
      "JavaScript Design Patterns",
      "Full Stack JavaScript App",
    ],
  },
  test2_or_tags: {
    tags: ["react", "vue"],
    operator: "OR",
    expectedCount: 6, // Posts with react or vue tags
  },
  test3_and_tags: {
    tags: ["react", "testing"],
    operator: "AND",
    expectedCount: 1, // Only post-7 has both
    expectedTitles: ["React Testing with Jest"],
  },
  test4_not_tags: {
    tags: ["spam", "deprecated"],
    operator: "NOT",
    expectedCount: 18, // All except post-10 and post-11
  },
  test5_combined: {
    orTags: ["react", "vue"],
    andTags: ["testing"],
    notTags: ["deprecated"],
    expectedCount: 2, // post-7 and post-8
    expectedTitles: ["React Testing with Jest", "Vue Testing Library"],
  },
  test6_community: {
    communityId: "comm-js",
    expectedMinCount: 8, // At least 8 posts in JS community
  },
  test7_combined_all: {
    query: "tutorial",
    tags: ["react"],
    communityId: "comm-web",
    expectedCount: 1,
    expectedTitles: ["React Testing with Jest"],
  },
  test8_pagination: {
    limit: 5,
    totalPosts: 20,
    expectedPages: 4,
  },
};

/**
 * Validation queries to check data integrity
 */
export const VALIDATION_QUERIES = {
  countPosts: `
    SELECT COUNT(*) as count 
    FROM "Post" 
    WHERE id LIKE 'post-%' AND status = 'approved';
  `,

  countTags: `
    SELECT COUNT(*) as count 
    FROM "Tag" 
    WHERE id LIKE 'tag-%';
  `,

  countPostTags: `
    SELECT COUNT(*) as count 
    FROM "PostTag" 
    WHERE post_id LIKE 'post-%';
  `,

  verifyPostsWithTags: `
    SELECT 
      p.id,
      p.title,
      ARRAY_AGG(t."Name") as tags
    FROM "Post" p
    LEFT JOIN "PostTag" pt ON p.id = pt.post_id
    LEFT JOIN "Tag" t ON pt.tag_id = t.id
    WHERE p.id LIKE 'post-%'
    GROUP BY p.id, p.title
    ORDER BY p.id;
  `,

  checkSearchFunction: `
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public' 
    AND routine_name = 'search_posts_with_tags';
  `,
};
