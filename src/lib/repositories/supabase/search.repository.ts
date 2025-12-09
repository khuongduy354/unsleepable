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
      tagFilters = [],
      communityId = null,
      limit = 20,
      offset = 0,
    } = params;

    // Separate tags by operator
    const orTags = tagFilters.find(f => f.operator === 'OR')?.tags || null;
    const andTags = tagFilters.find(f => f.operator === 'AND')?.tags || null;
    const notTags = tagFilters.find(f => f.operator === 'NOT')?.tags || null;

    const { data, error } = await this.supabase.rpc("search_posts_with_tags", {
      search_query: query,
      or_tags: orTags,
      and_tags: andTags,
      not_tags: notTags,
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
