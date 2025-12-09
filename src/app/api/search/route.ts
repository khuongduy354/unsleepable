import { NextRequest, NextResponse } from "next/server";
import { getSearchService } from "@/lib/setup/production-setup";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const query = searchParams.get("q");
    const communityId = searchParams.get("communityId");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    
    // Tag filters: orTags, andTags, notTags (comma-separated)
    const orTags = searchParams.get("orTags");
    const andTags = searchParams.get("andTags");
    const notTags = searchParams.get("notTags");

    if (!query) {
      return NextResponse.json(
        { error: "Query parameter 'q' is required" },
        { status: 400 }
      );
    }

    const searchService = await getSearchService();
    
    const tagFilters = [];
    if (orTags) {
      tagFilters.push({
        tags: orTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        operator: 'OR' as const
      });
    }
    if (andTags) {
      tagFilters.push({
        tags: andTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        operator: 'AND' as const
      });
    }
    if (notTags) {
      tagFilters.push({
        tags: notTags.split(',').map(t => t.trim()).filter(t => t.length > 0),
        operator: 'NOT' as const
      });
    }
    
    const results = await searchService.searchPosts({
      query,
      tagFilters: tagFilters.length > 0 ? tagFilters : undefined,
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
