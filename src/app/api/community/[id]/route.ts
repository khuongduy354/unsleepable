import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { UpdateCommunityDTO } from "@/lib/types/community.type";
import { requireAuth } from "@/lib/auth-middleware";

// GET /api/community/[id] - Get a specific community by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
  
) {
  try {
    const communityService = await service.getCommunityService();
    const community = await communityService.getCommunityById(params.id);

    if (!community) {
      return NextResponse.json(
        { error: "Community not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ community });
  } catch (error) {
    console.error("Error fetching community:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch community",
      },
      { status: 400 }
    );
  }
}

// PATCH /api/community/[id] - Update a community
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract user ID from mock auth
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    const body = await request.json();

    const updateData: UpdateCommunityDTO = {
      name: body.name,
      description: body.description,
      visibility: body.visibility,
    };

    const community = await communityService.updateCommunity(
      params.id,
      userId,
      updateData
    );

    return NextResponse.json({ community });
  } catch (error) {
    console.error("Error updating community:", error);
    const statusCode =
      error instanceof Error && error.message.includes("Unauthorized")
        ? 401
        : error instanceof Error && error.message.includes("not the owner")
        ? 403
        : error instanceof Error && error.message.includes("not found")
        ? 404
        : 400;

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to update community",
      },
      { status: statusCode }
    );
  }
}

// DELETE /api/community/[id] - Delete a community
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Extract user ID from mock auth
    const userId = await requireAuth(request);

    const communityService = await service.getCommunityService();
    await communityService.deleteCommunity(params.id, userId);

    return NextResponse.json(
      { message: "Community deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting community:", error);
    const statusCode =
      error instanceof Error && error.message.includes("Unauthorized")
        ? 401
        : error instanceof Error && error.message.includes("not the owner")
        ? 403
        : error instanceof Error && error.message.includes("not found")
        ? 404
        : 400;

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to delete community",
      },
      { status: statusCode }
    );
  }
}

