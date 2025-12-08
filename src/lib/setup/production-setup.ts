import { createClient } from "@/utils/supabase/server";
import { CommunityService } from "../services/community.service";
import { SupabaseCommunityRepository } from "@/lib/repositories/supabase/community.repository";
import { PostService } from "../services/post.service";
import { SupabasePostRepository } from "../repositories/supabase.repository";
import { SearchService } from "../services/search.service";
import { SupabaseSearchRepository } from "../repositories/supabase/search.repository";

/**
 * Dependency Injection Container
 * Sets up and wires together all services and repositories
 */

export async function setupCommunityService() {
  // Create Supabase client
  const supabase = await createClient();

  // Initialize repository with Supabase client
  const communityRepository = new SupabaseCommunityRepository(supabase);

  // Initialize service with repository
  const communityService = new CommunityService(communityRepository);

  return communityService;
}

export async function setupPostService() {
  const supabase = await createClient();
  const postRepository = new SupabasePostRepository(supabase);
  const postService = new PostService(postRepository);
  return postService;
}

export async function setupSearchService() {
  const supabase = await createClient();
  const searchRepository = new SupabaseSearchRepository(supabase);
  const searchService = new SearchService(searchRepository);
  return searchService;
}

let communityServiceInstance: CommunityService | null = null;
let postServiceInstance: PostService | null = null;
let searchServiceInstance: SearchService | null = null;

export async function getCommunityService(): Promise<CommunityService> {
  if (!communityServiceInstance) {
    communityServiceInstance = await setupCommunityService();
  }
  return communityServiceInstance;
}

export async function getPostService(): Promise<PostService> {
  if (!postServiceInstance) {
    postServiceInstance = await setupPostService();
  }
  return postServiceInstance;
}

export async function getSearchService(): Promise<SearchService> {
  if (!searchServiceInstance) {
    searchServiceInstance = await setupSearchService();
  }
  return searchServiceInstance;
}
