// src/app/api/message/conversations/route.ts
import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { createClient } from "@/utils/supabase/server";

export async function GET(request: NextRequest) {
  try {
    // Get authenticated user from session
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session?.user) {
      return NextResponse.json(
        { error: "Unauthorized. Please login." },
        { status: 401 }
      );
    }
    
    const currentUserId = session.user.id;

    const messageService = await service.getMessageService();
    const conversations = await messageService.getConversations(currentUserId);

    return NextResponse.json(conversations);
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json(
      { error: "Failed to fetch conversations.", details: (error as Error).message },
      { status: 500 }
    );
  }
}
