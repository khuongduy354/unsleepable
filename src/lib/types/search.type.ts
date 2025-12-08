// DTOs + Interfaces for Search functionality

export interface SearchPostsDTO {
  query: string;
  communityId?: string;
  limit?: number;
  offset?: number;
}

export interface PostSearchResult {
  id: string;
  title: string;
  content: string;
  user_id: string;
  community_id: string;
  created_at: string;
  updated_at: string;
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  engagement_score: number;
  similarity: number;
}

// Repository Interface
export interface ISearchRepository {
  searchPosts(params: SearchPostsDTO): Promise<PostSearchResult[]>;
}

// Service Interface
export interface ISearchService {
  searchPosts(params: SearchPostsDTO): Promise<PostSearchResult[]>;
}
