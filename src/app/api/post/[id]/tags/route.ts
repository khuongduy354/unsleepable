// File: src/app/api/posts/[id]/tags/route.ts

import { NextRequest, NextResponse } from "next/server";
import { service } from "@/lib/setup/index";
import { requireAuth } from "@/lib/auth-middleware";

// Interface for the expected request body for POST
interface TaggingBody {
  tagNames: string[];
}

// ----------------------------------------------------------------------
// POST /api/posts/[id]/tags - Process, create, and link tags to a specific post
// ----------------------------------------------------------------------
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Xác thực (Authorization): Chỉ người dùng đăng nhập mới được gắn thẻ
    // const userId = requireAuth(request); 
    const { id } = await params;
    const { tagNames }: TaggingBody = await request.json();

    if (!tagNames || tagNames.length === 0) {
      return NextResponse.json(
        { error: "Tag names array cannot be empty." },
        { status: 400 }
      );
    }
    
    const tagService = await service.getTagService();

    const linkedTags = await tagService.processAndLinkTags(id, tagNames);

    // 3. Phản hồi thành công
    return NextResponse.json(
      { 
        message: "Tags successfully processed and linked.",
        postId: id,
        linkedTags: linkedTags 
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error processing tags for post: ', error);

    // 4. Xử lý lỗi (Mapping lỗi nghiệp vụ sang HTTP Status Code)
    const statusCode =
      error instanceof Error && error.message.includes("Unauthorized")
        ? 401
        : error instanceof Error && error.message.includes("not found")
        ? 404
        : 400; // General bad request or service error

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to process and link tags.",
      },
      { status: statusCode }
    );
  }
}

// ----------------------------------------------------------------------
// GET /api/posts/[id]/tags - Retrieve all linked tags for a post
// ----------------------------------------------------------------------
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
    // 1. Xác thực (Authorization): Chỉ người dùng đăng nhập mới được gắn thẻ
    // const userId = requireAuth(request); 
      const { id } = await params;
      const tagService = await service.getTagService();

      // Gọi service để lấy danh sách tags đã liên kết
      const tags = await tagService.getTagsForPost(id);

      return NextResponse.json({ postId: id, tags: tags });
    } catch (error) {
        console.error(`Error fetching tags for post: `, error);
        return NextResponse.json(
            { error: "Failed to retrieve tags." },
            { status: 400 }
        );
    }
}