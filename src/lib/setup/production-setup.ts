import { createClient } from "@/utils/supabase/server";
import { CommunityService } from "../services/community.service";
import { SupabaseCommunityRepository } from "@/lib/repositories/supabase/community.repository";
// import { PostService } from "../services/post.service";
// import { SupabasePostRepository } from "../repositories/supabase.repository";
import { SearchService } from "../services/search.service";
import { SupabaseSearchRepository } from "../repositories/supabase/search.repository";
import { NotificationService } from "../services/notification.service";
import { SupabaseNotificationRepository } from "../repositories/supabase/notification.repository";

import { PostService } from "../services/post.service";
import { SupabasePostRepository } from "@/lib/repositories/supabase.repository";

import { TagService } from "../services/tag.service";
import { SupabaseTagRepository } from "@/lib/repositories/supabase/tag.repository";

import { MessageService } from "../services/message.service";
import { SupabaseDirectMessageRepository } from "@/lib/repositories/supabase/message.repository"; 
import { ReportService } from "../services/report.service"; 
import { SupabaseReportRepository } from "@/lib/repositories/supabase/report.repository"; 
// import { IReportService } from "../../services/ReportService";
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

// export async function setupPostService() {
//   const supabase = await createClient();
//   const postRepository = new SupabasePostRepository(supabase);
//   const postService = new PostService(postRepository);
//   return postService;
// }

export async function setupSearchService() {
  const supabase = await createClient();
  const searchRepository = new SupabaseSearchRepository(supabase);
  const searchService = new SearchService(searchRepository);
  return searchService;
}

export async function setupNotificationService() {
  const supabase = await createClient();
  const notificationRepository = new SupabaseNotificationRepository(supabase);
  const notificationService = new NotificationService(notificationRepository);
  return notificationService;
}

let communityServiceInstance: CommunityService | null = null;
let postServiceInstance: PostService | null = null;
let searchServiceInstance: SearchService | null = null;
let notificationServiceInstance: NotificationService | null = null;

export async function getCommunityService(): Promise<CommunityService> {
  if (!communityServiceInstance) {
    communityServiceInstance = await setupCommunityService();
  }
  return communityServiceInstance;
}


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

// let postServiceInstance: PostService | null = null;

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

export async function getNotificationService(): Promise<NotificationService> {
  if (!notificationServiceInstance) {
    notificationServiceInstance = await setupNotificationService();
  }
  return notificationServiceInstance;
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
export async function setupReportService(): Promise<ReportService> {
    // Create Supabase client
    const supabase = await createClient();

    // 1. Initialize repository with Supabase client
    const reportRepository = new SupabaseReportRepository(supabase);

    // 2. Initialize service with repository
    const reportService = new ReportService(reportRepository);

    return reportService;
}

// Global instance variable
let reportServiceInstance: ReportService | null = null;

// Hàm Public để lấy instance
export async function getReportService(): Promise<ReportService> {
    if (!reportServiceInstance) {
        reportServiceInstance = await setupReportService();
    }
    // Trả về instance đã được khởi tạo
    return reportServiceInstance; 
}
