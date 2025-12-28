import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { UpdatePostDTO } from "@/lib/types/post.type";

// GET /api/posts/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postService = await service.getPostService();
    const post = await postService.getPostById(id);

    if (!post) {
      return NextResponse.json({ error: "Post not found" }, { status: 404 });
    }

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error fetching post:", error);
    return NextResponse.json(
      { error: "Failed to fetch post" },
      { status: 500 }
    );
  }
}

// PATCH /api/posts/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postService = await service.getPostService();
    const body = await request.json();

    const updateData: UpdatePostDTO = {
      title: body.title,
      content: body.content,
      shortUrl: body.shortUrl,
      summary: body.summary,
    };

    if (body.shortUrl) {
      const exist = await postService.getPostByShortUrl(body.shortUrl);

      if (exist && exist.id !== id) {
        return NextResponse.json(
          { error: "Short URL already exists" },
          { status: 400 }
        );
      }

      updateData.shortUrl = body.shortUrl;
    }

    const post = await postService.updatePost(id, updateData);

    return NextResponse.json({ post });
  } catch (error) {
    console.error("Error updating post:", error);

    const statusCode =
      error instanceof Error && error.message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to update post",
      },
      { status: statusCode }
    );
  }
}

// DELETE /api/posts/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const postService = await service.getPostService();
    await postService.deletePost(id);

    return NextResponse.json(
      { message: "Post deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting post:", error);
    const statusCode =
      error instanceof Error && error.message.includes("not found") ? 404 : 400;

    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Failed to delete post",
      },
      { status: statusCode }
    );
  }
}
