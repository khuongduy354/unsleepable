// API callers for comment endpoints

import { Comment } from "@/lib/types/post.type";

export const commentApi = {
  // Get comments by post ID
  async getByPost(postId: string): Promise<{ comments: Comment[] }> {
    const res = await fetch(`/api/comment?postId=${postId}`);

    if (!res.ok) {
      throw new Error("Failed to fetch comments");
    }

    const data = await res.json();
    return { comments: data.comments || data };
  },

  // Alias for backward compatibility
  async getByPostId(postId: string): Promise<Comment[]> {
    const result = await this.getByPost(postId);
    return result.comments;
  },

  // Get replies for a comment
  async getReplies(commentId: string): Promise<Comment[]> {
    const res = await fetch(`/api/comment/${commentId}/replies`);

    if (!res.ok) {
      throw new Error("Failed to fetch replies");
    }

    return await res.json();
  },

  // Create comment
  async create(data: {
    content: string;
    post_id: string;
    user_id: string;
    parent_comment_id?: string;
  }): Promise<Comment> {
    const res = await fetch("/api/comment", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const responseData = await res.json();

    if (!res.ok) {
      throw new Error(responseData.error || "Failed to create comment");
    }

    return responseData.comment || responseData;
  },
};
