import { NextRequest, NextResponse } from "next/server";
import { getSearchService } from "@/lib/setup/production-setup";
import { createClient } from "@/utils/supabase/server";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    let query = searchParams.get("q");
    const communityId = searchParams.get("communityId");
    const limit = searchParams.get("limit");
    const offset = searchParams.get("offset");
    const sortBy = searchParams.get("sortBy") as "relevance" | "time" | null;

    // Tag filters: orTags, andTags, notTags (comma-separated)
    const orTags = searchParams.get("orTags");
    const andTags = searchParams.get("andTags");
    const notTags = searchParams.get("notTags");

    if (!query) {
      query = "";
    }

    // Get current user for access control validation
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const userId = user?.id;

    const searchService = await getSearchService();

    const tagFilters = [];
    if (orTags) {
      tagFilters.push({
        tags: orTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        operator: "OR" as const,
      });
    }
    if (andTags) {
      tagFilters.push({
        tags: andTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        operator: "AND" as const,
      });
    }
    if (notTags) {
      tagFilters.push({
        tags: notTags
          .split(",")
          .map((t) => t.trim())
          .filter((t) => t.length > 0),
        operator: "NOT" as const,
      });
    }

    const results = await searchService.searchPosts({
      query,
      tagFilters: tagFilters.length > 0 ? tagFilters : undefined,
      communityId: communityId || undefined,
      userId: userId || undefined,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
      sortBy: sortBy || "relevance",
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
