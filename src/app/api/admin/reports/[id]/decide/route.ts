import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { decision } = body;

    if (!decision || !["APPROVE", "REJECT"].includes(decision)) {
      return NextResponse.json(
        { error: "Invalid decision. Must be 'APPROVE' or 'REJECT'." },
        { status: 400 }
      );
    }

    const reportService = await service.getReportService();
    const adminId = "admin-user-id"; // TODO: Get from auth context
    await reportService.handleReportDecision(id, decision, adminId);

    return NextResponse.json(
      { message: `Report ${decision.toLowerCase()}ed successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling report decision:", error);
    const statusCode =
      error instanceof Error && error.message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to handle report",
      },
      { status: statusCode }
    );
  }
}
