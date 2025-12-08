import { NextRequest, NextResponse } from "next/server";
import { getPostService } from "@/lib/setup/production-setup";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const postService = await getPostService();
    const { id } = await params;
    const comment = await postService.getCommentById(id);

    if (!comment) {
      return NextResponse.json({ error: "Comment not found" }, { status: 404 });
    }

    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch comment" },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const postService = await getPostService();
    const { id } = await params;
    const body = await request.json();
    const comment = await postService.updateComment(id, body);
    return NextResponse.json(comment);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to update comment" },
      { status: 400 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const postService = await getPostService();
    const { id } = await params;
    await postService.deleteComment(id);
    return NextResponse.json({ message: "Comment deleted" });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to delete comment" },
      { status: 400 }
    );
  }
}
