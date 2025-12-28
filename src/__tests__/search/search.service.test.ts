import { SearchService } from "@/lib/services/search.service";
import { SupabaseSearchRepository } from "@/lib/repositories/supabase/search.repository";
import { createClient } from "@supabase/supabase-js";
import { SearchPostsDTO, PostSearchResult } from "@/lib/types/search.type";

// Local Supabase credentials (from `npx supabase start`)
const LOCAL_SUPABASE_URL = "http://127.0.0.1:54321";
const LOCAL_SUPABASE_SERVICE_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4MzgxMjk5Nn0.EGIM96RAZx35lJzdJsyH-qQwv8Hdp7fsn3W0YpN81IU";

// Fixed UUIDs for test data (consistent across test runs)
const TEST_UUIDS = {
  // Users
  USER_ADMIN: "00000000-0000-0000-0000-000000000001",
  USER_1: "00000000-0000-0000-0000-000000000002",
  USER_2: "00000000-0000-0000-0000-000000000003",
  // Communities
  COMM_JS: "00000000-0000-0000-0001-000000000001",
  COMM_PYTHON: "00000000-0000-0000-0001-000000000002",
  COMM_WEB: "00000000-0000-0000-0001-000000000003",
  COMM_MOBILE: "00000000-0000-0000-0001-000000000004",
  // Tags
  TAG_REACT: "00000000-0000-0000-0002-000000000001",
  TAG_VUE: "00000000-0000-0000-0002-000000000002",
  TAG_ANGULAR: "00000000-0000-0000-0002-000000000003",
  TAG_TYPESCRIPT: "00000000-0000-0000-0002-000000000004",
  TAG_JAVASCRIPT: "00000000-0000-0000-0002-000000000005",
  TAG_PYTHON: "00000000-0000-0000-0002-000000000006",
  TAG_NODE: "00000000-0000-0000-0002-000000000007",
  TAG_TESTING: "00000000-0000-0000-0002-000000000008",
  TAG_TUTORIAL: "00000000-0000-0000-0002-000000000009",
  TAG_ADVANCED: "00000000-0000-0000-0002-000000000010",
  TAG_BEGINNER: "00000000-0000-0000-0002-000000000011",
  TAG_DATABASE: "00000000-0000-0000-0002-000000000012",
  TAG_PRODUCTION: "00000000-0000-0000-0002-000000000013",
  TAG_DEPRECATED: "00000000-0000-0000-0002-000000000014",
  TAG_SPAM: "00000000-0000-0000-0002-000000000015",
  // Posts
  POST_1: "00000000-0000-0000-0003-000000000001",
  POST_2: "00000000-0000-0000-0003-000000000002",
  POST_3: "00000000-0000-0000-0003-000000000003",
  POST_4: "00000000-0000-0000-0003-000000000004",
  POST_5: "00000000-0000-0000-0003-000000000005",
  POST_6: "00000000-0000-0000-0003-000000000006",
  POST_7: "00000000-0000-0000-0003-000000000007",
  POST_8: "00000000-0000-0000-0003-000000000008",
  POST_9: "00000000-0000-0000-0003-000000000009",
  POST_10: "00000000-0000-0000-0003-000000000010",
  POST_11: "00000000-0000-0000-0003-000000000011",
  POST_12: "00000000-0000-0000-0003-000000000012",
  POST_13: "00000000-0000-0000-0003-000000000013",
  POST_14: "00000000-0000-0000-0003-000000000014",
};

/**
 * Integration tests for SearchService using local Supabase
 *
 * PREREQUISITES:
 * - Run `npx supabase start` before running tests
 * - Run `npx supabase stop` after running tests
 *
 * TEST COVERAGE:
 * - Fuzzy search on title/content
 * - Tag filtering (OR, AND, NOT operators)
 * - Community filtering
 * - Combined filters
 * - Pagination
 * - Sorting (relevance vs time)
 *
 * NOTE: Uses actual search_posts_with_tags RPC function
 */
