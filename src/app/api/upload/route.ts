import { supabaseAdmin } from "@/utils/supabase/admin";
import { requireAuth } from "@/lib/auth-middleware";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Require authentication for uploads
    let userId: string;
    try {
      userId = await requireAuth(req);
      console.log("userId:", userId);

    } catch {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }finally{
    }

    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const filePath = `uploads/${Date.now()}-${file.name}`;

    console.log("printing filePath:", filePath);
    const { data: storageData, error: uploadError } =
      await supabaseAdmin.storage
        .from("media") // Make sure this bucket exists!
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

    console.info("Successfully upload image");

    if (uploadError) {
      console.error("Supabase upload error:", uploadError);
      return NextResponse.json(
        { error: `Upload failed: ${uploadError.message}` },
        { status: 500 }
      );
    }

    const { data: urlData } = supabaseAdmin.storage
      .from("media")
      .getPublicUrl(filePath);

    // Record the upload in Asset table
    const { error: assetError } = await supabaseAdmin.from("Asset").insert({
      filename: filePath,
      type: file.type,
      size: file.size,
      url: urlData.publicUrl,
      user_id: userId, // Will be null for anonymous uploads
    });

    if (assetError) {
      console.error("Error recording asset:", assetError);
      // Don't fail the upload, just log the error
    }

    return NextResponse.json({
      success: true,
      url: urlData.publicUrl,
      path: filePath,
      contentType: file.type,
      size: file.size,
    });
  } catch (e: any) {
    console.error("Server error:", e);
    return NextResponse.json(
      { error: e.message || "Internal server error" },
      { status: 500 }
    );
  }
}
