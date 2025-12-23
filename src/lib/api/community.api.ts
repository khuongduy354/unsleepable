// API callers for community endpoints

interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
}

interface PaginatedResponse {
  communities: Community[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export const communityApi = {
  // Get paginated communities
  async getAll(
    page: number = 1,
    limit: number = 5
  ): Promise<PaginatedResponse> {
    const response = await fetch(`/api/community?page=${page}&limit=${limit}`);

    if (!response.ok) {
      throw new Error("Failed to fetch communities");
    }

    return await response.json();
  },

  // Get owned communities
  async getOwned(userId: string): Promise<PaginatedResponse> {
    const response = await fetch("/api/community/owned", {
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch owned communities");
    }

    return await response.json();
  },

  // Create community
  async create(
    userId: string,
    data: {
      name: string;
      description: string;
      visibility: "public" | "private";
    }
  ) {
    const response = await fetch("/api/community", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to create community");
    }

    return await response.json();
  },

  // Update community
  async update(
    communityId: string,
    userId: string,
    data: {
      name?: string;
      description?: string;
      visibility?: "public" | "private";
    }
  ) {
    const response = await fetch(`/api/community/${communityId}`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to update community");
    }

    return await response.json();
  },

  // Delete community
  async delete(communityId: string, userId: string) {
    const response = await fetch(`/api/community/${communityId}`, {
      method: "DELETE",
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to delete community");
    }

    return await response.json();
  },
};
