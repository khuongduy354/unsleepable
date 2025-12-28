// GET /api/user/[username] - Get user profile by username

import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

export async function GET(
  request: NextRequest,
  { params }: { params: { username: string } }
) {
  try {
    const { username } = params;

    if (!username) {
      return NextResponse.json(
        { error: "Username is required." },
        { status: 400 }
      );
    }

    const userService = await service.getUserService();
    const profile = await userService.getUserByUsername(username);

    if (!profile) {
      return NextResponse.json(
        { error: "User not found." },
        { status: 404 }
      );
    }

    // Return public profile (don't expose sensitive data)
    return NextResponse.json({
      id: profile.id,
      username: profile.username,
      created_at: profile.created_at,
      status: profile.status,
    });
  } catch (error) {
    console.error("Error fetching user by username:", error);
    return NextResponse.json(
      { error: "Failed to fetch user profile.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
