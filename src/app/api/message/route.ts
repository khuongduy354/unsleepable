import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";

// DTO cho dữ liệu tin nhắn nhận từ Socket Server
interface MessageDTO {
  senderId: string;
  receiverId: string;
  content: string;
}

// POST /api/messages - Endpoint được gọi bởi Socket Server để lưu tin nhắn
export async function POST(request: NextRequest) {
  try {
    const { senderId, receiverId, content }: MessageDTO = await request.json();

    // 1. Validate Dữ liệu Cơ bản
    if (!senderId || !receiverId || !content) {
      return NextResponse.json(
        { error: "Missing senderId, receiverId, or content." },
        { status: 400 }
      );
    }

    // Lưu ý: Cần thêm logic xác thực token/API key nếu endpoint này KHÔNG phải là public

    // 2. Gọi Service để lưu trữ
    const messageService = await service.getMessageService();

    const savedMessage = await messageService.sendMessage({
      sender_id: senderId,
      receiver_id: receiverId,
      content: content,
    });

    // 3. Send notification to receiver
    try {
      const notificationService = await service.getNotificationService();
      await notificationService.sendToUser(receiverId, {
        title: "New Message!",
        body: `You have a new message: "${content.substring(0, 50)}${
          content.length > 50 ? "..." : ""
        }"`,
        data: { type: "message", senderId, url: `/chat/${senderId}` },
      });
    } catch (notifError) {
      // Don't fail the message if notification fails
      console.error("Failed to send notification:", notifError);
    }

    // 4. Trả về tin nhắn đã lưu (để Socket Server có thể broadcast)
    return NextResponse.json(savedMessage, { status: 201 });
  } catch (error) {
    console.error("Error persisting message:", error);
    // Xử lý lỗi UUID (nếu sender/receiverId không phải UUID hợp lệ)
    const statusCode =
      error instanceof Error && error.message.includes("uuid") ? 400 : 500;

    return NextResponse.json(
      {
        error: "Failed to save message to database.",
        details: (error as Error).message,
      },
      { status: statusCode }
    );
  }
}
