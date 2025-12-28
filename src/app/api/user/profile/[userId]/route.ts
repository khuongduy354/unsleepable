// GET /api/user/profile/[userId] - Get user profile by ID

import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { createClient } from "@/utils/supabase/server";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await context.params;

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required." },
        { status: 400 }
      );
    }

    // Get current user to determine if viewing own profile
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const userService = await service.getUserService();
    const profile = await userService.getProfile(userId);

    if (!profile) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // If viewing own profile, return full info including email
    if (currentUserId === userId) {
      return NextResponse.json(profile);
    }

    // Return public profile (don't expose sensitive data like email)
    return NextResponse.json({
      id: profile.id,
      username: profile.username,
      created_at: profile.created_at,
      status: profile.status,
    });
  } catch (error) {
    console.error("Error fetching user by ID:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
