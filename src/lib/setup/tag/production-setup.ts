import { createClient } from "@/utils/supabase/server";
import { TagService } from "../../services/tag.service";
import { CommunityService } from "../../services/community.service";
import { SupabaseTagRepository } from "@/lib/repositories/supabase/tag.repository";
import { SupabasePostRepository } from "@/lib/repositories/supabase.repository";
import { SupabaseCommunityRepository } from "@/lib/repositories/supabase/community.repository";

/**
 * Dependency Injection Container
 * Sets up and wires together all services and repositories
 */

export async function setupTagService() {
  const supabase = await createClient();

  const tagRepository = new SupabaseTagRepository(supabase);
  const postRepository = new SupabasePostRepository(supabase); 
  const communityRepository = new SupabaseCommunityRepository(supabase); 

  const communityService = new CommunityService(communityRepository); 

  const tagService = new TagService(
    tagRepository,
    communityService,
    postRepository   
  );

  return tagService;
}

let tagServiceInstance: TagService | null = null;

export async function getTagService(): Promise<TagService> {
  if (!tagServiceInstance) {
    tagServiceInstance = await setupTagService();
  }
  return tagServiceInstance;
}
