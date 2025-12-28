import {
  IPostRepository,
  IPostService,
  Post,
  CreatePostDTO,
  UpdatePostDTO,
  PostFilters,
  CreateCommentDTO,
  UpdateCommentDTO,
  Comment,
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

  // Fetch posts with 'pending' status
  async getPendingPosts(filters?: PostFilters): Promise<Post[]> {
    // Fetch posts with status 'pending'
    const allPosts = await this.getPosts(filters);
    return allPosts.filter(post => post.status === "pending");
  }

  // Approve posts
  async approvePost(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error("Post not found");
    }
    post.status = "approved";
    return await this.postRepository.update(id, { status: "approved" });
  }
  // Reject posts
  async rejectPost(id: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error("Post not found");
    }
    post.status = "rejected";
    return await this.postRepository.update(id, { status: "rejected" });
  }

  // // get reported posts
  // async getReportedPosts(filters?: PostFilters ): Promise<Post[]> {
  //   // Fetch posts with status_reported 'pending'
  //   const allPosts = await this.getPosts(filters);
  //   return allPosts.filter(post => post['status_reported'] === "pending");
  // }

  // // dismiss reported post
  // async dissmissPostReport(id: string): Promise<Post> {
  //   const post = await this.postRepository.findById(id);
  //   if (!post) {
  //     throw new Error("Post not found");
  //   }
  //   post['status_reported'] = "dismissed";
  //   return await this.postRepository.update(id, { status_reported: "dismissed" });
  // }

  // // review reported post
  // async reviewPostReport(id: string): Promise<Post> {
  //   const post = await this.postRepository.findById(id);
  //   if (!post) {
  //     throw new Error("Post not found");
  //   }
  //   post['status_reported'] = "reviewed";
  //   return await this.postRepository.update(id, { status_reported: "reviewed" });
  // }

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

  async getPostsByCommunity(communityId: string): Promise<Post[]> {
    return await this.postRepository.findByCommunityId(communityId);
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

  // Comment methods
  async createComment(data: CreateCommentDTO): Promise<Comment> {
    if (!data.content || data.content.trim().length === 0) {
      throw new Error("Comment content is required");
    }
    return await this.postRepository.createComment(data);
  }

  async getCommentById(id: string): Promise<Comment | null> {
    return await this.postRepository.findCommentById(id);
  }

  async getCommentsByPost(postId: string): Promise<Comment[]> {
    return await this.postRepository.findCommentsByPostId(postId);
  }

  async getRepliesByComment(commentId: string): Promise<Comment[]> {
    return await this.postRepository.findRepliesByCommentId(commentId);
  }

  async updateComment(id: string, data: UpdateCommentDTO): Promise<Comment> {
    if (!data.content) {
      throw new Error("Content must be provided for update");
    }

    return await this.postRepository.updateComment(id, data);
  }

  async deleteComment(id: string): Promise<void> {
    const comment = await this.postRepository.findCommentById(id);
    if (!comment) {
      throw new Error("Comment not found");
    }

    await this.postRepository.deleteComment(id);
  }
}
