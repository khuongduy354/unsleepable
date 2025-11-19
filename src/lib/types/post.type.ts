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

export interface IPostRepository {
  create(data: CreatePostDTO): Promise<Post>;
  findById(id: string): Promise<Post | null>;
  findAll(): Promise<Post[]>;
  findByAuthorId(authorId: string): Promise<Post[]>;
  update(id: string, data: UpdatePostDTO): Promise<Post>;
  delete(id: string): Promise<void>;
}

export interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  media_url: string;
  media_type: string;
  storage_path: string;
  created_at: string;
  updated_at: string;
}
