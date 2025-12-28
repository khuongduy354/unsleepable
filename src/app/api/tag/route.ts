import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

// GET /api/tag - Get all tags or tags by community
export async function GET(request: NextRequest) {
  try {
    const tagService = await service.getTagService();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const communityId = searchParams.get("communityId");

    let tags;
    if (communityId) {
      tags = await tagService.getTagsByCommunity(communityId);
    } else {
      tags = await tagService.getAllTags();
    }

    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to fetch tags",
      },
      { status: 400 }
    );
  }
}
