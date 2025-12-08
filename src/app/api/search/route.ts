import { NextRequest, NextResponse } from "next/server";
import { getSearchService } from "@/lib/setup/production-setup";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    const communityId = searchParams.get("communityId");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");

    // Validate required query parameter
    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const searchService = await getSearchService();
    
    const results = await searchService.searchPosts({
      query,
      communityId: communityId || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });

    return NextResponse.json(results);
  } catch (error: any) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to search posts" },
      { status: 500 }
    );
  }
}
