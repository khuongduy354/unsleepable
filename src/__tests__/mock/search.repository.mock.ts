import {
  ISearchRepository,
  PostSearchResult,
  SearchPostsDTO,
  TagFilter,
} from "@/lib/types/search.type";

/**
 * Mock implementation of ISearchRepository for testing.
 * Simulates the search_posts_with_tags RPC behavior.
 */

const mock_sp_publishable = "sb_publishable_ACJWlzQHlZjBrEguHvfOxg_3BJgxAaH";
const mock_sp_secret = "sb_secret_N7UND0UgjKTVK-Uodkm0Hg_xSvEMPvz";
const mock_sp_url = "http://127.0.0.1:54321";
export class MockSearchRepository implements ISearchRepository {
  private posts: PostSearchResult[] = [];

  // Helper to reset state between tests
  reset() {
    this.posts = [];
  }

  // Helper to seed test data
  seedPosts(posts: PostSearchResult[]) {
    this.posts = posts;
  }

  async searchPosts(params: SearchPostsDTO): Promise<PostSearchResult[]> {
    const {
      query = "",
      tagFilters = [],
      communityId,
      limit = 20,
      offset = 0,
      sortBy = "relevance",
    } = params;

    let results = [...this.posts];

    // Step 1: Apply text search (fuzzy search on title)
    if (query.trim() !== "") {
      const lowerQuery = query.toLowerCase();
      results = results.filter((post) => {
        const titleMatch = post.title.toLowerCase().includes(lowerQuery);
        const contentMatch = post.content.toLowerCase().includes(lowerQuery);
        return titleMatch || contentMatch;
      });

      // Calculate similarity based on match quality
      results = results.map((post) => {
        const titleMatch = post.title.toLowerCase().includes(lowerQuery);
        const exactMatch = post.title.toLowerCase() === lowerQuery;
        const similarity = exactMatch ? 1.0 : titleMatch ? 0.7 : 0.4;
        return { ...post, similarity };
      });
    }

    // Step 2: Apply community filter
    if (communityId) {
      results = results.filter((post) => post.community_id === communityId);
    }

    // Step 3: Apply tag filters
    if (tagFilters.length > 0) {
      // Separate filters by operator
      const orFilter = tagFilters.find((f) => f.operator === "OR");
      const andFilter = tagFilters.find((f) => f.operator === "AND");
      const notFilter = tagFilters.find((f) => f.operator === "NOT");

      results = results.filter((post) => {
        const postTags = (post as any).tags || [];

        // OR: Post must have at least one of the tags
        if (orFilter) {
          const hasOrTag = orFilter.tags.some((tag) => postTags.includes(tag));
          if (!hasOrTag) return false;
        }

        // AND: Post must have all of the tags
        if (andFilter) {
          const hasAllAndTags = andFilter.tags.every((tag) =>
            postTags.includes(tag)
          );
          if (!hasAllAndTags) return false;
        }

        // NOT: Post must not have any of these tags
        if (notFilter) {
          const hasNotTag = notFilter.tags.some((tag) =>
            postTags.includes(tag)
          );
          if (hasNotTag) return false;
        }

        return true;
      });
    }

    // Step 4: Sort results
    if (sortBy === "time") {
      results.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
    } else {
      // Sort by relevance: similarity DESC, engagement_score DESC, created_at DESC
      results.sort((a, b) => {
        if (b.similarity !== a.similarity) {
          return b.similarity - a.similarity;
        }
        if (b.engagement_score !== a.engagement_score) {
          return b.engagement_score - a.engagement_score;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      });
    }

    // Step 5: Apply pagination
    const paginated = results.slice(offset, offset + limit);

    return paginated;
  }
}

/**
 * Test data factory for creating mock posts with tags
 */
export function createMockPost(
  overrides?: Partial<PostSearchResult & { tags?: string[] }>
): PostSearchResult & { tags?: string[] } {
  const id = `post-${Math.random().toString(36).substring(7)}`;
  const now = new Date().toISOString();

  return {
    id,
    title: "Test Post",
    content: "Test content",
    user_id: "user-1",
    username: "testuser",
    community_id: "community-1",
    community_name: "Test Community",
    created_at: now,
    updated_at: now,
    likes_count: 0,
    dislikes_count: 0,
    comments_count: 0,
    engagement_score: 0,
    similarity: 0.5,
    tags: [],
    ...overrides,
  };
}
