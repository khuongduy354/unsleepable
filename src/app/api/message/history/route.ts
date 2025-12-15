// src/app/api/messages/history/route.ts (GET - Truy vấn Lịch sử)

import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
// import { requireAuth } from "@/lib/auth-middleware"; //

export async function GET(request: NextRequest) {
  try {
    // const userId = requireAuth(request); // Xác thực người dùng hiện tại

    const { searchParams } = new URL(request.url);
    
    // Lấy ID người chat cùng và các tham số phân trang
    const partnerId = searchParams.get('partnerId');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    // Giả sử userId của người dùng hiện tại được lấy từ Auth/Session
    const currentUserId = "d98b88c0-f5f1-4f5a-aed1-56c8937f2f33"; // THAY THẾ BẰNG userId THỰC TẾ

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