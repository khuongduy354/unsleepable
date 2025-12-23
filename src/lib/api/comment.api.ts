// API callers for comment endpoints

import { Comment } from "@/lib/types/post.type";

export const commentApi = {
  // Get comments by post ID
  async getByPostId(postId: string): Promise<Comment[]> {
    const res = await fetch(`/api/comment?postId=${postId}`);

    if (!res.ok) {
      throw new Error("Failed to fetch comments");
    }

    return await res.json();
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

    if (!res.ok) {
      throw new Error("Failed to create comment");
    }

    return await res.json();
  },
};
