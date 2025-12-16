import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// GET /api/community/owned - Get communities owned by the authenticated user
export async function GET(request: NextRequest) {
  try {
    // Extract user ID from mock auth
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();

    // Parse query parameters for pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    const result = await communityService.getOwnedCommunities(
      userId,
      page,
      limit
    );

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching owned communities:", error);
    const statusCode =
      error instanceof Error && error.message.includes("Unauthorized")
        ? 401
        : 400;
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch owned communities",
      },
      { status: statusCode }
    );
  }
}
