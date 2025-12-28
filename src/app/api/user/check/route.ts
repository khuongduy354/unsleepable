// GET /api/user/check/username?username=xxx - Check username availability
// GET /api/user/check/email?email=xxx - Check email availability

import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const email = searchParams.get("email");

    // Get current user ID if authenticated (for excluding own username/email)
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    const currentUserId = session?.user?.id;

    const userService = await service.getUserService();

    if (username) {
      const isAvailable = await userService.checkUsernameAvailability(
        username,
        currentUserId
      );
      return NextResponse.json({ available: isAvailable });
    }

    if (email) {
      const isAvailable = await userService.checkEmailAvailability(
        email,
        currentUserId
      );
      return NextResponse.json({ available: isAvailable });
    }

    return NextResponse.json(
      { error: "Username or email parameter is required." },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error checking availability:", error);
    return NextResponse.json(
      { error: "Failed to check availability.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
