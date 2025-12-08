"use client";

import { useState } from "react";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

export default function UploadButton() {
  const supabase = createClientComponentClient();
  const [uploading, setUploading] = useState(false);

  async function handleUpload(e: any) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    // 1. Upload lên Supabase Storage
    const { data, error } = await supabase.storage
      .from("uploads")
      .upload(`public/${Date.now()}-${file.name}`, file);

    if (error) {
      console.error(error);
      setUploading(false);
      return;
    }

    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/uploads/${data.path}`;

    // 2. Gửi URL sang backend để lưu DB
    await fetch("/api/upload", {
      method: "POST",
      body: JSON.stringify({ url }),
    });

    setUploading(false);
    alert("Uploaded!");
  }

  return (
    <div>
      <input type="file" onChange={handleUpload} />
      {uploading && <p>Uploading...</p>}
    </div>
  );
}
