// GET /api/post/trending - Get trending posts

import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');

    // Validate limit
    if (limit < 1 || limit > 50) {
      return NextResponse.json(
        { error: "Limit must be between 1 and 50." },
        { status: 400 }
      );
    }

    const postService = await service.getPostService();
    const trendingPosts = await postService.getTrendingPosts(limit);

    return NextResponse.json({
      posts: trendingPosts,
      count: trendingPosts.length,
    });
  } catch (error) {
    console.error("Error fetching trending posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch trending posts.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
