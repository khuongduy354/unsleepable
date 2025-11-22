// DTOs + Interfaces for Post Entity
export interface CreatePostDTO {
  title: string;
  content: string;
}

export interface UpdatePostDTO {
  title?: string;
  content?: string;
}

export interface PostFilters {
  authorId?: string;
}

export interface IPostRepository {
  create(data: CreatePostDTO): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findAll(): Promise<Post[]>;
  findByUserId(userId: string): Promise<Post[]>;
  update(id: string, data: UpdatePostDTO): Promise<Post>;
  delete(id: string): Promise<void>;
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
