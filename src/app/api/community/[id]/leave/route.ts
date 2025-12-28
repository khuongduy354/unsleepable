import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// POST /api/community/[id]/leave - Leave a community
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    await communityService.leaveCommunity(id, userId);

    return NextResponse.json(
      { message: "Successfully left the community" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error leaving community:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to leave community";

    let statusCode = 400;
    if (errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("not found")) {
      statusCode = 404;
    } else if (errorMessage.includes("not a member")) {
      statusCode = 409;
    } else if (errorMessage.includes("Owner cannot leave")) {
      statusCode = 403;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
