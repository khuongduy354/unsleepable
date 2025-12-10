import { createClient } from "@/utils/supabase/server";
import { CommunityService } from "../services/community.service";
import { SupabaseCommunityRepository } from "@/lib/repositories/supabase/community.repository";

import { PostService } from "../services/post.service";
import { SupabasePostRepository } from "@/lib/repositories/supabase.repository";

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

let communityServiceInstance: CommunityService | null = null;

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

let postServiceInstance: PostService | null = null;

export async function getPostService(): Promise<PostService> {
  if (!postServiceInstance) {
    postServiceInstance = await setupPostService();
  }
  return postServiceInstance;
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