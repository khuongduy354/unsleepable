import {
  IPostRepository,
  IPostService,
  Post,
  CreatePostDTO,
  UpdatePostDTO,
  PostFilters,
} from "../types/post.type";

export class PostService implements IPostService {
  constructor(private postRepository: IPostRepository) {}

  async createPost(data: CreatePostDTO): Promise<Post> {
    // Add any business logic validation here
    if (!data.title || data.title.trim().length === 0) {
      throw new Error("Post title is required");
    }

    if (!data.content || data.content.trim().length === 0) {
      throw new Error("Post content is required");
    }
    
    return await this.postRepository.create(data);
  }

  async getPostById(id: string): Promise<Post | null> {
    return await this.postRepository.findById(id);
  }

  async getPosts(filters?: PostFilters): Promise<Post[]> {
    if (filters?.authorId) {
      return await this.postRepository.findByUserId(filters.authorId);
    }
    return await this.postRepository.findAll();
  }

  async getPostsByAuthor(authorId: string): Promise<Post[]> {
    return await this.postRepository.findByUserId(authorId);
  }

  async updatePost(id: string, data: UpdatePostDTO): Promise<Post> {
    // Validate that at least one field is being updated
    if (!data.title && !data.content) {
      throw new Error("At least one field must be provided for update");
    }

    return await this.postRepository.update(id, data);
  }

  async deletePost(id: string): Promise<void> {
    // Check if post exists before deleting
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error("Post not found");
    }

    await this.postRepository.delete(id);
  }
}
