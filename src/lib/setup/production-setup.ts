import { createClient } from "@/utils/supabase/server";
import { PostService } from "../services/post.service";
import { SupabasePostRepository } from "../repositories/supabase.repository";

/**
 * Dependency Injection Container
 * Sets up and wires together all services and repositories
 */

export async function setupPostService() {
  // Create Supabase client
  const supabase = await createClient();

  // Initialize repository with Supabase client
  const postRepository = new SupabasePostRepository(supabase);

  // Initialize service with repository
  const postService = new PostService(postRepository);

  return postService;
}

// Export a singleton instance getter
let postServiceInstance: PostService | null = null;

export async function getPostService(): Promise<PostService> {
  if (!postServiceInstance) {
    postServiceInstance = await setupPostService();
  }
  return postServiceInstance;
}
