// DTOs + Interfaces for Post Entity
export interface CreatePostDTO {
  title: string;
  content: string;
  author_id: string;
  community_id: string;
  media_url?: string;
  media_type?: "media" | "video";
  storage_path?: string;
}

export interface UpdatePostDTO {
  title?: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  storage_path?: string;
  status?: "approved" | "pending" | "rejected";
}

export interface PostFilters {
  authorId?: string;
}

export interface Post {
  id: string;
  user_id: string;
  community_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  status: "approved" | "pending" | "rejected";
  likes_count: number;
  dislikes_count: number;
  comments_count: number;
  engagement_score?: number | null;
  summary?: string | null;
  author_email?: string;
  author_name?: string;
  community_name?: string;
}

// Comment DTOs and interfaces
export interface CreateCommentDTO {
  content: string;
  user_id: string;
  post_id: string;
  parent_comment_id?: string;
}

export interface UpdateCommentDTO {
  content?: string;
  status_reported?: "reviewed" | "dismissed";
}

export interface Comment {
  id: string;
  content: string;
  user_id: string;
  post_id: string;
  parent_comment_id: string | null;
  created_at: string;
  updated_at: string;
  author_email?: string;
  author_name?: string;
}

export interface IPostRepository {
  create(data: CreatePostDTO): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findAll(): Promise<Post[]>;
  findByUserId(userId: string): Promise<Post[]>;
  findByCommunityId(communityId: string): Promise<Post[]>;
  findTrending(limit?: number): Promise<Post[]>;
  update(id: string, data: UpdatePostDTO): Promise<Post>;
  delete(id: string): Promise<void>;

  // Comment methods
  createComment(data: CreateCommentDTO): Promise<Comment>;
  findCommentById(id: string): Promise<Comment | null>;
  findCommentsByPostId(postId: string): Promise<Comment[]>;
  findRepliesByCommentId(commentId: string): Promise<Comment[]>;
  updateComment(id: string, data: UpdateCommentDTO): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
}

export interface IPostService {
  createPost(data: CreatePostDTO): Promise<Post>;
  getPostById(id: string): Promise<Post | null>;
  getPosts(filters?: PostFilters): Promise<Post[]>;
  getPostsByAuthor(authorId: string): Promise<Post[]>;
  getPostsByCommunity(communityId: string): Promise<Post[]>;
  getPendingPostsByAdmin(adminId: string): Promise<Post[]>;
  updatePost(id: string, data: UpdatePostDTO): Promise<Post>;
  deletePost(id: string): Promise<void>;
  getTrendingPosts(limit?: number): Promise<Post[]>;
  reactToPost(
    postId: string,
    userId: string,
    type: "like" | "dislike"
  ): Promise<void>;

  // Comment methods
  createComment(data: CreateCommentDTO): Promise<Comment>;
  getCommentById(id: string): Promise<Comment | null>;
  getCommentsByPost(postId: string): Promise<Comment[]>;
  getRepliesByComment(commentId: string): Promise<Comment[]>;
  updateComment(id: string, data: UpdateCommentDTO): Promise<Comment>;
  deleteComment(id: string): Promise<void>;
}
