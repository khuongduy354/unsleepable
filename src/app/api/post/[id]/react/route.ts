import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !["like", "dislike"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type. Must be 'like' or 'dislike'" },
        { status: 400 }
      );
    }

    const postService = await service.getPostService();
    await postService.reactToPost(postId, userId, type);

    return NextResponse.json(
      { message: `Post ${type}d successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reacting to post:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to react to post",
      },
      { status: 500 }
    );
  }
}
