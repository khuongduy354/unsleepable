import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get user ID from Supabase session
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;
    const postService = await service.getPostService();
    const pendingPosts = await postService.getPendingPostsByAdmin(userId);

    return NextResponse.json({ posts: pendingPosts });
  } catch (error) {
    console.error("Error fetching pending posts:", error);
    return NextResponse.json(
      { error: "Failed to fetch pending posts" },
      { status: 500 }
    );
  }
}
