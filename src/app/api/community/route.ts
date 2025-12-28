import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import {
  CreateCommunityDTO,
  CommunityFilters,
} from "@/lib/types/community.type";
import { requireAuth } from "@/lib/auth-middleware";

// GET /api/community - Get all communities (paginated)
export async function GET(request: NextRequest) {
  try {
    const communityService = await service.getCommunityService();

    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const visibility = searchParams.get("visibility") as
      | "public"
      | "private"
      | null;

    // Build filters object
    const filters: CommunityFilters = {
      page,
      limit,
    };

    if (visibility) {
      filters.visibility = visibility;
    }

    const result = await communityService.getCommunities(filters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error fetching communities:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch communities",
      },
      { status: 400 }
    );
  }
}

// POST /api/community - Create a new community
export async function POST(request: NextRequest) {
  try {
    // Extract user ID from mock auth
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    const body = await request.json();

    const createData: CreateCommunityDTO = {
      name: body.name,
      description: body.description,
      visibility: body.visibility,
      creator_id: userId,
      tags: body.tags || [],
    };

    const community = await communityService.createCommunity(createData);

    return NextResponse.json({ community }, { status: 201 });
  } catch (error) {
    console.error("Error creating community:", error);
    const statusCode =
      error instanceof Error && error.message.includes("Unauthorized")
        ? 401
        : 400;
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create community",
      },
      { status: statusCode }
    );
  }
}
