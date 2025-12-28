import {
  ICommunityRepository,
  Community,
  CreateCommunityDTO,
  UpdateCommunityDTO,
  CommunityFilters,
  PaginatedCommunities,
  CommunityStatsDTO,
  PendingMember,
} from "../types/community.type";

export interface ICommunityService {
  createCommunity(data: CreateCommunityDTO): Promise<Community>;
  getCommunityById(id: string): Promise<Community | null>;
  getCommunities(filters?: CommunityFilters): Promise<PaginatedCommunities>;
  getOwnedCommunities(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedCommunities>;
  getMemberCommunities(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedCommunities>;
  updateCommunity(
    id: string,
    userId: string,
    data: UpdateCommunityDTO
  ): Promise<Community>;
  deleteCommunity(id: string, userId: string): Promise<void>;
  syncTagToCommunity(communityId: string, tagName: string): Promise<void>;
  getStats(id: string, userId: string): Promise<CommunityStatsDTO>;
  isMember(communityId: string, userId: string): Promise<boolean>;
  joinCommunity(
    communityId: string,
    userId: string
  ): Promise<{ status: "pending" | "approved"; message: string }>;
  leaveCommunity(communityId: string, userId: string): Promise<void>;
  approveMember(
    communityId: string,
    userId: string,
    adminId: string
  ): Promise<void>;
  rejectMember(
    communityId: string,
    userId: string,
    adminId: string
  ): Promise<void>;
  getPendingMembers(
    communityId: string,
    adminId: string
  ): Promise<PendingMember[]>;
  getMembershipStatus(
    communityId: string,
    userId: string
  ): Promise<"none" | "pending" | "approved" | "owner">;
  cancelJoinRequest(communityId: string, userId: string): Promise<void>;
}

export class CommunityService implements ICommunityService {
  constructor(private communityRepository: ICommunityRepository) {}

  async createCommunity(data: CreateCommunityDTO): Promise<Community> {
    // Validation
    if (!data.name || data.name.trim().length === 0) {
      throw new Error("Community name is required");
    }

    if (data.name.length > 100) {
      throw new Error("Community name must be less than 100 characters");
    }

    if (!data.creator_id) {
      throw new Error("Creator ID is required");
    }

    // Set default visibility if not provided
    if (!data.visibility) {
      data.visibility = "public";
    }

    if (!data.tags) {
      data.tags = [];
    }

    return await this.communityRepository.create(data);
  }

  async getCommunityById(id: string): Promise<Community | null> {
    if (!id) {
      throw new Error("Community ID is required");
    }
    return await this.communityRepository.findById(id);
  }

  async getCommunities(
    filters?: CommunityFilters
  ): Promise<PaginatedCommunities> {
    // Default pagination values
    const page = filters?.page || 1;
    const limit = filters?.limit || 10;

    if (page < 1) {
      throw new Error("Page must be greater than 0");
    }

    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }

    return await this.communityRepository.findAll({
      ...filters,
      page,
      limit,
    });
  }

  async getOwnedCommunities(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedCommunities> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (page < 1) {
      throw new Error("Page must be greater than 0");
    }

    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }

    return await this.communityRepository.findByOwnerId(userId, page, limit);
  }

  async getMemberCommunities(
    userId: string,
    page: number = 1,
    limit: number = 10
  ): Promise<PaginatedCommunities> {
    if (!userId) {
      throw new Error("User ID is required");
    }

    if (page < 1) {
      throw new Error("Page must be greater than 0");
    }

    if (limit < 1 || limit > 100) {
      throw new Error("Limit must be between 1 and 100");
    }

    return await this.communityRepository.findByMemberId(userId, page, limit);
  }

