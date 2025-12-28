// GET /api/user/profile - Get current user profile
// PUT /api/user/profile - Update current user profile

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { service } from "@/lib/setup/index";

// GET - Get current user profile
export async function GET(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const userService = await service.getUserService();
    const profile = await userService.getProfile(session.user.id);

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Failed to fetch profile.", details: (error as Error).message },
      { status: 500 }
    );
  }
}

// PUT - Update current user profile
export async function PUT(request: NextRequest) {
  try {
    // Get authenticated user
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { username, email } = body;

    // Validate input
    if (!username && !email) {
      return NextResponse.json(
        { error: "At least one field (username or email) is required." },
        { status: 400 }
      );
    }

    const userService = await service.getUserService();
    const updatedProfile = await userService.updateProfile(session.user.id, {
      username,
      email,
    });

    return NextResponse.json(updatedProfile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    const statusCode = (error as Error).message.includes("already taken") || 
                       (error as Error).message.includes("Invalid") ||
                       (error as Error).message.includes("must") ? 400 : 500;
    
    return NextResponse.json(
      { error: "Failed to update profile.", details: (error as Error).message },
      { status: statusCode }
    );
  }
}
