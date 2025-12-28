import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const adminId = await requireAuth(request); // Get the admin user ID
    const postService = await service.getPostService();
    const post = await postService.approvePost(id, adminId);

    return NextResponse.json(
      { post, message: "Post approved successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error approving post:", error);
    const statusCode =
      error instanceof Error && error.message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to approve post",
      },
      { status: statusCode }
    );
  }
}
