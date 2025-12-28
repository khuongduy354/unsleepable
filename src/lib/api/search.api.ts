// API callers for search endpoints

import { PostSearchResult } from "@/lib/types/search.type";

export const searchApi = {
  // Search posts with optional tag filters
  async searchPosts(params: {
    query: string;
    orTags?: string;
    andTags?: string;
    notTags?: string;
    communityId?: string;
  }): Promise<PostSearchResult[]> {
    const searchParams = new URLSearchParams();

    // Always include query parameter (even if empty)
    searchParams.append("q", params.query || "");

    if (params.orTags?.trim()) {
      searchParams.append("orTags", params.orTags);
    }
    if (params.andTags?.trim()) {
      searchParams.append("andTags", params.andTags);
    }
    if (params.notTags?.trim()) {
      searchParams.append("notTags", params.notTags);
    }
    if (params.communityId) {
      searchParams.append("communityId", params.communityId);
    }

    const response = await fetch(`/api/search?${searchParams.toString()}`);

    if (!response.ok) {
      throw new Error("Search failed");
    }

    return await response.json();
  },
};
