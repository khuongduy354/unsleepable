import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

export async function GET(request: NextRequest) {
  try {
    const postService = await service.getPostService();
    const pendingPosts = await postService.getPendingPosts();

    return NextResponse.json({ posts: pendingPosts });
  } catch (error) {
    console.error("Error fetching pending posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending posts" },
      { status: 500 }
    );
  }
}
