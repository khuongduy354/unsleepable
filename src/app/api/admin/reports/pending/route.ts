import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

export async function GET(request: NextRequest) {
  try {
    const reportService = await service.getReportService();
    const pendingReports = await reportService.getPendingReports();

    return NextResponse.json({ reports: pendingReports });
  } catch (error) {
    console.error("Error fetching pending reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending reports" },
      { status: 500 }
    );
  }
}
