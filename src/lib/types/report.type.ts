export type ReportEntityType = 'POST' | 'COMMENT';
export type ReportStatus = 'PENDING' | 'RESOLVED' | 'REJECTED'; 

export interface CreateReportData {
    reason: string;
    reportedEntityId: string; // ID của Post HOẶC Comment
    reportedEntityType: ReportEntityType;
}

export interface Report {
    id: string;
    reporter_user_id: string;
    reason: string;
    status: ReportStatus;
    created_at: string; 
    reported_post_id: string | null;
    reported_comment_id: string | null;
}

// Định nghĩa Interface cho Repository 
export interface IReportRepository {
    save(data: CreateReportData, reporterId: string): Promise<Report>;
    entityExists(id: string, type: ReportEntityType): Promise<boolean>;
    // Hàm Admin sẽ thêm sau:
    // findPendingReports(): Promise<Report[]>;
    // updateReportStatus(reportId: string, status: ReportStatus): Promise<Report>;
}

