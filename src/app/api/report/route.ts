import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index"; // Dùng setup Service đã cập nhật
import { requireAuth } from "@/lib/auth-middleware";
import { CreateReportData } from "@/lib/types/report.type";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);

    const body = await request.json();

    const reportData: CreateReportData = {
      reportedEntityId: body.reportedEntityId,
      reportedEntityType: body.reportedEntityType,
      reason: body.reason,
    };

    const reportService = await service.getReportService();
    const newReport = await reportService.createReport(reportData, userId);

    return NextResponse.json(
      { report: newReport, message: "Report submitted successfully." },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating report:", error);

    let statusCode = 400;
    const errorMessage =
      error instanceof Error ? error.message : "Failed to create report";

    if (errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("Validation Error")) {
      statusCode = 422;
    } else if (errorMessage.includes("Not Found")) {
      statusCode = 404;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
