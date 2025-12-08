import { supabaseAdmin } from "@/utils/supabase/admin";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = `uploads/${Date.now()}-${file.name}`;

    // Upload lên Supabase Storage
    const { data: storageData, error: uploadError } =
      await supabaseAdmin.storage
        .from("media")
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: true,
        });

    if (uploadError) {
      return NextResponse.json(
        { error: uploadError.message },
        { status: 500 }
      );
    }

    // Tạo public URL
    const { data: urlData } = supabaseAdmin.storage
      .from("media")
      .getPublicUrl(filePath);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: filePath,
      contentType: file.type,
      size: file.size
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    );
  }
}
