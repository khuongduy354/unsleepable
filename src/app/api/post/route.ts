import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { CreatePostDTO, PostFilters } from "@/lib/types/post.type";

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
    const postService = await service.getPostService();
    const body: CreatePostDTO = await request.json();

    const post = await postService.createPost(body);

    return NextResponse.json({ post }, { status: 201 });
  } catch (error) {
    console.error("Error creating post:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to create post",
      },
      { status: 400 }
    );
  }
}
