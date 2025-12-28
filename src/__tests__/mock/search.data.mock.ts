/**
 * Mock data for populating the database for search integration tests
 *
 * This file contains SQL statements to populate:
 * - Communities
 * - Users
 * - Tags
 * - Posts with various tags and properties
 *
 * Usage: Use #mcp_supabase_execute_sql to insert this data
 */

export const MOCK_COMMUNITIES = `
-- Insert test communities
INSERT INTO "Community" (id, name, description, visibility, created_at, updated_at, owner_id)
VALUES 
  ('comm-js', 'JavaScript Community', 'All things JavaScript', 'public', NOW(), NOW(), 'user-admin'),
  ('comm-python', 'Python Community', 'Python programming', 'public', NOW(), NOW(), 'user-admin'),
  ('comm-web', 'Web Development', 'Web dev discussions', 'public', NOW(), NOW(), 'user-admin'),
  ('comm-mobile', 'Mobile Development', 'Mobile app development', 'public', NOW(), NOW(), 'user-admin'),
  ('comm-private', 'Private Community', 'Private discussions', 'private', NOW(), NOW(), 'user-admin')
ON CONFLICT (id) DO NOTHING;
`;

export const MOCK_USERS = `
-- Insert test users
INSERT INTO "UserAccount" (id, username, email, created_at, updated_at)
VALUES 
  ('user-admin', 'admin', 'admin@test.com', NOW(), NOW()),
  ('user-1', 'testuser1', 'test1@test.com', NOW(), NOW()),
  ('user-2', 'testuser2', 'test2@test.com', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
`;

export const MOCK_TAGS = `
-- Insert test tags
INSERT INTO "Tag" (id, "Name", created_at, updated_at)
VALUES 
  ('tag-react', 'react', NOW(), NOW()),
  ('tag-vue', 'vue', NOW(), NOW()),
  ('tag-angular', 'angular', NOW(), NOW()),
  ('tag-typescript', 'typescript', NOW(), NOW()),
  ('tag-javascript', 'javascript', NOW(), NOW()),
  ('tag-python', 'python', NOW(), NOW()),
  ('tag-node', 'node', NOW(), NOW()),
  ('tag-testing', 'testing', NOW(), NOW()),
  ('tag-tutorial', 'tutorial', NOW(), NOW()),
  ('tag-advanced', 'advanced', NOW(), NOW()),
  ('tag-beginner', 'beginner', NOW(), NOW()),
  ('tag-intermediate', 'intermediate', NOW(), NOW()),
  ('tag-expert', 'expert', NOW(), NOW()),
  ('tag-database', 'database', NOW(), NOW()),
  ('tag-production', 'production', NOW(), NOW()),
  ('tag-development', 'development', NOW(), NOW()),
  ('tag-deprecated', 'deprecated', NOW(), NOW()),
  ('tag-spam', 'spam', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;
`;

export const MOCK_POSTS = `
-- Insert test posts with varying properties
INSERT INTO "Post" (id, title, content, user_id, community_id, status, likes_count, dislikes_count, comments_count, engagement_score, created_at, updated_at)
VALUES 
  -- Posts for fuzzy search testing
  ('post-1', 'Introduction to JavaScript', 'Learn JavaScript basics', 'user-1', 'comm-js', 'approved', 10, 2, 5, 23, '2024-01-01 10:00:00', '2024-01-01 10:00:00'),
  ('post-2', 'Advanced Python Techniques', 'Master Python programming', 'user-1', 'comm-python', 'approved', 8, 1, 3, 18, '2024-01-02 10:00:00', '2024-01-02 10:00:00'),
  ('post-3', 'JavaScript Design Patterns', 'Common patterns in JavaScript', 'user-2', 'comm-js', 'approved', 15, 0, 8, 38, '2024-01-03 10:00:00', '2024-01-03 10:00:00'),
  
  -- Posts for tag filtering
  ('post-4', 'React Tutorial for Beginners', 'Start learning React today', 'user-1', 'comm-js', 'approved', 20, 1, 10, 49, '2024-01-04 10:00:00', '2024-01-04 10:00:00'),
  ('post-5', 'Vue.js Complete Guide', 'Everything about Vue', 'user-2', 'comm-js', 'approved', 12, 0, 6, 30, '2024-01-05 10:00:00', '2024-01-05 10:00:00'),
  ('post-6', 'Angular Best Practices', 'Write better Angular code', 'user-1', 'comm-js', 'approved', 9, 2, 4, 19, '2024-01-06 10:00:00', '2024-01-06 10:00:00'),
  
  -- Posts with multiple tags
  ('post-7', 'React Testing with Jest', 'Test your React apps', 'user-2', 'comm-web', 'approved', 18, 1, 9, 44, '2024-01-07 10:00:00', '2024-01-07 10:00:00'),
  ('post-8', 'Vue Testing Library', 'Testing Vue components', 'user-1', 'comm-web', 'approved', 14, 0, 7, 35, '2024-01-08 10:00:00', '2024-01-08 10:00:00'),
  ('post-9', 'Full Stack JavaScript App', 'Build complete apps', 'user-2', 'comm-web', 'approved', 25, 2, 15, 63, '2024-01-09 10:00:00', '2024-01-09 10:00:00'),
  
  -- Posts for NOT filter testing
  ('post-10', 'Deprecated Angular Features', 'Legacy Angular code', 'user-1', 'comm-js', 'approved', 5, 5, 2, 7, '2024-01-10 10:00:00', '2024-01-10 10:00:00'),
  ('post-11', 'Spam: Buy My Course', 'Click here now!', 'user-2', 'comm-js', 'approved', 0, 10, 0, -10, '2024-01-11 10:00:00', '2024-01-11 10:00:00'),
  
  -- Posts for community filtering
  ('post-12', 'Python for Data Science', 'Data analysis with Python', 'user-1', 'comm-python', 'approved', 30, 1, 12, 71, '2024-01-12 10:00:00', '2024-01-12 10:00:00'),
  ('post-13', 'Mobile App with React Native', 'Build mobile apps', 'user-2', 'comm-mobile', 'approved', 22, 2, 11, 53, '2024-01-13 10:00:00', '2024-01-13 10:00:00'),
  
  -- Posts for sorting testing
  ('post-14', 'TypeScript Basics', 'Introduction to TypeScript', 'user-1', 'comm-js', 'approved', 100, 5, 50, 245, '2024-01-01 08:00:00', '2024-01-01 08:00:00'),
  ('post-15', 'TypeScript Advanced Topics', 'Deep dive into TypeScript', 'user-2', 'comm-js', 'approved', 5, 0, 2, 14, '2024-01-15 10:00:00', '2024-01-15 10:00:00'),
  
  -- Posts for pagination testing
  ('post-16', 'Pagination Test 1', 'Content 1', 'user-1', 'comm-js', 'approved', 1, 0, 0, 1, '2024-01-16 10:00:00', '2024-01-16 10:00:00'),
  ('post-17', 'Pagination Test 2', 'Content 2', 'user-1', 'comm-js', 'approved', 2, 0, 0, 2, '2024-01-17 10:00:00', '2024-01-17 10:00:00'),
  ('post-18', 'Pagination Test 3', 'Content 3', 'user-1', 'comm-js', 'approved', 3, 0, 0, 3, '2024-01-18 10:00:00', '2024-01-18 10:00:00'),
  ('post-19', 'Pagination Test 4', 'Content 4', 'user-1', 'comm-js', 'approved', 4, 0, 0, 4, '2024-01-19 10:00:00', '2024-01-19 10:00:00'),
  ('post-20', 'Pagination Test 5', 'Content 5', 'user-1', 'comm-js', 'approved', 5, 0, 0, 5, '2024-01-20 10:00:00', '2024-01-20 10:00:00')
ON CONFLICT (id) DO NOTHING;
`;

