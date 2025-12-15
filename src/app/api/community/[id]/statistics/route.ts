import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

/**
 * GET /api/community/[id]/statistics
 * * Mục đích: Lấy dữ liệu thống kê chi tiết cho cộng đồng [id].
 * Yêu cầu quyền: Chỉ Admin cục bộ của cộng đồng mới được phép truy cập.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const communityId = params.id;

  try {
    const userId = requireAuth(request);

    // Lấy Service Layer
    const communityService = await service.getCommunityService();

    const statistics = await communityService.getStats(
      communityId,
      userId 
    );
    return NextResponse.json({ statistics });
    
  } catch (error) {
    console.error(`Error fetching statistics for community ${communityId}:`, error);
    
    // handle error
    let statusCode = 400;
    const errorMessage = error instanceof Error ? error.message : "Failed to fetch community statistics";

    if (errorMessage.includes("Unauthorized")) {
      statusCode = 401; 
    } else if (errorMessage.includes("Forbidden") || errorMessage.includes("not the owner")) {
      statusCode = 403; 
    } else if (errorMessage.includes("not found")) {
      statusCode = 404; 
    } else if (errorMessage.includes("Validation failed")) {
      statusCode = 422; 
    }

    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}