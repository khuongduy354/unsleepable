import { SupabaseClient } from "@supabase/supabase-js";
import { 
    CreateReportData, 
    Report, 
    ReportEntityType, 
    IReportRepository 
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
            status: 'PENDING', 
            reported_post_id: data.reportedEntityType === 'POST' ? data.reportedEntityId : null,
            reported_comment_id: data.reportedEntityType === 'COMMENT' ? data.reportedEntityId : null,
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
        if (type === 'POST') {
            tableName = POST_TABLE;
        } else if (type === 'COMMENT') {
            tableName = COMMENT_TABLE;
        } else {
            return false; 
        }

        const { count, error } = await this.supabase
            .from(tableName)
            .select("id", { count: 'exact', head: true }) 
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

    async updateReportStatus(reportId: string, status: ReportStatus): Promise<Report> {
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