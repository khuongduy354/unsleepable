import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /api/notification/vapid
 * Returns the VAPID public key needed for push subscriptions
 */
export async function GET() {
  try {
    const notificationService = await service.getNotificationService();
    const publicKey = notificationService.getVapidPublicKey();

    return NextResponse.json({ publicKey });
  } catch (error) {
    console.error("Error getting VAPID key:", error);
    return NextResponse.json(
      { error: "Failed to get VAPID key" },
      { status: 500 }
    );
  }
}
