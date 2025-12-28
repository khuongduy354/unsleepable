import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

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

    const adminId = await requireAuth(request);
    const reportService = await service.getReportService();
    await reportService.handleReportDecision(
      id,
      decision as "APPROVE" | "REJECT",
      adminId
    );

    return NextResponse.json(
      { message: `Report ${decision.toLowerCase()}ed successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error handling report decision:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to handle report";
    const statusCode = errorMessage.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error: errorMessage,
      },
      { status: statusCode }
    );
  }
}
