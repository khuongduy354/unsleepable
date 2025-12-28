// API callers for tag endpoints

interface Tag {
  id: string;
  Name: string;
}

interface TagsResponse {
  tags: Tag[];
}

export const tagApi = {
  // Get all tags
  async getAll(): Promise<TagsResponse> {
    const response = await fetch("/api/tag");

    if (!response.ok) {
      throw new Error("Failed to fetch tags");
    }

    return await response.json();
  },

  // Get tags by community ID
  async getByCommunity(communityId: string): Promise<TagsResponse> {
    const response = await fetch(`/api/tag?communityId=${communityId}`);

    if (!response.ok) {
      throw new Error("Failed to fetch community tags");
    }

    return await response.json();
  },
};
