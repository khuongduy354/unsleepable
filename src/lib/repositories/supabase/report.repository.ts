import { SupabaseClient } from "@supabase/supabase-js";
import {
  CreateReportData,
  Report,
  ReportEntityType,
  ReportStatus,
  IReportRepository,
} from "../../types/report.type";

const POST_TABLE = "Post";
const COMMENT_TABLE = "Comment";
const REPORT_TABLE = "Report";

export class SupabaseReportRepository implements IReportRepository {
  constructor(private supabase: SupabaseClient) {}
  private toDbStructure(data: CreateReportData, reporterId: string) {
    return {
      reporter_user_id: reporterId,
      reason: data.reason,
      status: "PENDING",
      reported_post_id:
        data.reportedEntityType === "POST" ? data.reportedEntityId : null,
      reported_comment_id:
        data.reportedEntityType === "COMMENT" ? data.reportedEntityId : null,
    };
  }

  async save(data: CreateReportData, reporterId: string): Promise<Report> {
    const dbData = this.toDbStructure(data, reporterId);

    const { data: report, error } = await this.supabase
      .from(REPORT_TABLE)
      .insert(dbData)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save report: ${error.message}`);
    }
    return report as Report;
  }

  /**
   * Kiểm tra sự tồn tại của Post hoặc Comment bị báo cáo.
   */
  async entityExists(id: string, type: ReportEntityType): Promise<boolean> {
    let tableName: string;

    // 1. Chọn bảng phù hợp
    if (type === "POST") {
      tableName = POST_TABLE;
    } else if (type === "COMMENT") {
      tableName = COMMENT_TABLE;
    } else {
      return false;
    }

    const { count, error } = await this.supabase
      .from(tableName)
      .select("id", { count: "exact", head: true })
      .eq("id", id);

    if (error) {
      return false;
    }

    return (count || 0) > 0;
  }

  async findPendingReports(): Promise<Report[]> {
    const { data: reports, error } = await this.supabase
      .from(REPORT_TABLE)
      .select("*")
      .eq("status", "PENDING")
      .order("created_at", { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch pending reports: ${error.message}`);
    }

    return reports || [];
  }

  async updateReportStatus(
    reportId: string,
    status: ReportStatus
  ): Promise<Report> {
    const { data: report, error } = await this.supabase
      .from(REPORT_TABLE)
      .update({ status })
      .eq("id", reportId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update report status: ${error.message}`);
    }

    return report as Report;
  }

  /**
   * Lấy chi tiết báo cáo bao gồm thông tin entity bị báo cáo
   */
  async getReportById(reportId: string): Promise<Report | null> {
    const { data: report, error } = await this.supabase
      .from(REPORT_TABLE)
      .select("*")
      .eq("id", reportId)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return null;
      }
      throw new Error(`Failed to fetch report: ${error.message}`);
    }

    return report as Report;
  }

  /**
   * Xóa post bị báo cáo
   */
  async deletePost(postId: string): Promise<void> {
    try {
      // First delete related PostTag records
      const { error: tagError } = await this.supabase
        .from("PostTag")
        .delete()
        .eq("post_id", postId);

      if (tagError) {
        console.warn(
          `Warning: Failed to delete PostTags for post ${postId}: ${tagError.message}`
        );
        // Don't throw, continue with post deletion
      }

      // Then delete the post
      const { error } = await this.supabase
        .from(POST_TABLE)
        .delete()
        .eq("id", postId);

      if (error) {
        throw new Error(`Failed to delete post: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Xóa comment bị báo cáo
   */
  async deleteComment(commentId: string): Promise<void> {
    try {
      // Delete comment and any related replies (child comments)
      const { error: repliesError } = await this.supabase
        .from(COMMENT_TABLE)
        .delete()
        .eq("parent_comment_id", commentId);

      if (repliesError) {
        console.warn(
          `Warning: Failed to delete comment replies: ${repliesError.message}`
        );
        // Don't throw, continue with main comment deletion
      }

      // Then delete the main comment
      const { error } = await this.supabase
        .from(COMMENT_TABLE)
        .delete()
        .eq("id", commentId);

      if (error) {
        throw new Error(`Failed to delete comment: ${error.message}`);
      }
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get the community_id for a report (from the reported post or comment's post)
   */
  async getCommunityIdForReport(report: Report): Promise<string | null> {
    if (report.reported_post_id) {
      // Get community_id from the post directly
      const { data: post, error } = await this.supabase
        .from(POST_TABLE)
        .select("community_id")
        .eq("id", report.reported_post_id)
        .single();

      if (error || !post) return null;
      return post.community_id;
    } else if (report.reported_comment_id) {
      // Get post_id from comment, then get community_id from post
      const { data: comment, error: commentError } = await this.supabase
        .from(COMMENT_TABLE)
        .select("post_id")
        .eq("id", report.reported_comment_id)
        .single();

      if (commentError || !comment) return null;

      const { data: post, error: postError } = await this.supabase
        .from(POST_TABLE)
        .select("community_id")
        .eq("id", comment.post_id)
        .single();

      if (postError || !post) return null;
      return post.community_id;
    }
    return null;
  }
}