  async updateCommunity(
    id: string,
    userId: string,
    data: UpdateCommunityDTO
  ): Promise<Community> {
    if (!id) {
      throw new Error("Community ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Validate at least one field is being updated
    if (!data.name && !data.description && !data.visibility) {
      throw new Error("At least one field must be provided for update");
    }

    // Validate name if provided
    if (data.name !== undefined) {
      if (data.name.trim().length === 0) {
        throw new Error("Community name cannot be empty");
      }
      if (data.name.length > 100) {
        throw new Error("Community name must be less than 100 characters");
      }
    }

    if (data.tags !== undefined) {
      if (!Array.isArray(data.tags)) {
        throw new Error("Tags must be provided as an array");
      }
      if (data.tags.length > 10) {
        throw new Error("Cannot add more than 10 tags to a community");
      }

      for (const tag of data.tags) {
        if (typeof tag !== "string" || tag.trim().length === 0) {
          throw new Error("All tags must be non-empty strings");
        }
        // Giới hạn độ dài từng tag (Ví dụ: Tối đa 50 ký tự)
        if (tag.length > 50) {
          throw new Error("Each tag must be less than 50 characters");
        }
      }
    }
    // Check ownership
    const isOwner = await this.communityRepository.isOwner(id, userId);
    if (!isOwner) {
      throw new Error("User is not the owner of this community");
    }

    return await this.communityRepository.update(id, data);
  }

  async deleteCommunity(id: string, userId: string): Promise<void> {
    if (!id) {
      throw new Error("Community ID is required");
    }

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Check if community exists
    const community = await this.communityRepository.findById(id);
    if (!community) {
      throw new Error("Community not found");
    }

    // Check ownership
    const isOwner = await this.communityRepository.isOwner(id, userId);
    if (!isOwner) {
      throw new Error("User is not the owner of this community");
    }

    await this.communityRepository.delete(id);
  }
  async syncTagToCommunity(
    communityId: string,
    tagName: string
  ): Promise<void> {
    await this.communityRepository.addTagToCommunityArray(communityId, tagName);
  }

  async getStats(id: string, userId: string): Promise<CommunityStatsDTO> {
    if (!id) {
      throw new Error("Community ID is required.");
    }

    const community = await this.communityRepository.findById(id);
    if (!community) {
      throw new Error("Community not found.");
    }
    // Check ownership
    const isOwner = await this.communityRepository.isOwner(id, userId);
    if (!isOwner) {
      throw new Error("User is not the owner of this community");
    }

    return await this.communityRepository.getCommunityStats(id);
  }

  async isMember(communityId: string, userId: string): Promise<boolean> {
    if (!communityId) {
      throw new Error("Community ID is required");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }
    return await this.communityRepository.isMember(communityId, userId);
  }

  async joinCommunity(
    communityId: string,
    userId: string
  ): Promise<{ status: "pending" | "approved"; message: string }> {
    if (!communityId) {
      throw new Error("Community ID is required");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Check if community exists
    const community = await this.communityRepository.findById(communityId);
    if (!community) {
      throw new Error("Community not found");
    }

    // Check if user is already a member
    const isMember = await this.communityRepository.isMember(
      communityId,
      userId
    );
    if (isMember) {
      throw new Error("User is already a member of this community");
    }

    // Check if user already has a pending request
    const hasPendingRequest = await this.communityRepository.hasPendingRequest(
      communityId,
      userId
    );
    if (hasPendingRequest) {
      throw new Error(
        "You already have a pending join request for this community"
      );
    }

    // Add member with pending status - requires admin approval
    await this.communityRepository.addMember(
      communityId,
      userId,
      "member",
      "pending"
    );

    return {
      status: "pending",
      message: "Join request submitted. Waiting for admin approval.",
    };
  }

  async approveMember(
    communityId: string,
    userId: string,
    adminId: string
  ): Promise<void> {
    // Verify admin is owner of the community
    const isOwner = await this.communityRepository.isOwner(
      communityId,
      adminId
    );
    if (!isOwner) {
      throw new Error("Unauthorized: Only community owner can approve members");
    }

    await this.communityRepository.approveMember(communityId, userId);
  }

  async rejectMember(
    communityId: string,
    userId: string,
    adminId: string
  ): Promise<void> {
    // Verify admin is owner of the community
    const isOwner = await this.communityRepository.isOwner(
      communityId,
      adminId
    );
    if (!isOwner) {
      throw new Error("Unauthorized: Only community owner can reject members");
    }

    await this.communityRepository.rejectMember(communityId, userId);
  }

  async getPendingMembers(
    communityId: string,
    adminId: string
  ): Promise<any[]> {
    // Verify admin is owner of the community
    const isOwner = await this.communityRepository.isOwner(
      communityId,
      adminId
    );
    if (!isOwner) {
      throw new Error(
        "Unauthorized: Only community owner can view pending members"
      );
    }

    return await this.communityRepository.getPendingMembers(communityId);
  }

  async leaveCommunity(communityId: string, userId: string): Promise<void> {
    if (!communityId) {
      throw new Error("Community ID is required");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Check if community exists
    const community = await this.communityRepository.findById(communityId);
    if (!community) {
      throw new Error("Community not found");
    }

    // Check if user is a member
    const isMember = await this.communityRepository.isMember(
      communityId,
      userId
    );
    if (!isMember) {
      throw new Error("User is not a member of this community");
    }

    // Don't allow owner to leave their own community
    const isOwner = await this.communityRepository.isOwner(communityId, userId);
    if (isOwner) {
      throw new Error("Owner cannot leave their own community");
    }

    await this.communityRepository.removeMember(communityId, userId);
  }

  async getMembershipStatus(
    communityId: string,
    userId: string
  ): Promise<"none" | "pending" | "approved" | "owner"> {
    if (!communityId) {
      throw new Error("Community ID is required");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Check if user is owner
    const isOwner = await this.communityRepository.isOwner(communityId, userId);
    if (isOwner) {
      return "owner";
    }

    // Check if user has pending request
    const hasPendingRequest = await this.communityRepository.hasPendingRequest(
      communityId,
      userId
    );
    if (hasPendingRequest) {
      return "pending";
    }

    // Check if user is approved member
    const isMember = await this.communityRepository.isMember(
      communityId,
      userId
    );
    if (isMember) {
      return "approved";
    }

    return "none";
  }

  async cancelJoinRequest(communityId: string, userId: string): Promise<void> {
    if (!communityId) {
      throw new Error("Community ID is required");
    }
    if (!userId) {
      throw new Error("User ID is required");
    }

    // Check if user has a pending request
    const hasPendingRequest = await this.communityRepository.hasPendingRequest(
      communityId,
      userId
    );
    if (!hasPendingRequest) {
      throw new Error("No pending join request found");
    }

    // Remove the pending request (rejectMember removes pending memberships)
    await this.communityRepository.rejectMember(communityId, userId);
  }
}
