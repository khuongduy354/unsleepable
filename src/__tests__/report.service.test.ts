import { ReportService } from "@/lib/services/report.service";
import {
  CreateReportData,
  Report,
  ReportEntityType,
  ReportStatus,
} from "@/lib/types/report.type";

describe("ReportService", () => {
  let repo: any;
  let communityRepo: any;
  let service: ReportService;

  beforeEach(() => {
    // lightweight mock implementation
    repo = {
      _savedReports: [] as Report[],
      entityExists: jest.fn(async (id: string, type: ReportEntityType) => {
        // default true; tests can override
        return true;
      }),
      save: jest.fn(async (data: CreateReportData, reporterId: string) => {
        const report: Report = {
          id: `report-${Math.random().toString(36).slice(2, 8)}`,
          reporter_user_id: reporterId,
          reason: data.reason,
          status: "PENDING",
          created_at: new Date().toISOString(),
          reported_post_id: data.reportedEntityType === "POST" ? data.reportedEntityId : null,
          reported_comment_id: data.reportedEntityType === "COMMENT" ? data.reportedEntityId : null,
          community_id: "community-1",
        };
        repo._savedReports.push(report);
        return report;
      }),
      findPendingReports: jest.fn(async () => repo._savedReports.filter((r: Report) => r.status === "PENDING")),
      getReportById: jest.fn(async (id: string) => repo._savedReports.find((r: Report) => r.id === id) || null),
      updateReportStatus: jest.fn(async (id: string, status: ReportStatus) => {
        const r = repo._savedReports.find((x: Report) => x.id === id)!;
        if (!r) throw new Error("Report not found");
        r.status = status;
        return r;
      }),
      deletePost: jest.fn(async (postId: string) => {}),
      deleteComment: jest.fn(async (commentId: string) => {}),
      getCommunityIdForReport: jest.fn(async (report: Report) => report.community_id || null),
    };

    communityRepo = {
      isOwner: jest.fn(async (communityId: string, userId: string) => true),
    };

    service = new ReportService(repo, communityRepo);
  });

  describe("createReport", () => {
    it("creates a POST report when entity exists", async () => {
      const data: CreateReportData = {
        reason: "spam",
        reportedEntityId: "post-1",
        reportedEntityType: "POST",
      };

      (repo.entityExists as jest.Mock).mockResolvedValueOnce(true);

      const res = await service.createReport(data, "reporter-1");

      expect(res).toBeDefined();
      expect(res.reporter_user_id).toBe("reporter-1");
      expect(res.reported_post_id).toBe("post-1");
      expect(repo.save).toHaveBeenCalledWith(data, "reporter-1");
    });

    it("throws when required fields are missing", async () => {
      const data: any = { reportedEntityId: "", reportedEntityType: "POST", reason: "" };
      await expect(service.createReport(data, "r")).rejects.toThrow("Validation Error");
    });

    it("throws when entity type is invalid", async () => {
      const data: any = { reportedEntityId: "x", reportedEntityType: "USER", reason: "r" };
      await expect(service.createReport(data, "r")).rejects.toThrow("Invalid reported entity type");
    });

    it("throws when reported entity does not exist", async () => {
      (repo.entityExists as jest.Mock).mockResolvedValueOnce(false);
      const data: CreateReportData = {
        reason: "reason",
        reportedEntityId: "missing",
        reportedEntityType: "POST",
      };
      await expect(service.createReport(data, "u")).rejects.toThrow("Not Found");
    });
  });

  describe("getPendingReports", () => {
    it("returns pending reports from repository", async () => {
      // seed a pending report
      const r: Report = {
        id: "r-1",
        reporter_user_id: "u1",
        reason: "r",
        status: "PENDING",
        created_at: new Date().toISOString(),
        reported_post_id: "post-1",
        reported_comment_id: null,
        community_id: "community-1",
      };
      repo._savedReports.push(r);

      const res = await service.getPendingReports();
      expect(res).toHaveLength(1);
      expect(res[0].id).toBe("r-1");
    });
  });

  describe("handleReportDecision", () => {
    it("approves report — updates status and deletes post", async () => {
      const r: Report = {
        id: "rep-approve",
        reporter_user_id: "u",
        reason: "bad",
        status: "PENDING",
        created_at: new Date().toISOString(),
        reported_post_id: "post-to-delete",
        reported_comment_id: null,
        community_id: "community-1",
      };
      repo._savedReports.push(r);

      (communityRepo.isOwner as jest.Mock).mockResolvedValueOnce(true);

      await service.handleReportDecision("rep-approve", "APPROVE", "admin-1");

      expect(repo.updateReportStatus).toHaveBeenCalledWith("rep-approve", "RESOLVED");
      expect(repo.deletePost).toHaveBeenCalledWith("post-to-delete");
    });

    it("rejects report — updates status and does not delete entity", async () => {
      const r: Report = {
        id: "rep-reject",
        reporter_user_id: "u",
        reason: "bad",
        status: "PENDING",
        created_at: new Date().toISOString(),
        reported_post_id: "post-keep",
        reported_comment_id: null,
        community_id: "community-1",
      };
      repo._savedReports.push(r);

      await service.handleReportDecision("rep-reject", "REJECT", "admin-1");

      expect(repo.updateReportStatus).toHaveBeenCalledWith("rep-reject", "REJECTED");
      expect(repo.deletePost).not.toHaveBeenCalled();
    });

    it("throws on invalid decision", async () => {
      await expect(service.handleReportDecision("x", "INVALID" as any, "a")).rejects.toThrow("Invalid decision");
    });

    it("throws when admin is not owner of community", async () => {
      const r: Report = {
        id: "rep-auth",
        reporter_user_id: "u",
        reason: "bad",
        status: "PENDING",
        created_at: new Date().toISOString(),
        reported_post_id: "post-1",
        reported_comment_id: null,
        community_id: "community-1",
      };
      repo._savedReports.push(r);

      (communityRepo.isOwner as jest.Mock).mockResolvedValueOnce(false);

      await expect(service.handleReportDecision("rep-auth", "APPROVE", "admin-2")).rejects.toThrow("Unauthorized");
    });
  });
});
