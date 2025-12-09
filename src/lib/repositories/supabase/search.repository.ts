import { SupabaseClient } from "@supabase/supabase-js";
import {
  ISearchRepository,
  SearchPostsDTO,
  PostSearchResult,
} from "@/lib/types/search.type";

export class SupabaseSearchRepository implements ISearchRepository {
  constructor(private supabase: SupabaseClient) {}

  async searchPosts(params: SearchPostsDTO): Promise<PostSearchResult[]> {
    const {
      query,
      communityId = null,
      limit = 20,
      offset = 0,
    } = params;

    const { data, error } = await this.supabase.rpc("search_posts", {
      search_query: query,
      community_id_filter: communityId,
      limit_count: limit,
      offset_count: offset,
    });

    if (error) {
      throw new Error(`Failed to search posts: ${error.message}`);
    }

    return data as PostSearchResult[];
  }
}
