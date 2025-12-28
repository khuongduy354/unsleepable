// DTOs for Community Entity
export interface CreateCommunityDTO {
  name: string;
  description?: string;
  visibility?: "public" | "private";
  creator_id: string;
  tags?: string[];
}

export interface UpdateCommunityDTO {
  name?: string;
  description?: string;
  visibility?: "public" | "private";
  tags?: string[];
}

export interface CommunityFilters {
  userId?: string; // for fetching owned communities
  visibility?: "public" | "private";
  page?: number;
  limit?: number;
}

// Interfaces
export interface ICommunityRepository {
  create(data: CreateCommunityDTO): Promise<Community>;
  findById(id: string): Promise<Community | null>;
  findAll(filters?: CommunityFilters): Promise<PaginatedCommunities>;
  findByOwnerId(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedCommunities>;
  findByMemberId(
    userId: string,
    page?: number,
    limit?: number
  ): Promise<PaginatedCommunities>;
  update(id: string, data: UpdateCommunityDTO): Promise<Community>;
  delete(id: string): Promise<void>;
  isOwner(communityId: string, userId: string): Promise<boolean>;
  isMember(communityId: string, userId: string): Promise<boolean>;
  hasPendingRequest(communityId: string, userId: string): Promise<boolean>;
  addMember(
    communityId: string,
    userId: string,
    role?: string,
    status?: "pending" | "approved"
  ): Promise<void>;
  removeMember(communityId: string, userId: string): Promise<void>;
  approveMember(communityId: string, userId: string): Promise<void>;
  rejectMember(communityId: string, userId: string): Promise<void>;
  getPendingMembers(communityId: string): Promise<PendingMember[]>;
  addTagToCommunityArray(communityId: string, tagName: string): Promise<void>;
  getCommunityStats(communityId: string): Promise<CommunityStatsDTO>;
}

// Pending member entity
export interface PendingMember {
  user_id: string;
  username?: string;
  email?: string;
  requested_at: string;
}

// Entity
export interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
  tags: string[];
}

export interface PaginatedCommunities {
  communities: Community[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CommunityStatsDTO {
  communityId: string;
  totalPosts: number;
  totalMembers: number;
  activeEngagementRate: number;
}
