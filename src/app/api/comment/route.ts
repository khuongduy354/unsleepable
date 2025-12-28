import { NextRequest, NextResponse } from "next/server";
import { getPostService } from "@/lib/setup/production-setup";
import { service } from "@/lib/setup/index";

export async function POST(request: NextRequest) {
  try {
    const postService = await getPostService();
    const body = await request.json();
    const comment = await postService.createComment(body);

    // Send notification to post author (if not self-commenting)
    if (body.post_id && body.user_id) {
      try {
        const post = await postService.getPostById(body.post_id);
        if (post && post.user_id && post.user_id !== body.user_id) {
          const notificationService = await service.getNotificationService();
          await notificationService.sendToUser(post.user_id, {
            title: "New Comment!",
            body: `Someone commented on your post "${
              post.title?.substring(0, 30) || "your post"
            }..."`,
            data: {
              type: "comment",
              postId: body.post_id,
              url: `/posts/${body.post_id}`,
            },
          });
        }
      } catch (notifError) {
        // Don't fail the comment if notification fails
        console.error("Failed to send notification:", notifError);
      }
    }

    return NextResponse.json(comment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to create comment",
      },
      { status: 400 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const postService = await getPostService();
    const { searchParams } = new URL(request.url);
    const postId = searchParams.get("postId");

    if (postId) {
      const comments = await postService.getCommentsByPost(postId);
      return NextResponse.json(comments);
    }

    return NextResponse.json({ error: "postId is required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to fetch comments",
      },
      { status: 500 }
    );
  }
}
