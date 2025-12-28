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
    limit: number = 5,
    visibility?: "public" | "private"
  ): Promise<PaginatedResponse> {
    let url = `/api/community?page=${page}&limit=${limit}`;
    if (visibility) {
      url += `&visibility=${visibility}`;
    }
    const response = await fetch(url);

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

  // Get member communities (communities where user is a member)
  async getMemberCommunities(
    page: number = 1,
    limit: number = 100
  ): Promise<PaginatedResponse> {
    const response = await fetch(
      `/api/community/member?page=${page}&limit=${limit}`
    );

    if (!response.ok) {
      throw new Error("Failed to fetch member communities");
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

  // Get community statistics (owner only)
  async getStatistics(
    communityId: string,
    userId: string
  ): Promise<{
    statistics: {
      communityId: string;
      totalPosts: number;
      totalMembers: number;
      activeEngagementRate: number;
    };
  }> {
    const response = await fetch(`/api/community/${communityId}/statistics`, {
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || "Failed to fetch community statistics"
      );
    }

    return await response.json();
  },

  // Join a community (returns pending status)
  async join(
    communityId: string,
    userId: string
  ): Promise<{ status: string; message: string }> {
    const response = await fetch(`/api/community/${communityId}/join`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to join community");
    }

    return await response.json();
  },

  // Leave a community
  async leave(communityId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/community/${communityId}/leave`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to leave community");
    }
  },

  // Get membership status for a community
  async getMembershipStatus(
    communityId: string,
    userId: string
  ): Promise<{ status: "none" | "pending" | "approved" | "owner" }> {
    const response = await fetch(
      `/api/community/${communityId}/membership-status`,
      {
        headers: {
          "x-user-id": userId,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get membership status");
    }

    return await response.json();
  },

  // Cancel a pending join request
  async cancelJoinRequest(communityId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/community/${communityId}/cancel-join`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to cancel join request");
    }
  },

  // Get pending posts for admin approval
  async getPendingPosts(userId: string): Promise<{ posts: any[] }> {
    const response = await fetch("/api/admin/posts/pending", {
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch pending posts");
    }

    return await response.json();
  },

  // Approve a post
  async approvePost(postId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/admin/posts/${postId}/approve`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to approve post");
    }
  },

  // Reject a post
  async rejectPost(postId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/admin/posts/${postId}/reject`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to reject post");
    }
  },

  // Get pending reports
  async getPendingReports(userId: string): Promise<{ reports: any[] }> {
    const response = await fetch("/api/admin/reports/pending", {
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch pending reports");
    }

    return await response.json();
  },

  // Handle report decision (approve/reject)
  async decideReport(
    reportId: string,
    userId: string,
    decision: "APPROVE" | "REJECT"
  ): Promise<void> {
    const response = await fetch(`/api/admin/reports/${reportId}/decide`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-user-id": userId,
      },
      body: JSON.stringify({ decision }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to handle report decision");
    }
  },

  // Get pending member requests for a community
  async getPendingMembers(
    communityId: string,
    userId: string
  ): Promise<{ pendingMembers: any[] }> {
    const response = await fetch(
      `/api/community/${communityId}/members/pending`,
      {
        headers: {
          "x-user-id": userId,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to fetch pending members");
    }

    return await response.json();
  },

  // Approve a member request
  async approveMember(
    communityId: string,
    userId: string,
    adminId: string
  ): Promise<void> {
    const response = await fetch(
      `/api/community/${communityId}/members/${userId}/approve`,
      {
        method: "POST",
        headers: {
          "x-user-id": adminId,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to approve member");
    }
  },

  // Reject a member request
  async rejectMember(
    communityId: string,
    userId: string,
    adminId: string
  ): Promise<void> {
    const response = await fetch(
      `/api/community/${communityId}/members/${userId}/reject`,
      {
        method: "POST",
        headers: {
          "x-user-id": adminId,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to reject member");
    }
  },

  // Get user's membership status in a community
  async getMembershipStatus(
    communityId: string,
    userId: string
  ): Promise<{ status: "none" | "pending" | "approved" | "owner" }> {
    const response = await fetch(
      `/api/community/${communityId}/membership-status`,
      {
        headers: {
          "x-user-id": userId,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to get membership status");
    }

    return await response.json();
  },

  // Cancel a pending join request
  async cancelJoinRequest(communityId: string, userId: string): Promise<void> {
    const response = await fetch(`/api/community/${communityId}/cancel-join`, {
      method: "POST",
      headers: {
        "x-user-id": userId,
      },
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error || "Failed to cancel join request");
    }
  },
};
