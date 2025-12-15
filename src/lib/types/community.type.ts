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
  update(id: string, data: UpdateCommunityDTO): Promise<Community>;
  delete(id: string): Promise<void>;
  isOwner(communityId: string, userId: string): Promise<boolean>;
  addTagToCommunityArray(communityId: string, tagName: string): Promise<void>;
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
