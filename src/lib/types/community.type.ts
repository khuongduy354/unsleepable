// DTOs for Community Entity
export interface CreateCommunityDTO {
  name: string;
  description?: string;
  visibility?: "public" | "private";
  creator_id: string; // user who creates the community
}

export interface UpdateCommunityDTO {
  name?: string;
  description?: string;
  visibility?: "public" | "private";
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
  update(id: string, data: UpdateCommunityDTO): Promise<Community>;
  delete(id: string): Promise<void>;
  isOwner(communityId: string, userId: string): Promise<boolean>;
  getCommunityStats(communityId: string): Promise<CommunityStatsDTO>;
}

// Entity
export interface Community {
  id: string;
  name: string;
  description: string | null;
  visibility: string;
  created_at: string;
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