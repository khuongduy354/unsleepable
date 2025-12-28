// src/app/api/messages/history/route.ts (GET - Truy vấn Lịch sử)

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

    const { searchParams } = new URL(request.url);
    
    // Lấy ID người chat cùng và các tham số phân trang
    const partnerId = searchParams.get('partnerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    if (!partnerId) {
        return NextResponse.json({ error: "Partner ID is required." }, { status: 400 });
    }

    const messageService = await service.getMessageService();

    // Gọi service để lấy lịch sử
    const history = await messageService.getHistory(currentUserId, partnerId, limit, offset);

    return NextResponse.json(history);

  } catch (error) {
    console.error("Error fetching chat history:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history." },
      { status: 500 }
    );
  }
}