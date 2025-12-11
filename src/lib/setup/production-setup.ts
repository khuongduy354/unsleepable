import { createClient } from "@/utils/supabase/server";
import { CommunityService } from "../services/community.service";
import { SupabaseCommunityRepository } from "@/lib/repositories/supabase/community.repository";

import { PostService } from "../services/post.service";
import { SupabasePostRepository } from "@/lib/repositories/supabase.repository";

import { TagService } from "../services/tag.service";
import { SupabaseTagRepository } from "@/lib/repositories/supabase/tag.repository";

import { MessageService } from "../services/message.service";
import { SupabaseDirectMessageRepository } from "@/lib/repositories/supabase/message.repository"; 
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

let communityServiceInstance: CommunityService | null = null;

export async function getCommunityService(): Promise<CommunityService> {
  if (!communityServiceInstance) {
    communityServiceInstance = await setupCommunityService();
  }
  return communityServiceInstance;
}

export async function setupPostService() {
  // Create Supabase client
  const supabase = await createClient();

  // Initialize repository with Supabase client
  const postRepository = new SupabasePostRepository(supabase);

  // Initialize service with repository
  const postService = new PostService(postRepository);

  return postService;
}

let postServiceInstance: PostService | null = null;

export async function getPostService(): Promise<PostService> {
  if (!postServiceInstance) {
    postServiceInstance = await setupPostService();
  }
  return postServiceInstance;
}

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

let messageServiceInstance: MessageService | null = null;

export async function setupMessageService() {
  const supabase = await createClient();

  const messageRepository = new SupabaseDirectMessageRepository(supabase);

  const messageService = new MessageService(messageRepository);

  return messageService;
}

export async function getMessageService(): Promise<MessageService> {
  if (!messageServiceInstance) {
      messageServiceInstance = await setupMessageService();
  }
  return messageServiceInstance;
}