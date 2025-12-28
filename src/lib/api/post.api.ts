// API callers for post endpoints

export const postApi = {
  // Get post by ID
  async getById(id: string) {
    const res = await fetch(`/api/post/${id}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch post");
    }

    return data.post;
  },

  // Get posts by author ID
  async getByAuthorId(authorId: string) {
    const res = await fetch(`/api/post?authorId=${authorId}`);
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch posts");
    }

    return data.post;
  },

  // Get all posts
  async getAll() {
    const res = await fetch("/api/post");
    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to fetch posts");
    }

    return data.posts;
  },

  // Create new post
  async create(payload: {
    title: string;
    content: string;
    user_id: string;
    community_id: string;
  }) {
    const res = await fetch("/api/post", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to create post");
    }

    return data.post;
  },

  // Update post
  async update(
    id: string,
    payload: {
      title?: string;
      content?: string;
      shortUrl?: string;
      summary?: string;
    }
  ) {
    const res = await fetch(`/api/post/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to update post");
    }

    return data.post;
  },

  // Delete post
  async delete(id: string, userId?: string) {
    const headers: HeadersInit = {};
    if (userId) {
      headers["x-user-id"] = userId;
    }

    const res = await fetch(`/api/post/${id}`, {
      method: "DELETE",
      headers,
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to delete post");
    }

    return data;
  },

  // React to post (like/dislike)
  async react(postId: string, userId: string, type: "like" | "dislike") {
    const res = await fetch(`/api/post/${postId}/react`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ type }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || "Failed to react to post");
    }

    return data;
  },
};
