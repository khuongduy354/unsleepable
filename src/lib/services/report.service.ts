// src/services/IReportService.ts (File Interface)

import { CreateReportData, Report, ReportEntityType, IReportRepository } from "@/lib/types/report.type";

export interface IReportService {
    createReport(data: CreateReportData, reporterId: string): Promise<Report>;
    getPendingReports(): Promise<Report[]>;
    handleReportDecision(reportId: string, decision: 'APPROVE' | 'REJECT', adminId: string): Promise<void>;
}



export class ReportService implements IReportService {
    private reportRepository: IReportRepository;

    constructor(reportRepository: IReportRepository) {
        this.reportRepository = reportRepository;
    }

    async createReport(data: CreateReportData, reporterId: string): Promise<Report> {
        if (!data.reportedEntityId || !data.reportedEntityType || !data.reason) {
            throw new Error("Validation Error: Missing required fields (reportedEntityId, reportedEntityType, reason).");
        }
        
        const validTypes: ReportEntityType[] = ['POST', 'COMMENT'];
        if (!validTypes.includes(data.reportedEntityType)) {
             throw new Error("Validation Error: Invalid reported entity type. Must be 'POST' or 'COMMENT'.");
        }

        const entityExists = await this.reportRepository.entityExists(data.reportedEntityId, data.reportedEntityType);
        if (!entityExists) {
             throw new Error("Not Found: The reported entity does not exist.");
        }
        
        const newReport = await this.reportRepository.save(data, reporterId);

        return newReport;
    }

    async getPendingReports(): Promise<Report[]> {
        // Fetch reports with PENDING status from repository
        const pendingReports = await this.reportRepository.findPendingReports();
        return pendingReports;
    }

    async handleReportDecision(reportId: string, decision: 'APPROVE' | 'REJECT', adminId: string): Promise<void> {
        // Implementation for handling report decisions will go here
        const validDecisions = ['APPROVE', 'REJECT'];
        if (!validDecisions.includes(decision)) {
            throw new Error("Invalid decision. Must be 'APPROVE' or 'REJECT'.");
        }
        const newStatus = decision === 'APPROVE' ? 'RESOLVED' : 'REJECTED';
        await this.reportRepository.updateReportStatus(reportId, newStatus);
    }
}