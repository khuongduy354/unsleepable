import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const postId = params.id;
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { type } = body;

    if (!type || !["like", "dislike"].includes(type)) {
      return NextResponse.json(
        { error: "Invalid reaction type. Must be 'like' or 'dislike'" },
        { status: 400 }
      );
    }

    const postService = await service.getPostService();

    // Get post to find author before reacting
    const post = await postService.getPostById(postId);

    await postService.reactToPost(postId, userId, type);

    // Send notification to post author (if not self-reacting)
    if (post && post.user_id && post.user_id !== userId) {
      try {
        const notificationService = await service.getNotificationService();
        await notificationService.sendToUser(post.user_id, {
          title: type === "like" ? "New Like!" : "New Dislike",
          body: `Someone ${type}d your post "${
            post.title?.substring(0, 30) || "your post"
          }..."`,
          data: { type, postId, url: `/posts/${postId}` },
        });
      } catch (notifError) {
        // Don't fail the reaction if notification fails
        console.error("Failed to send notification:", notifError);
      }
    }

    return NextResponse.json(
      { message: `Post ${type}d successfully` },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error reacting to post:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to react to post",
      },
      { status: 500 }
    );
  }
}
