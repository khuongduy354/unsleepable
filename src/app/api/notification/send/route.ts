import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/notification/send
 * Send a notification to all subscribed users
 * This is for demo purposes - in production, this should be properly secured
 */
export async function POST(request: NextRequest) {
  try {
    // const supabase = await createClient();
    // const {
    //   data: { user },
    // } = await supabase.auth.getUser();

    // if (!user) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }

    const body = await request.json();
    const { title, body: messageBody, icon, data } = body;

    if (!title || !messageBody) {
      return NextResponse.json(
        { error: "Title and body are required" },
        { status: 400 }
      );
    }

    const notificationService = await service.getNotificationService();
    
    // Send to all users
    await notificationService.sendToAll({
      title,
      body: messageBody,
      icon,
      data,
    });

    return NextResponse.json({ success: true, message: "Notification sent to all users" });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json(
      { error: "Failed to send notification" },
      { status: 500 }
    );
  }
}