export const MOCK_POST_TAGS = `
-- Associate posts with tags
INSERT INTO "PostTag" (post_id, tag_id)
VALUES 
  -- Post 1: JavaScript basics
  ('post-1', 'tag-javascript'),
  ('post-1', 'tag-beginner'),
  ('post-1', 'tag-tutorial'),
  
  -- Post 2: Python advanced
  ('post-2', 'tag-python'),
  ('post-2', 'tag-advanced'),
  
  -- Post 3: JavaScript patterns
  ('post-3', 'tag-javascript'),
  ('post-3', 'tag-intermediate'),
  
  -- Post 4: React tutorial
  ('post-4', 'tag-react'),
  ('post-4', 'tag-beginner'),
  ('post-4', 'tag-tutorial'),
  
  -- Post 5: Vue guide
  ('post-5', 'tag-vue'),
  ('post-5', 'tag-tutorial'),
  
  -- Post 6: Angular best practices
  ('post-6', 'tag-angular'),
  ('post-6', 'tag-intermediate'),
  
  -- Post 7: React + Testing
  ('post-7', 'tag-react'),
  ('post-7', 'tag-testing'),
  ('post-7', 'tag-tutorial'),
  
  -- Post 8: Vue + Testing
  ('post-8', 'tag-vue'),
  ('post-8', 'tag-testing'),
  ('post-8', 'tag-tutorial'),
  
  -- Post 9: Full stack (multiple tags)
  ('post-9', 'tag-react'),
  ('post-9', 'tag-node'),
  ('post-9', 'tag-database'),
  ('post-9', 'tag-production'),
  
  -- Post 10: Deprecated content
  ('post-10', 'tag-angular'),
  ('post-10', 'tag-deprecated'),
  
  -- Post 11: Spam
  ('post-11', 'tag-spam'),
  
  -- Post 12: Python data science
  ('post-12', 'tag-python'),
  ('post-12', 'tag-advanced'),
  ('post-12', 'tag-tutorial'),
  
  -- Post 13: Mobile React Native
  ('post-13', 'tag-react'),
  ('post-13', 'tag-javascript'),
  
  -- Post 14 & 15: TypeScript
  ('post-14', 'tag-typescript'),
  ('post-14', 'tag-beginner'),
  ('post-15', 'tag-typescript'),
  ('post-15', 'tag-advanced')
ON CONFLICT (post_id, tag_id) DO NOTHING;
`;

/**
 * Helper function to populate all mock data
 */
export const populateAllMockData = () => {
  return `
${MOCK_COMMUNITIES}

${MOCK_USERS}

${MOCK_TAGS}

${MOCK_POSTS}

${MOCK_POST_TAGS}
`;
};

/**
 * Helper function to clean up test data
 */
export const cleanupMockData = () => {
  return `
-- Delete in reverse order to respect foreign keys
DELETE FROM "PostTag" WHERE post_id LIKE 'post-%';
DELETE FROM "Post" WHERE id LIKE 'post-%';
DELETE FROM "Tag" WHERE id LIKE 'tag-%';
DELETE FROM "Community" WHERE id LIKE 'comm-%';
DELETE FROM "UserAccount" WHERE id LIKE 'user-%';
`;
};
