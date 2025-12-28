import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const userId = request.headers.get("x-user-id");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 401 }
      );
    }

    const supabase = await createClient();
    const notifications: any[] = [];

    // Get recent reactions on user's posts
    const { data: reactions, error: reactError } = await supabase
      .from("Reaction")
      .select(
        `
        id,
        type,
        created_at,
        user_id,
        post_id,
        Post!inner (
          id,
          title,
          user_id
        )
      `
      )
      .eq("Post.user_id", userId)
      .neq("user_id", userId) // Don't show own reactions
      .order("created_at", { ascending: false })
      .limit(10);

    if (!reactError && reactions) {
      for (const reaction of reactions) {
        // Get reactor's username
        const { data: user } = await supabase
          .from("UserAccount")
          .select("username")
          .eq("id", reaction.user_id)
          .single();

        notifications.push({
          id: reaction.id,
          type: reaction.type === "like" ? "like" : "dislike",
          title: reaction.type === "like" ? "New Like" : "New Dislike",
          message: `${user?.username || "Someone"} ${
            reaction.type
          }d your post "${(reaction as any).Post.title}"`,
          read: false,
          created_at: reaction.created_at,
          data: {
            post_id: reaction.post_id,
            reactor_id: reaction.user_id,
          },
        });
      }
    }

    // Get recent comments on user's posts
    const { data: comments, error: commError } = await supabase
      .from("Comments")
      .select(
        `
        id,
        content,
        created_at,
        user_id,
        post_id,
        Post!inner (
          id,
          title,
          user_id
        )
      `
      )
      .eq("Post.user_id", userId)
      .neq("user_id", userId) // Don't show own comments
      .order("created_at", { ascending: false })
      .limit(10);

    if (!commError && comments) {
      for (const comment of comments) {
        // Get commenter's username
        const { data: user } = await supabase
          .from("UserAccount")
          .select("username")
          .eq("id", comment.user_id)
          .single();

        notifications.push({
          id: comment.id,
          type: "comment",
          title: "New Comment",
          message: `${user?.username || "Someone"} commented on your post "${
            (comment as any).Post.title
          }"`,
          read: false,
          created_at: comment.created_at,
          data: {
            post_id: comment.post_id,
            comment_id: comment.id,
            commenter_id: comment.user_id,
          },
        });
      }
    }

    // Sort all notifications by created_at
    notifications.sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );

    return NextResponse.json({ notifications: notifications.slice(0, 20) });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch notifications",
      },
      { status: 500 }
    );
  }
}
