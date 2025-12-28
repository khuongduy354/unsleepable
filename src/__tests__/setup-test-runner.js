#!/usr/bin/env node

/**
 * Test Data Setup Script
 *
 * This script helps you populate test data for search integration tests.
 * Run this before executing the test suite.
 *
 * Usage:
 *   node setup-test-runner.js
 *
 * Or directly:
 *   npm run test:setup
 */

console.log(`
╔════════════════════════════════════════════════════════════════╗
║         Search Integration Tests - Setup Instructions         ║
╚════════════════════════════════════════════════════════════════╝

This test suite requires test data to be populated in your Supabase database.

📋 SETUP STEPS:

1. Use Supabase MCP Tools (#mcp_supabase_execute_sql)
   
2. Execute each SQL statement from setup-test-data.ts:
   
   ✓ cleanupSQL          - Remove existing test data
   ✓ insertCommunitiesSQL - Insert 5 test communities  
   ✓ insertUsersSQL       - Insert 3 test users
   ✓ insertTagsSQL        - Insert 18 test tags
   ✓ insertPostsSQL       - Insert 20 test posts
   ✓ insertPostTagsSQL    - Insert 40+ tag associations

3. Run the tests:
   npm test search.service.test.ts

─────────────────────────────────────────────────────────────────

📝 EXAMPLE: Using Supabase MCP Tools

// Step 1: Import setup
import { getAllSetupSQL } from './src/__tests__/setup-test-data';

// Step 2: Get SQL statements
const steps = getAllSetupSQL();

// Step 3: Execute each via MCP
for (const step of steps) {
  console.log(\`Setting up \${step.name}...\`);
  await mcp_supabase_execute_sql({ 
    query: step.sql 
  });
}

// Step 4: Run tests
// npm test search.service.test.ts

─────────────────────────────────────────────────────────────────

✨ WHAT GETS TESTED:

1. ✅ Basic fuzzy search on title/content
2. ✅ Empty query returns all posts  
3. ✅ OR tags filtering (any tag)
4. ✅ AND tags filtering (all tags)
5. ✅ NOT tags filtering (exclude tags)
6. ✅ Combined tag filters (OR + AND + NOT)
7. ✅ Community filtering
8. ✅ Community + tags combination
9. ✅ Pagination (limit + offset)
10. ✅ Sorting (relevance vs time)
11. ✅ Validation tests

─────────────────────────────────────────────────────────────────

🎯 TEST DATA SUMMARY:

Communities: 5 (JS, Python, Web, Mobile, Private)
Users:       3 (admin, testuser1, testuser2)  
Tags:        18 (react, vue, python, testing, etc.)
Posts:       20 (various engagement scores and dates)
Associations: 40+ post-tag relationships

─────────────────────────────────────────────────────────────────

⚠️  IMPORTANT NOTES:

• These are INTEGRATION tests using real Supabase RPC
• Tests connect to your actual database
• Test data uses IDs prefixed with 'post-', 'tag-', 'comm-', 'user-'
• Cleanup happens automatically after tests complete
• First-time setup may take 30 seconds

─────────────────────────────────────────────────────────────────

🔧 TROUBLESHOOTING:

Issue: "search_posts_with_tags not found"
Fix: Ensure Supabase migrations are applied

Issue: "Permission denied"  
Fix: Check RLS policies allow test operations

Issue: Tests timeout
Fix: Increase timeout in jest.config.js or check DB connection

Issue: No results returned
Fix: Verify test data was inserted successfully

─────────────────────────────────────────────────────────────────

📚 FILES:

• search.service.test.ts     - Main test suite
• setup-test-data.ts         - SQL statements for setup
• mock/search.data.mock.ts   - Legacy mock data (deprecated)
• SEARCH_TESTS_README.md     - This documentation

─────────────────────────────────────────────────────────────────

Ready to begin? Follow the steps above to populate test data!

`);

// Export the instructions for programmatic use
module.exports = {
  instructions: "See console output above for setup instructions",
  setupRequired: true,
  testFile: "src/__tests__/search.service.test.ts",
};
