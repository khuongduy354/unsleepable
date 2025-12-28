import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { CreatePostDTO, PostFilters } from "@/lib/types/post.type";
import { requireAuth } from "@/lib/auth-middleware";

export async function GET(request: NextRequest) {
  try {
    const postService = await service.getPostService();

    // Parse query parameters for filtering
    const { searchParams } = new URL(request.url);
    const authorId = searchParams.get("authorId");

    // Build filters object
    const filters: PostFilters = {};
    if (authorId) {
      filters.authorId = authorId;
    }

    // Delegate filtering logic to service layer
    const posts = await postService.getPosts(filters);

    return NextResponse.json({ posts });
  } catch (error) {
    console.error("Error fetching posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch posts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireAuth(request);
    const postService = await service.getPostService();
    const communityService = await service.getCommunityService();
    const body = await request.json();

    // Check if user is a member of the community
    if (body.community_id) {
      const isMember = await communityService.isMember(
        body.community_id,
        userId
      );
      if (!isMember) {
        return NextResponse.json(
          { error: "You must be a member of this community to post" },
          { status: 403 }
        );
      }
    }

    // Create post with authenticated user ID
    const postData: CreatePostDTO = {
      ...body,
      author_id: userId,
    };

    const post = await postService.createPost(postData);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    const statusCode =
      error instanceof Error && error.message === "Unauthorized" ? 401 : 400;
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create post",
      },
      { status: statusCode }
    );
  }
}
