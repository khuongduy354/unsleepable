import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// POST /api/community/[id]/members/[userId]/approve - Approve a member request
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; userId: string }> }
) {
  try {
    const { id: communityId, userId } = await params;
    const adminId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    await communityService.approveMember(communityId, userId, adminId);

    return NextResponse.json(
      { message: "Member approved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving member:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Failed to approve member";
    const statusCode = errorMessage.includes("Unauthorized") ? 403 : 400;

    return NextResponse.json({ error: errorMessage }, { status: statusCode });
  }
}
