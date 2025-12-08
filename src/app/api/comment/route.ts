import { NextRequest, NextResponse } from "next/server";
import { getPostService } from "@/lib/setup/production-setup";

export async function POST(request: NextRequest) {
  try {
    const postService = await getPostService();
    const body = await request.json();
    const comment = await postService.createComment(body);
    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create comment" },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const postService = await getPostService();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (postId) {
      const comments = await postService.getCommentsByPost(postId);
      return NextResponse.json(comments);
    }

    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch comments" },
      { status: 500 }
    );
  }
}
