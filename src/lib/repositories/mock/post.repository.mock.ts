import {
  IPostRepository,
  Post,
  CreatePostDTO,
  UpdatePostDTO,
  CreateCommentDTO,
  UpdateCommentDTO,
  Comment,
} from "../../types/post.type";

/**
 * Mock implementation of IPostRepository for testing.
 * This allows testing services without a real database.
 */
export class MockPostRepository implements IPostRepository {
  private posts: Post[] = [];
  private comments: Comment[] = [];
  private idCounter = 1;
  private commentIdCounter = 1;

  // Helper to reset state between tests
  reset() {
    this.posts = [];
    this.comments = [];
    this.idCounter = 1;
    this.commentIdCounter = 1;
  }

  // Helper to seed test data
  seedPosts(posts: Post[]) {
    this.posts = posts;
  }

  async create(data: CreatePostDTO): Promise<Post> {
    const now = new Date().toISOString();
    const post: Post = {
      id: `post-${this.idCounter++}`,
      user_id: data.author_id,
      community_id: "community-1",
      title: data.title,
      content: data.content,
      created_at: now,
      updated_at: now,
    };
    this.posts.push(post);
    return post;
  }

  async findById(id: string): Promise<Post | null> {
    return this.posts.find((p) => p.id === id) || null;
  }

  async findAll(): Promise<Post[]> {
    return [...this.posts];
  }

  async findByUserId(userId: string): Promise<Post[]> {
    return this.posts.filter((p) => p.user_id === userId);
  }

  async findByCommunityId(communityId: string): Promise<Post[]> {
    return this.posts.filter((p) => p.community_id === communityId);
  }

  async update(id: string, data: UpdatePostDTO): Promise<Post> {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Post not found");
    }

    this.posts[index] = {
      ...this.posts[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.posts[index];
  }

  async delete(id: string): Promise<void> {
    const index = this.posts.findIndex((p) => p.id === id);
    if (index === -1) {
      throw new Error("Post not found");
    }
    this.posts.splice(index, 1);
  }

  // Comment methods
  async createComment(data: CreateCommentDTO): Promise<Comment> {
    const now = new Date().toISOString();
    const comment: Comment = {
      id: `comment-${this.commentIdCounter++}`,
      content: data.content,
      user_id: data.user_id,
      post_id: data.post_id,
      parent_comment_id: data.parent_comment_id || null,
      created_at: now,
      updated_at: now,
    };
    this.comments.push(comment);
    return comment;
  }

  async findCommentById(id: string): Promise<Comment | null> {
    return this.comments.find((c) => c.id === id) || null;
  }

  async findCommentsByPostId(postId: string): Promise<Comment[]> {
    return this.comments.filter((c) => c.post_id === postId);
  }

  async findRepliesByCommentId(commentId: string): Promise<Comment[]> {
    return this.comments.filter((c) => c.parent_comment_id === commentId);
  }

  async updateComment(id: string, data: UpdateCommentDTO): Promise<Comment> {
    const index = this.comments.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Comment not found");
    }

    this.comments[index] = {
      ...this.comments[index],
      ...data,
      updated_at: new Date().toISOString(),
    };
    return this.comments[index];
  }

  async deleteComment(id: string): Promise<void> {
    const index = this.comments.findIndex((c) => c.id === id);
    if (index === -1) {
      throw new Error("Comment not found");
    }
    this.comments.splice(index, 1);
  }
}
