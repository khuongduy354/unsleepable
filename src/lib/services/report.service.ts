// src/services/IReportService.ts (File Interface)

import { CreateReportData, Report, ReportEntityType, IReportRepository } from "@/lib/types/report.type";

export interface IReportService {
    createReport(data: CreateReportData, reporterId: string): Promise<Report>;

    // Các hàm xử lý Admin sẽ thêm sau:
    // getPendingReports(): Promise<Report[]>;
    // handleReportDecision(reportId: string, decision: 'APPROVE' | 'REJECT', adminId: string): Promise<void>;
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
}