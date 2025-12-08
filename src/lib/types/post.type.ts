// DTOs + Interfaces for Post Entity
export interface CreatePostDTO {
  title: string;
  content: string;
    author_id: string;
    media_url: string;
    media_type: "media" | "video";
    storage_path: string;
}

export interface UpdatePostDTO {
  title?: string;
  content?: string;
  media_url?: string;
  media_type?: string;
  storage_path?: string;
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
}

export interface IPostRepository {
  create(data: CreatePostDTO): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findAll(): Promise<Post[]>;
  findByUserId(userId: string): Promise<Post[]>;
  update(id: string, data: UpdatePostDTO): Promise<Post>;
  delete(id: string): Promise<void>;
}
export interface IPostService {
  createPost(data: CreatePostDTO): Promise<Post>;
  getPostById(id: string): Promise<Post | null>;
  getPosts(filters?: PostFilters): Promise<Post[]>;
  getPostsByAuthor(authorId: string): Promise<Post[]>;
  updatePost(id: string, data: UpdatePostDTO): Promise<Post>;
  deletePost(id: string): Promise<void>;
}
