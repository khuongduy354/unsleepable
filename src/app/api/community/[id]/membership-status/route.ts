import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// GET /api/community/[id]/membership-status - Get user's membership status in a community
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    const status = await communityService.getMembershipStatus(id, userId);

    return NextResponse.json({ status }, { status: 200 });
  } catch (error) {
    console.error("Error getting membership status:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to get membership status";

    let statusCode = 400;
    if (errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("not found")) {
      statusCode = 404;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
