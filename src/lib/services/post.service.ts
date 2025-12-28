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
import { ICommunityRepository } from "../types/community.type";

export class PostService implements IPostService {
  constructor(
    private postRepository: IPostRepository,
    private communityRepository?: ICommunityRepository
  ) {}

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
    // Directly query for pending posts from repository
    const { data: posts, error } = await (this.postRepository as any).supabase
      .from("Post")
      .select(
        `
        *,
        author:UserAccount!Post_user_id_fkey (
          username,
          email
        ),
        community:Community!Post_community_id_fkey (
          name
        )
      `
      )
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pending posts: ${error.message}`);
    }

    // Map posts to include author info and community name
    return (posts || []).map((post) => {
      const author = post.author as any;
      const community = post.community as any;
      return {
        ...post,
        author: undefined,
        author_email: author?.email,
        author_name: author?.username || author?.email?.split("@")[0],
        community_name: community?.name,
        community: undefined,
      } as Post;
    });
  }

  // Fetch pending posts for communities owned by admin
  async getPendingPostsByAdmin(adminId: string): Promise<Post[]> {
    if (!adminId) {
      throw new Error("Admin ID is required");
    }

    if (!this.communityRepository) {
      // If no community repository, return all pending posts (fallback)
      return this.getPendingPosts();
    }

    // Get communities owned by admin
    const ownedCommunities = await this.communityRepository.findByOwnerId(
      adminId,
      1,
      1000
    );

    const ownedCommunityIds = ownedCommunities.communities.map((c) => c.id);

    if (ownedCommunityIds.length === 0) {
      return [];
    }

    // Get all pending posts
    const allPendingPosts = await this.getPendingPosts();

    // Filter to only include posts from owned communities
    return allPendingPosts.filter((post) =>
      ownedCommunityIds.includes(post.community_id)
    );
  }

  // Approve posts - validates that adminId is the owner of the post's community
  async approvePost(id: string, adminId?: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error("Post not found");
    }

    // Validate admin ownership if adminId and communityRepository are provided
    if (adminId && this.communityRepository) {
      const isOwner = await this.communityRepository.isOwner(
        post.community_id,
        adminId
      );
      if (!isOwner) {
        throw new Error(
          "Unauthorized: You can only approve posts in communities you own"
        );
      }
    }

    return await this.postRepository.update(id, { status: "approved" });
  }

  // Reject posts - validates that adminId is the owner of the post's community
  async rejectPost(id: string, adminId?: string): Promise<Post> {
    const post = await this.postRepository.findById(id);
    if (!post) {
      throw new Error("Post not found");
    }

    // Validate admin ownership if adminId and communityRepository are provided
    if (adminId && this.communityRepository) {
      const isOwner = await this.communityRepository.isOwner(
        post.community_id,
        adminId
      );
      if (!isOwner) {
        throw new Error(
          "Unauthorized: You can only reject posts in communities you own"
        );
      }
    }

    return await this.postRepository.update(id, { status: "rejected" });
  }

  // Get trending posts sorted by trending score
  // Formula: TrendingScore = (Like - Dislike) + (Comment × 2) / (Hours + 1)^1.5
  async getTrendingPosts(limit: number = 10): Promise<Post[]> {
    return await this.postRepository.findTrending(limit);
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
    const post = await this.postRepository.findById(id);

    // Only return approved posts for public access
    if (post && post.status !== "approved") {
      return null;
    }

    return post;
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

  async reactToPost(
    postId: string,
    userId: string,
    type: "like" | "dislike"
  ): Promise<void> {
    // Check if post exists
    const post = await this.postRepository.findById(postId);
    if (!post) {
      throw new Error("Post not found");
    }

    // Check if user already reacted
    const { data: existingReaction, error } = await (
      this.postRepository as any
    ).supabase
      .from("Reaction")
      .select("*")
      .eq("post_id", postId)
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== "PGRST116") {
      throw new Error(`Failed to check existing reaction: ${error.message}`);
    }

    if (existingReaction) {
      // If same type, remove the reaction (toggle off)
      if (existingReaction.type === type) {
        await (this.postRepository as any).supabase
          .from("Reaction")
          .delete()
          .eq("id", existingReaction.id);

        // Update post counts
        const countField = type === "like" ? "likes_count" : "dislikes_count";
        await (this.postRepository as any).supabase
          .from("Post")
          .update({ [countField]: Math.max(0, post[countField] - 1) })
          .eq("id", postId);
      } else {
        // If different type, update the reaction
        await (this.postRepository as any).supabase
          .from("Reaction")
          .update({ type })
          .eq("id", existingReaction.id);

        // Update both counts
        const oldCountField =
          existingReaction.type === "like" ? "likes_count" : "dislikes_count";
        const newCountField =
          type === "like" ? "likes_count" : "dislikes_count";

        await (this.postRepository as any).supabase
          .from("Post")
          .update({
            [oldCountField]: Math.max(0, post[oldCountField] - 1),
            [newCountField]: post[newCountField] + 1,
          })
          .eq("id", postId);
      }
    } else {
      // Create new reaction
      await (this.postRepository as any).supabase.from("Reaction").insert({
        post_id: postId,
        user_id: userId,
        type,
      });

      // Update post count
      const countField = type === "like" ? "likes_count" : "dislikes_count";
      await (this.postRepository as any).supabase
        .from("Post")
        .update({ [countField]: post[countField] + 1 })
        .eq("id", postId);
    }
  }
}
