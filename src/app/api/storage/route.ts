import { supabaseAdmin } from "@/utils/supabase/admin";
import { requireAuth } from "@/lib/auth-middleware";
import { NextRequest, NextResponse } from "next/server";

// GET - List user's files
export async function GET(req: NextRequest) {
  try {
    const userId = await requireAuth(req);

    // Get user's files from Asset table
    const { data: assets, error } = await supabaseAdmin
      .from("Asset")
      .select("id, filename, type, size, url, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching assets:", error);
      return NextResponse.json(
        { error: "Failed to fetch files" },
        { status: 500 }
      );
    }

    // Calculate total storage used
    const totalSize =
      assets?.reduce((sum, asset) => sum + (asset.size || 0), 0) || 0;

    return NextResponse.json({
      files: assets || [],
      totalSize,
    });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Server error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - Delete a file
export async function DELETE(req: NextRequest) {
  try {
    const userId = await requireAuth(req);
    const { searchParams } = new URL(req.url);
    const assetId = searchParams.get("id");

    if (!assetId) {
      return NextResponse.json(
        { error: "Asset ID is required" },
        { status: 400 }
      );
    }

    // First, get the asset to verify ownership and get filename
    const { data: asset, error: fetchError } = await supabaseAdmin
      .from("Asset")
      .select("id, filename, user_id")
      .eq("id", assetId)
      .single();

    if (fetchError || !asset) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Verify ownership
    if (asset.user_id !== userId) {
      return NextResponse.json(
        { error: "Unauthorized to delete this file" },
        { status: 403 }
      );
    }

    // Delete from Supabase Storage
    if (asset.filename) {
      const { error: storageError } = await supabaseAdmin.storage
        .from("media")
        .remove([asset.filename]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        // Continue to delete from database even if storage delete fails
      }
    }

    // Delete from Asset table
    const { error: deleteError } = await supabaseAdmin
      .from("Asset")
      .delete()
      .eq("id", assetId);

    if (deleteError) {
      console.error("Database delete error:", deleteError);
      return NextResponse.json(
        { error: "Failed to delete file" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("Server error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
