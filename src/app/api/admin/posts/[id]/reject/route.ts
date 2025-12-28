import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postService = await service.getPostService();
    const post = await postService.rejectPost(id);

    return NextResponse.json(
      { post, message: "Post rejected successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error rejecting post:", error);
    const statusCode =
      error instanceof Error && error.message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to reject post",
      },
      { status: statusCode }
    );
  }
}
