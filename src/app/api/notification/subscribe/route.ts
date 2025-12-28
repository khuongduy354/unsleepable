import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/notification/subscribe
 * Subscribe a user to push notifications
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { subscription } = body;

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 }
      );
    }

    const notificationService = await service.getNotificationService();
    await notificationService.subscribe(user.id, subscription);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error subscribing to notifications:", error);
    return NextResponse.json({ error: "Failed to subscribe" }, { status: 500 });
  }
}

/**
 * DELETE /api/notification/subscribe
 * Unsubscribe a user from push notifications
 */
export async function DELETE() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notificationService = await service.getNotificationService();
    await notificationService.unsubscribe(user.id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error unsubscribing from notifications:", error);
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
