import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreatePostDTO,
  UpdatePostDTO,
  Post,
  IPostRepository,
  CreateCommentDTO,
  UpdateCommentDTO,
  Comment,
} from "../types/post.type";

export class SupabasePostRepository implements IPostRepository {
  constructor(private supabase: SupabaseClient) {}

  async create(data: CreatePostDTO): Promise<Post> {
    const { data: post, error } = await this.supabase
      .from("Post")
      .insert({
        user_id: data.author_id,
        community_id: data.community_id,
        title: data.title,
        content: data.content,
        status: "pending", // Posts require admin approval
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create post: ${error.message}`);
    }

    return post;
  }

  async findById(id: string): Promise<Post | null> {
    const { data: post, error } = await this.supabase
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
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to find post: ${error.message}`);
    }

    // Extract author info and community name
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
  }

  async findAll(): Promise<Post[]> {
    const { data: posts, error } = await this.supabase
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
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts: ${error.message}`);
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

  async findByUserId(userId: string): Promise<Post[]> {
    const { data: posts, error } = await this.supabase
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
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts by user: ${error.message}`);
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

  async findByCommunityId(communityId: string): Promise<Post[]> {
    const { data: posts, error } = await this.supabase
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
      .eq("community_id", communityId)
      .eq("status", "approved")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch posts by community: ${error.message}`);
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

  // Calculate trending score: (Like - Dislike) + (Comment × 2) / (Hours + 1)^1.5
  private calculateTrendingScore(post: Post): number {
    const now = new Date();
    const createdAt = new Date(post.created_at);
    const hoursSinceCreation = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
    
    const likes = post.likes_count || 0;
    const dislikes = post.dislikes_count || 0;
    const comments = post.comments_count || 0;
    
    // Formula: TrendingScore = (Like - Dislike) + (Comment × 2) / (Giờ + 1)^1.5
    const engagementScore = (likes - dislikes) + (comments * 2);
    const timeFactor = Math.pow(hoursSinceCreation + 1, 1.5);
    
    return engagementScore / timeFactor;
  }

  async findTrending(limit: number = 10): Promise<Post[]> {
    // Fetch approved posts from the last 7 days for trending calculation
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const { data: posts, error } = await this.supabase
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
      .eq("status", "approved")
      .gte("created_at", sevenDaysAgo.toISOString())
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch trending posts: ${error.message}`);
    }

    // Map posts and calculate trending score
    const postsWithScore = (posts || []).map((post) => {
      const author = post.author as any;
      const community = post.community as any;
      const mappedPost = {
        ...post,
        author: undefined,
        author_email: author?.email,
        author_name: author?.username || author?.email?.split("@")[0],
        community_name: community?.name,
        community: undefined,
      } as Post;
      
      return {
        post: mappedPost,
        trendingScore: this.calculateTrendingScore(mappedPost),
      };
    });

    // Sort by trending score (descending) and return top posts
    return postsWithScore
      .sort((a, b) => b.trendingScore - a.trendingScore)
      .slice(0, limit)
      .map(item => ({
        ...item.post,
        engagement_score: item.trendingScore,
      }));
  }

  async update(id: string, data: UpdatePostDTO): Promise<Post> {
    const { data: post, error } = await this.supabase
      .from("Post")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update post: ${error.message}`);
    }

    return post;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.from("Post").delete().eq("id", id);

    if (error) {
      throw new Error(`Failed to delete post: ${error.message}`);
    }
  }

  // Comment methods
  async createComment(data: CreateCommentDTO): Promise<Comment> {
    const { data: comment, error } = await this.supabase
      .from("Comments")
      .insert({
        content: data.content,
        user_id: data.user_id,
        post_id: data.post_id,
        parent_comment_id: data.parent_comment_id || null,
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create comment: ${error.message}`);
    }

    return comment;
  }

  async findCommentById(id: string): Promise<Comment | null> {
    const { data: comment, error } = await this.supabase
      .from("Comments")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to find comment: ${error.message}`);
    }

    return comment;
  }

  async findCommentsByPostId(postId: string): Promise<Comment[]> {
    const { data: comments, error } = await this.supabase
      .from("Comments")
      .select(
        `
        *,
        author:UserAccount!Comments_user_id_fkey (
          username,
          email
        )
      `
      )
      .eq("post_id", postId)
      .is("parent_comment_id", null)
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch comments: ${error.message}`);
    }

    // Map comments to include author info
    return (comments || []).map((comment) => {
      const author = comment.author as any;
      return {
        ...comment,
        author: undefined,
        author_email: author?.email,
        author_name: author?.username || author?.email?.split("@")[0],
      } as Comment;
    });
  }

  async findRepliesByCommentId(commentId: string): Promise<Comment[]> {
    const { data: replies, error } = await this.supabase
      .from("Comments")
      .select("*")
      .eq("parent_comment_id", commentId)
      .order("created_at", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch replies: ${error.message}`);
    }

    return replies || [];
  }

  async updateComment(id: string, data: UpdateCommentDTO): Promise<Comment> {
    const { data: comment, error } = await this.supabase
      .from("Comments")
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update comment: ${error.message}`);
    }

    return comment;
  }

  async deleteComment(id: string): Promise<void> {
    const { error } = await this.supabase
      .from("Comments")
      .delete()
      .eq("id", id);

    if (error) {
      throw new Error(`Failed to delete comment: ${error.message}`);
    }
  }
}
