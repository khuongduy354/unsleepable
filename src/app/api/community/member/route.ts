import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// GET /api/community/member - Get communities where the authenticated user is a member
export async function GET(request: NextRequest) {
  try {
    // Extract user ID from auth
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "100");

    const result = await communityService.getMemberCommunities(
      userId,
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching member communities:", error);
    const statusCode =
      error instanceof Error && error.message.includes("Unauthorized")
        ? 401
        : 400;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch member communities",
      },
      { status: statusCode }
    );
  }
}
