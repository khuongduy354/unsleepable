// DTOs + Interfaces for Search functionality

export interface TagFilter {
  tags: string[];
  operator: "AND" | "OR" | "NOT";
}

export interface SearchPostsDTO {
  query: string;
  tagFilters?: TagFilter[]; // Multiple tag groups with different operators
  communityId?: string;
  userId?: string; // For validating community access
  limit?: number;
  offset?: number;
}

export interface PostSearchResult {
  id: string;
  title: string;
  content: string;
  user_id: string;
  username?: string;
  community_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  engagement_score: number;
  similarity: number;
  community_name?: string;
}

// Repository Interface
export interface ISearchRepository {
  searchPosts(params: SearchPostsDTO): Promise<PostSearchResult[]>;
}

// Service Interface
export interface ISearchService {
  searchPosts(params: SearchPostsDTO): Promise<PostSearchResult[]>;
}