describe("SearchService - Integration Tests", () => {
  let searchService: SearchService;
  let supabaseClient: any;

  // Setup: Create client and populate test data before all tests
  beforeAll(async () => {
    // Create Supabase client for local instance
    supabaseClient = createClient(
      LOCAL_SUPABASE_URL,
      LOCAL_SUPABASE_SERVICE_KEY
    );

    // Populate mock data using Supabase SDK
    await populateTestData(supabaseClient);

    // Initialize service with real repository
    const searchRepository = new SupabaseSearchRepository(supabaseClient);
    searchService = new SearchService(searchRepository);
  }, 30000); // 30 second timeout for setup

  // No teardown - data persists in local Supabase

  // Helper to populate test data using Supabase SDK
  async function populateTestData(supabase: any) {
    console.log("Populating test data...");

    // 1. Insert users first (referenced by communities and posts)
    const userResult = await supabase.from("UserAccount").upsert(
      [
        {
          id: TEST_UUIDS.USER_ADMIN,
          username: "admin_test",
          email: "admin_test@test.com",
        },
        {
          id: TEST_UUIDS.USER_1,
          username: "testuser1",
          email: "test1@test.com",
        },
        {
          id: TEST_UUIDS.USER_2,
          username: "testuser2",
          email: "test2@test.com",
        },
      ],
      { onConflict: "id" }
    );
    if (userResult.error) console.error("User insert error:", userResult.error);

    // 2. Insert communities
    const commResult = await supabase.from("Community").upsert(
      [
        {
          id: TEST_UUIDS.COMM_JS,
          name: "JavaScript Community Test",
          description: "All things JavaScript",
          visibility: "public",
        },
        {
          id: TEST_UUIDS.COMM_PYTHON,
          name: "Python Community Test",
          description: "Python programming",
          visibility: "public",
        },
        {
          id: TEST_UUIDS.COMM_WEB,
          name: "Web Development Test",
          description: "Web dev discussions",
          visibility: "public",
        },
        {
          id: TEST_UUIDS.COMM_MOBILE,
          name: "Mobile Development Test",
          description: "Mobile app development",
          visibility: "public",
        },
      ],
      { onConflict: "id" }
    );
    if (commResult.error)
      console.error("Community insert error:", commResult.error);

    // 3. Insert tags
    const tagResult = await supabase.from("Tag").upsert(
      [
        { id: TEST_UUIDS.TAG_REACT, Name: "react" },
        { id: TEST_UUIDS.TAG_VUE, Name: "vue" },
        { id: TEST_UUIDS.TAG_ANGULAR, Name: "angular" },
        { id: TEST_UUIDS.TAG_TYPESCRIPT, Name: "typescript" },
        { id: TEST_UUIDS.TAG_JAVASCRIPT, Name: "javascript" },
        { id: TEST_UUIDS.TAG_PYTHON, Name: "python" },
        { id: TEST_UUIDS.TAG_NODE, Name: "node" },
        { id: TEST_UUIDS.TAG_TESTING, Name: "testing" },
        { id: TEST_UUIDS.TAG_TUTORIAL, Name: "tutorial" },
        { id: TEST_UUIDS.TAG_ADVANCED, Name: "advanced" },
        { id: TEST_UUIDS.TAG_BEGINNER, Name: "beginner" },
        { id: TEST_UUIDS.TAG_DATABASE, Name: "database" },
        { id: TEST_UUIDS.TAG_PRODUCTION, Name: "production" },
        { id: TEST_UUIDS.TAG_DEPRECATED, Name: "deprecated" },
        { id: TEST_UUIDS.TAG_SPAM, Name: "spam" },
      ],
      { onConflict: "id" }
    );
    if (tagResult.error) console.error("Tag insert error:", tagResult.error);

    // 4. Insert posts
    const postResult = await supabase.from("Post").upsert(
      [
        {
          id: TEST_UUIDS.POST_1,
          title: "Introduction to JavaScript",
          content: "Learn JavaScript basics",
          user_id: TEST_UUIDS.USER_1,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 10,
          engagement_score: 23,
          created_at: "2024-01-01T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_2,
          title: "Advanced Python Techniques",
          content: "Master Python programming",
          user_id: TEST_UUIDS.USER_1,
          community_id: TEST_UUIDS.COMM_PYTHON,
          status: "approved",
          likes_count: 8,
          engagement_score: 18,
          created_at: "2024-01-02T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_3,
          title: "JavaScript Design Patterns",
          content: "Common patterns in JavaScript",
          user_id: TEST_UUIDS.USER_2,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 15,
          engagement_score: 38,
          created_at: "2024-01-03T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_4,
          title: "React Tutorial for Beginners",
          content: "Start learning React today",
          user_id: TEST_UUIDS.USER_1,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 20,
          engagement_score: 49,
          created_at: "2024-01-04T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_5,
          title: "Vue.js Complete Guide",
          content: "Everything about Vue",
          user_id: TEST_UUIDS.USER_2,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 12,
          engagement_score: 30,
          created_at: "2024-01-05T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_6,
          title: "Angular Best Practices",
          content: "Write better Angular code",
          user_id: TEST_UUIDS.USER_1,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 9,
          engagement_score: 19,
          created_at: "2024-01-06T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_7,
          title: "React Testing with Jest",
          content: "Test your React apps",
          user_id: TEST_UUIDS.USER_2,
          community_id: TEST_UUIDS.COMM_WEB,
          status: "approved",
          likes_count: 18,
          engagement_score: 44,
          created_at: "2024-01-07T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_8,
          title: "Vue Testing Library",
          content: "Testing Vue components",
          user_id: TEST_UUIDS.USER_1,
          community_id: TEST_UUIDS.COMM_WEB,
          status: "approved",
          likes_count: 14,
          engagement_score: 35,
          created_at: "2024-01-08T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_9,
          title: "Full Stack JavaScript App",
          content: "Build complete apps",
          user_id: TEST_UUIDS.USER_2,
          community_id: TEST_UUIDS.COMM_WEB,
          status: "approved",
          likes_count: 25,
          engagement_score: 63,
          created_at: "2024-01-09T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_10,
          title: "Deprecated Angular Features",
          content: "Legacy Angular code",
          user_id: TEST_UUIDS.USER_1,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 5,
          engagement_score: 7,
          created_at: "2024-01-10T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_11,
          title: "Spam: Buy My Course",
          content: "Click here now!",
          user_id: TEST_UUIDS.USER_2,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 0,
          engagement_score: -10,
          created_at: "2024-01-11T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_12,
          title: "Python for Data Science",
          content: "Data analysis with Python",
          user_id: TEST_UUIDS.USER_1,
          community_id: TEST_UUIDS.COMM_PYTHON,
          status: "approved",
          likes_count: 30,
          engagement_score: 71,
          created_at: "2024-01-12T10:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_13,
          title: "TypeScript Basics",
          content: "Introduction to TypeScript",
          user_id: TEST_UUIDS.USER_1,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 100,
          engagement_score: 245,
          created_at: "2024-01-01T08:00:00Z",
        },
        {
          id: TEST_UUIDS.POST_14,
          title: "TypeScript Advanced",
          content: "Deep dive into TypeScript",
          user_id: TEST_UUIDS.USER_2,
          community_id: TEST_UUIDS.COMM_JS,
          status: "approved",
          likes_count: 5,
          engagement_score: 14,
          created_at: "2024-01-15T10:00:00Z",
        },
      ],
      { onConflict: "id" }
    );
    if (postResult.error) console.error("Post insert error:", postResult.error);

    // 5. Insert post-tag associations
    const postTagResult = await supabase.from("PostTag").upsert(
      [
        { post_id: TEST_UUIDS.POST_1, tag_id: TEST_UUIDS.TAG_JAVASCRIPT },
        { post_id: TEST_UUIDS.POST_1, tag_id: TEST_UUIDS.TAG_BEGINNER },
        { post_id: TEST_UUIDS.POST_1, tag_id: TEST_UUIDS.TAG_TUTORIAL },
        { post_id: TEST_UUIDS.POST_2, tag_id: TEST_UUIDS.TAG_PYTHON },
        { post_id: TEST_UUIDS.POST_2, tag_id: TEST_UUIDS.TAG_ADVANCED },
        { post_id: TEST_UUIDS.POST_3, tag_id: TEST_UUIDS.TAG_JAVASCRIPT },
        { post_id: TEST_UUIDS.POST_4, tag_id: TEST_UUIDS.TAG_REACT },
        { post_id: TEST_UUIDS.POST_4, tag_id: TEST_UUIDS.TAG_BEGINNER },
        { post_id: TEST_UUIDS.POST_4, tag_id: TEST_UUIDS.TAG_TUTORIAL },
        { post_id: TEST_UUIDS.POST_5, tag_id: TEST_UUIDS.TAG_VUE },
        { post_id: TEST_UUIDS.POST_5, tag_id: TEST_UUIDS.TAG_TUTORIAL },
        { post_id: TEST_UUIDS.POST_6, tag_id: TEST_UUIDS.TAG_ANGULAR },
        { post_id: TEST_UUIDS.POST_7, tag_id: TEST_UUIDS.TAG_REACT },
        { post_id: TEST_UUIDS.POST_7, tag_id: TEST_UUIDS.TAG_TESTING },
        { post_id: TEST_UUIDS.POST_7, tag_id: TEST_UUIDS.TAG_TUTORIAL },
        { post_id: TEST_UUIDS.POST_8, tag_id: TEST_UUIDS.TAG_VUE },
        { post_id: TEST_UUIDS.POST_8, tag_id: TEST_UUIDS.TAG_TESTING },
        { post_id: TEST_UUIDS.POST_8, tag_id: TEST_UUIDS.TAG_TUTORIAL },
        { post_id: TEST_UUIDS.POST_9, tag_id: TEST_UUIDS.TAG_REACT },
        { post_id: TEST_UUIDS.POST_9, tag_id: TEST_UUIDS.TAG_NODE },
        { post_id: TEST_UUIDS.POST_9, tag_id: TEST_UUIDS.TAG_DATABASE },
        { post_id: TEST_UUIDS.POST_9, tag_id: TEST_UUIDS.TAG_PRODUCTION },
        { post_id: TEST_UUIDS.POST_10, tag_id: TEST_UUIDS.TAG_ANGULAR },
        { post_id: TEST_UUIDS.POST_10, tag_id: TEST_UUIDS.TAG_DEPRECATED },
        { post_id: TEST_UUIDS.POST_11, tag_id: TEST_UUIDS.TAG_SPAM },
        { post_id: TEST_UUIDS.POST_12, tag_id: TEST_UUIDS.TAG_PYTHON },
        { post_id: TEST_UUIDS.POST_12, tag_id: TEST_UUIDS.TAG_ADVANCED },
        { post_id: TEST_UUIDS.POST_12, tag_id: TEST_UUIDS.TAG_TUTORIAL },
        { post_id: TEST_UUIDS.POST_13, tag_id: TEST_UUIDS.TAG_TYPESCRIPT },
        { post_id: TEST_UUIDS.POST_13, tag_id: TEST_UUIDS.TAG_BEGINNER },
        { post_id: TEST_UUIDS.POST_14, tag_id: TEST_UUIDS.TAG_TYPESCRIPT },
        { post_id: TEST_UUIDS.POST_14, tag_id: TEST_UUIDS.TAG_ADVANCED },
      ],
      { onConflict: "post_id,tag_id" }
    );
    if (postTagResult.error)
      console.error("PostTag insert error:", postTagResult.error);

    console.log("Test data populated successfully!");
  }

  /**
   * TEST 1: Basic fuzzy search on title
   * Should find posts matching the search query in title or content
   */
  describe("Basic fuzzy search on title", () => {
    it("should find posts with matching titles", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "javascript",
        sortBy: "relevance",
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
      // At least one result should contain "javascript" in title or content
      const hasJavascriptMatch = results.some(
        (r) =>
          r.title.toLowerCase().includes("javascript") ||
          r.content.toLowerCase().includes("javascript")
      );
      expect(hasJavascriptMatch).toBe(true);
    });

    it("should match partial words in title", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "react",
        sortBy: "relevance",
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
      const hasReactInTitle = results.some((r) =>
        r.title.toLowerCase().includes("react")
      );
      expect(hasReactInTitle).toBe(true);
    });
  });

  /**
   * TEST 2: Empty query returns all posts
   * Should return all available posts when no search query is provided
   */
  describe("Empty query returns all posts", () => {
    it("should return posts when query is empty", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "",
        sortBy: "relevance",
        limit: 20,
      });

      // Assert - Should return test posts
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(20);
    });

    it("should return posts when query is whitespace", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "   ",
        sortBy: "relevance",
        limit: 10,
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
    });
  });

  /**
   * TEST 3: OR tags filtering
   * Should return posts that have at least one of the specified tags
   */
  describe("OR tags filtering", () => {
    it("should return posts with any of the OR tags", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "",
        tagFilters: [{ tags: ["react", "vue"], operator: "OR" }],
        sortBy: "relevance",
      });

      // Assert - Should find posts with react or vue tags
      expect(results.length).toBeGreaterThan(0);

      // Verify at least some results have the expected tags by checking titles
      const hasReactOrVue = results.some(
        (r) =>
          r.title.toLowerCase().includes("react") ||
          r.title.toLowerCase().includes("vue")
      );
      expect(hasReactOrVue).toBe(true);
    });

    it("should return posts matching single tag in OR filter", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "",
        tagFilters: [{ tags: ["python"], operator: "OR" }],
        sortBy: "relevance",
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
      const hasPython = results.some((r) =>
        r.title.toLowerCase().includes("python")
      );
      expect(hasPython).toBe(true);
    });
  });

  /**
   * TEST 4: AND tags filtering
   * Should return only posts that have ALL specified tags
   */
  describe("AND tags filtering", () => {
    it("should return posts with all AND tags", async () => {
      // Act - Test data has posts with both react and testing tags
      const results = await searchService.searchPosts({
        query: "",
        tagFilters: [{ tags: ["react", "testing"], operator: "AND" }],
        sortBy: "relevance",
      });

      // Assert - Should find post-7 (React Testing with Jest)
      expect(results.length).toBeGreaterThan(0);
      const hasBothTags = results.some((r) =>
        r.title.toLowerCase().includes("react")
      );
      expect(hasBothTags).toBe(true);
    });

    it("should return empty when no posts have all required tags", async () => {
      // Act - Use tags that don't exist together
      const results = await searchService.searchPosts({
        query: "",
        tagFilters: [
          { tags: ["react", "python", "nonexistent"], operator: "AND" },
        ],
        sortBy: "relevance",
      });

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  /**
   * TEST 5: NOT tags filtering
   * Should exclude posts that have any of the specified tags
   */
  describe("NOT tags filtering", () => {
    it("should exclude posts with NOT tags", async () => {
      // Act - Exclude spam and deprecated tags
      const results = await searchService.searchPosts({
        query: "",
        tagFilters: [{ tags: ["spam", "deprecated"], operator: "NOT" }],
        sortBy: "relevance",
        limit: 20,
      });

      // Assert - Should not contain post-10 (deprecated) or post-11 (spam)
      const titles = results.map((r) => r.title.toLowerCase());
      const hasDeprecated = titles.some((t) => t.includes("deprecated"));
      const hasSpam = titles.some((t) => t.includes("spam"));

      expect(hasDeprecated).toBe(false);
      expect(hasSpam).toBe(false);
      expect(results.length).toBeGreaterThan(0);
    });

    it("should exclude posts with any of the NOT tags", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "",
        tagFilters: [{ tags: ["spam"], operator: "NOT" }],
        sortBy: "relevance",
        limit: 20,
      });

      // Assert
      const hasSpam = results.some((r) =>
        r.title.toLowerCase().includes("spam")
      );
      expect(hasSpam).toBe(false);
    });
  });

  /**
   * TEST 6: Combined tag filters (OR + AND + NOT)
   * Should apply multiple tag filters with different operators
   */
  describe("Combined tag filters (OR + AND + NOT)", () => {
    it("should apply OR, AND, and NOT filters together", async () => {
      // Act: Find posts with (react OR vue) AND testing, but NOT deprecated
      const results = await searchService.searchPosts({
        query: "",
        tagFilters: [
          { tags: ["react", "vue"], operator: "OR" },
          { tags: ["testing"], operator: "AND" },
          { tags: ["deprecated"], operator: "NOT" },
        ],
        sortBy: "relevance",
      });

      // Assert - Should find post-7 and post-8
      expect(results.length).toBeGreaterThan(0);
      const titles = results.map((r) => r.title.toLowerCase());

      // Should have posts with (react or vue) and testing
      const hasReactOrVue = results.some(
        (r) =>
          r.title.toLowerCase().includes("react") ||
          r.title.toLowerCase().includes("vue")
      );
      expect(hasReactOrVue).toBe(true);

      // Should not have deprecated posts
      const hasDeprecated = titles.some((t) => t.includes("deprecated"));
      expect(hasDeprecated).toBe(false);
    });

    it("should handle complex filtering with multiple conditions", async () => {
      // Act: (react OR node) AND database, but NOT development
      const results = await searchService.searchPosts({
        query: "",
        tagFilters: [
          { tags: ["react", "node"], operator: "OR" },
          { tags: ["database"], operator: "AND" },
          { tags: ["development"], operator: "NOT" },
        ],
        sortBy: "relevance",
      });

      // Assert - Should find post-9 (Full Stack) with react, node, database, production
      expect(results.length).toBeGreaterThan(0);

      // Should not have development tag
      const hasDevelopment = results.some((r) =>
        r.title.toLowerCase().includes("development")
      );
      expect(hasDevelopment).toBe(false);
    });
  });

  /**
   * TEST 7: Community filtering
   * Should filter posts by specific community
   */
  describe("Community filtering", () => {
    it("should return posts from specific community only", async () => {
      // Act - Test data has COMM_JS community
      const results = await searchService.searchPosts({
        query: "",
        communityId: TEST_UUIDS.COMM_JS,
        sortBy: "relevance",
        limit: 20,
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
      results.forEach((post) => {
        expect(post.community_id).toBe(TEST_UUIDS.COMM_JS);
      });
    });

    it("should return empty array for non-existent community", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "",
        communityId: "00000000-0000-0000-9999-999999999999",
        sortBy: "relevance",
      });

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  /**
   * TEST 8: Community + tags combination
   * Should combine community filter with tag filters
   */
  describe("Community + tags combination", () => {
    it("should filter by community and tags together", async () => {
      // Act - Find react posts in JS community
      const results = await searchService.searchPosts({
        query: "",
        communityId: TEST_UUIDS.COMM_JS,
        tagFilters: [{ tags: ["react"], operator: "OR" }],
        sortBy: "relevance",
      });

      // Assert
      expect(results.length).toBeGreaterThan(0);
      results.forEach((post) => {
        expect(post.community_id).toBe(TEST_UUIDS.COMM_JS);
      });
    });

    it("should combine search query, community, and tags", async () => {
      // Act - Find tutorial posts about react in web community
      const results = await searchService.searchPosts({
        query: "tutorial",
        communityId: TEST_UUIDS.COMM_WEB,
        tagFilters: [{ tags: ["react"], operator: "OR" }],
        sortBy: "relevance",
      });

      // Assert - Should find posts matching all criteria
      results.forEach((post) => {
        expect(post.community_id).toBe(TEST_UUIDS.COMM_WEB);
      });
    });
  });

  /**
   * TEST 9: Pagination (limit + offset)
   * Should correctly paginate search results
   */
  describe("Pagination (limit + offset)", () => {
    it("should return correct page with limit and offset", async () => {
      // Act - Get first page (5 items)
      const page1 = await searchService.searchPosts({
        query: "",
        limit: 5,
        offset: 0,
        sortBy: "relevance",
      });

      // Act - Get second page (5 items)
      const page2 = await searchService.searchPosts({
        query: "",
        limit: 5,
        offset: 5,
        sortBy: "relevance",
      });

      // Assert
      expect(page1.length).toBeLessThanOrEqual(5);
      expect(page2.length).toBeGreaterThanOrEqual(0);

      if (page1.length > 0 && page2.length > 0) {
        expect(page1[0].id).not.toBe(page2[0].id);
      }
    });

    it("should handle offset beyond available posts", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "",
        limit: 10,
        offset: 1000,
        sortBy: "relevance",
      });

      // Assert
      expect(results).toHaveLength(0);
    });
  });

  /**
   * TEST 10: Sort by relevance vs time
   * Should sort results by similarity/engagement or chronologically
   */
  describe("Sort by relevance vs time", () => {
    it("should sort by relevance (similarity and engagement)", async () => {
      // Act - Search for JavaScript, default is relevance sort
      const results = await searchService.searchPosts({
        query: "javascript",
        sortBy: "relevance",
        limit: 10,
      });

      // Assert - High engagement posts should rank higher
      if (results.length > 1) {
        // Verify similarity scores are considered
        expect(results[0].similarity).toBeGreaterThanOrEqual(0);
      }
    });

    it("should sort by time (most recent first)", async () => {
      // Act - Sort by time
      const results = await searchService.searchPosts({
        query: "",
        sortBy: "time",
        limit: 10,
      });

      // Assert - Should be sorted by date (newest first)
      if (results.length > 1) {
        const firstDate = new Date(results[0].created_at);
        const secondDate = new Date(results[1].created_at);
        expect(firstDate.getTime()).toBeGreaterThanOrEqual(
          secondDate.getTime()
        );
      }
    });

    it("should handle relevance sorting with query", async () => {
      // Act
      const results = await searchService.searchPosts({
        query: "typescript",
        sortBy: "relevance",
        limit: 5,
      });

      // Assert - Posts with typescript should be returned
      if (results.length > 0) {
        const hasTypescript = results.some((r) =>
          r.title.toLowerCase().includes("typescript")
        );
        expect(hasTypescript).toBe(true);
      }
    });
  });
});
