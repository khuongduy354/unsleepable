import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// GET /api/community/[id]/members/pending - Get pending member requests
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: communityId } = await params;
    const adminId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    const pendingMembers = await communityService.getPendingMembers(
      communityId,
      adminId
    );

    return NextResponse.json({ pendingMembers });
  } catch (error) {
    console.error("Error fetching pending members:", error);
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Failed to fetch pending members";
    const statusCode = errorMessage.includes("Unauthorized") ? 403 : 400;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
