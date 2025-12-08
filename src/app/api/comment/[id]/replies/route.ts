import { NextRequest, NextResponse } from "next/server";
import { getPostService } from "@/lib/setup/production-setup";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const postService = await getPostService();
    const { id } = await params;
    const replies = await postService.getRepliesByComment(id);
    return NextResponse.json(replies);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch replies" },
      { status: 500 }
    );
  }
}
