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

    console.log("printing filePath:", filePath);
    const { data: storageData, error: uploadError } =
      await supabaseAdmin.storage
        .from("media") // Make sure this bucket exists!
        .upload(filePath, fileBuffer, {
          contentType: file.type,
          upsert: false,
        });

    console.info("Successfully upload image")

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

