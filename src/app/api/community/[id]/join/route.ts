import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// POST /api/community/[id]/join - Join a community (creates pending request)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    const result = await communityService.joinCommunity(id, userId);

    return NextResponse.json(
      {
        status: result.status,
        message: result.message,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error joining community:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to join community";

    let statusCode = 400;
    if (errorMessage.includes("Unauthorized")) {
      statusCode = 401;
    } else if (errorMessage.includes("not found")) {
      statusCode = 404;
    } else if (errorMessage.includes("already a member")) {
      statusCode = 409;
    }

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
