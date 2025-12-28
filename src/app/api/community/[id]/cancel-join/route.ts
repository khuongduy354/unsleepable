import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// POST /api/community/[id]/cancel-join - Cancel a pending join request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    await communityService.cancelJoinRequest(id, userId);

    return NextResponse.json(
      { message: "Join request cancelled successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error cancelling join request:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to cancel join request";

    let statusCode = 400;
    if (errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("not found")) {
      statusCode = 404;
    } else if (errorMessage.includes("No pending")) {
      statusCode = 409;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
